import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { lookup } from "node:dns/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createChatCompletion,
  listModels,
  normalizeModelBaseUrl,
} from "./openai-compatible";
import { isPrivateAddress } from "./safe-http";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

const mockedLookup = vi.mocked(lookup);
const originalPrivateFlag = process.env.APEX_ALLOW_PRIVATE_ENDPOINTS;

type LoopbackServer = {
  server: ReturnType<typeof createServer>;
  baseUrl: string;
};
async function startLoopbackServer(
  handler: (request: IncomingMessage, response: ServerResponse) => void
): Promise<LoopbackServer> {
  const server = createServer(handler);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Loopback server did not bind a port.");
  return { server, baseUrl: `http://127.0.0.1:${address.port}/v1` };
}

async function closeLoopbackServer(server: LoopbackServer["server"]) {
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve()))
  );
}

function respondJson(response: ServerResponse, value: unknown, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}

beforeEach(() => {
  delete process.env.APEX_ALLOW_PRIVATE_ENDPOINTS;
  mockedLookup.mockResolvedValue([
    { address: "93.184.216.34", family: 4 },
  ] as never);
});

afterEach(() => {
  if (originalPrivateFlag === undefined)
    delete process.env.APEX_ALLOW_PRIVATE_ENDPOINTS;
  else process.env.APEX_ALLOW_PRIVATE_ENDPOINTS = originalPrivateFlag;
});

describe("model endpoint validation", () => {
  it("blocks reserved address ranges while allowing a public IPv4/IPv6 example", () => {
    expect(isPrivateAddress("203.0.113.10")).toBe(true);
    expect(isPrivateAddress("198.51.100.10")).toBe(true);
    expect(isPrivateAddress("198.1.51.10")).toBe(false);
    expect(isPrivateAddress("2001:db8::1")).toBe(true);
    expect(isPrivateAddress("2606:4700:4700::1111")).toBe(false);
    expect(isPrivateAddress("::ffff:127.0.0.1")).toBe(true);
  });

  it("normalizes a public HTTPS base URL", async () => {
    await expect(
      normalizeModelBaseUrl("https://api.example.test/v1/")
    ).resolves.toBe("https://api.example.test/v1");
    expect(mockedLookup).toHaveBeenCalledWith("api.example.test", {
      all: true,
      verbatim: true,
    });
  });

  it("rejects cleartext HTTP unless an operator enabled private endpoints", async () => {
    await expect(
      normalizeModelBaseUrl("http://127.0.0.1:11434/v1")
    ).rejects.toThrow(/HTTPS is required/);
  });

  it("rejects hostnames that resolve into private networks by default", async () => {
    mockedLookup.mockResolvedValue([
      { address: "10.20.30.40", family: 4 },
    ] as never);
    await expect(
      normalizeModelBaseUrl("https://model.example.test/v1")
    ).rejects.toThrow(/private or reserved network/i);
  });

  it("rejects embedded credentials and query strings", async () => {
    await expect(
      normalizeModelBaseUrl("https://user:secret@api.example.test/v1")
    ).rejects.toThrow(/credentials/);
    await expect(
      normalizeModelBaseUrl("https://api.example.test/v1?token=secret")
    ).rejects.toThrow(/query strings/);
  });

  it("allows an explicit local model endpoint only when the operator enables it", async () => {
    process.env.APEX_ALLOW_PRIVATE_ENDPOINTS = "true";
    await expect(
      normalizeModelBaseUrl("http://localhost:11434/v1/")
    ).resolves.toBe("http://localhost:11434/v1");
  });
});

describe("OpenAI-compatible model requests", () => {
  it("lists a real local model and sends bearer auth without returning the key", async () => {
    process.env.APEX_ALLOW_PRIVATE_ENDPOINTS = "true";
    const key = "test-only-model-key";
    const local = await startLoopbackServer((request, response) => {
      expect(request.headers.authorization).toBe(`Bearer ${key}`);
      if (request.url === "/v1/models")
        respondJson(response, { data: [{ id: "local-model" }] });
      else respondJson(response, { error: "not found" }, 404);
    });
    try {
      await expect(
        listModels({
          baseUrl: local.baseUrl,
          modelId: "local-model",
          apiKey: key,
        })
      ).resolves.toEqual(["local-model"]);
    } finally {
      await closeLoopbackServer(local.server);
    }
  });

  it("decodes actual function tool calls from a compatible completion response", async () => {
    process.env.APEX_ALLOW_PRIVATE_ENDPOINTS = "true";
    const local = await startLoopbackServer((_request, response) => {
      respondJson(response, {
        choices: [
          {
            message: {
              content: "",
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: { name: "get_workspace_status", arguments: "{}" },
                },
              ],
            },
          },
        ],
      });
    });
    try {
      const reply = await createChatCompletion(
        { baseUrl: local.baseUrl, modelId: "local-model" },
        [{ role: "user", content: "Check my workspace" }],
        [
          {
            type: "function",
            function: {
              name: "get_workspace_status",
              description: "Read real counts",
              parameters: {
                type: "object",
                properties: {},
                additionalProperties: false,
              },
            },
          },
        ]
      );
      expect(reply.toolCalls).toEqual([
        { id: "call_1", name: "get_workspace_status", arguments: "{}" },
      ]);
    } finally {
      await closeLoopbackServer(local.server);
    }
  });

  it("never follows redirects to another endpoint", async () => {
    process.env.APEX_ALLOW_PRIVATE_ENDPOINTS = "true";
    let requestCount = 0;
    const local = await startLoopbackServer((_request, response) => {
      requestCount += 1;
      response.writeHead(302, { Location: "/v1/redirect-target" });
      response.end();
    });
    try {
      await expect(
        listModels({ baseUrl: local.baseUrl, modelId: "local-model" })
      ).rejects.toThrow(/HTTP 302/);
      expect(requestCount).toBe(1);
    } finally {
      await closeLoopbackServer(local.server);
    }
  });

  it("does not echo upstream error bodies that might contain credentials", async () => {
    process.env.APEX_ALLOW_PRIVATE_ENDPOINTS = "true";
    const local = await startLoopbackServer((_request, response) => {
      response.writeHead(401);
      response.end("Bearer test-only-model-key");
    });
    try {
      await expect(
        listModels({
          baseUrl: local.baseUrl,
          modelId: "local-model",
          apiKey: "test-only-model-key",
        })
      ).rejects.toThrow("rejected its credential");
    } finally {
      await closeLoopbackServer(local.server);
    }
  });
});
