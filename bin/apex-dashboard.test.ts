import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type ServerResponse,
  type Server,
} from "node:http";
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getLocalModelConfig,
  getPublicLocalModelConfig,
  saveLocalModelConfig,
} from "./apex.mjs";
import { createLocalDashboardApp } from "./apex-dashboard.mjs";

const temporaryDirectories: string[] = [];
const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;

async function temporaryDirectory() {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "apex-dashboard-test-")
  );
  temporaryDirectories.push(directory);
  return directory;
}

async function closeServer(server: Server) {
  server.closeAllConnections?.();
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve()))
  );
}

async function startApp(
  app: Awaited<ReturnType<typeof createLocalDashboardApp>>
) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.once("listening", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test dashboard server did not bind to an ephemeral port.");
  app.locals.port = address.port;
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

async function readRequest(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
    model: string;
    messages: Array<{ role: string; content?: string | null }>;
    tools?: unknown[];
    tool_choice?: string;
    stream?: boolean;
  };
}

function respond(response: ServerResponse, value: unknown) {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}

async function api<T>(origin: string, route: string, init?: RequestInit) {
  const response = await fetch(`${origin}${route}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.method && init.method !== "GET" ? { Origin: origin } : {}),
      ...init?.headers,
    },
  });
  return {
    response,
    body: (await response.json()) as {
      ok: boolean;
      data?: T;
      error?: string;
    },
  };
}

async function requestWithHost(origin: string, host: string) {
  const url = new URL(origin);
  return new Promise<number>((resolve, reject) => {
    const request = httpRequest(
      {
        hostname: "127.0.0.1",
        port: Number(url.port),
        path: "/api/local/status",
        method: "GET",
        headers: { Host: host },
      },
      response => {
        response.resume();
        response.once("end", () => resolve(response.statusCode || 0));
      }
    );
    request.once("error", reject);
    request.end();
  });
}

async function waitFor<T>(read: () => Promise<T | null>, timeoutMs = 3_000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const value = await read();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error(
    "Timed out waiting for the local dashboard state transition."
  );
}

afterEach(async () => {
  if (originalXdgConfigHome === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map(directory => rm(directory, { recursive: true, force: true }))
  );
});

describe("APEX local dashboard and desktop runtime", () => {
  it("restricts API requests to the loopback Host and same-origin writes", async () => {
    const root = await temporaryDirectory();
    const app = await createLocalDashboardApp({
      root,
      configDir: path.join(root, "config"),
      staticDir: path.join(root, "no-ui"),
    });
    const { server, origin } = await startApp(app);
    const port = new URL(origin).port;

    try {
      const status = await api<{ root: string }>(origin, "/api/local/status");
      expect(status.response.status).toBe(200);
      expect(status.body.data?.root).toBe(root);

      const wrongHostStatus = await requestWithHost(
        origin,
        `attacker.example:${port}`
      );
      expect(wrongHostStatus).toBe(403);

      const wrongOrigin = await fetch(`${origin}/api/local/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: `http://attacker.example:${port}`,
        },
        body: JSON.stringify({ task: "This must be rejected." }),
      });
      expect(wrongOrigin.status).toBe(403);
    } finally {
      await closeServer(server);
    }
  });

  it("keeps cloud credentials encrypted and pauses a real local write for exact approval", async () => {
    const root = await temporaryDirectory();
    const projectRoot = path.join(root, "project");
    const configHome = path.join(root, "config-home");
    const configDir = path.join(configHome, "apex");
    await mkdir(projectRoot, { recursive: true });
    process.env.XDG_CONFIG_HOME = configHome;

    const apiKey = "unit-test-local-provider-key-never-save-plaintext";
    const writes: string[] = [];
    let completionCount = 0;
    const modelServer = createServer(
      async (request: IncomingMessage, response: ServerResponse) => {
        if (request.url === "/v1/models") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ data: [{ id: "test-model" }] }));
          return;
        }
        if (request.url !== "/v1/chat/completions") {
          response.writeHead(404).end();
          return;
        }
        writes.push(String(request.headers.authorization || ""));
        const body = await readRequest(request);
        expect(body.model).toBe("test-model");
        expect(body.tools?.length).toBeGreaterThan(0);
        completionCount += 1;
        if (completionCount === 1) {
          respond(response, {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "I can propose that change.",
                  tool_calls: [
                    {
                      id: "call_write_local_1",
                      type: "function",
                      function: {
                        name: "write_project_file",
                        arguments: JSON.stringify({
                          path: "notes.md",
                          content: "APEX local dashboard approval test\n",
                        }),
                      },
                    },
                  ],
                },
              },
            ],
          });
          return;
        }
        respond(response, {
          choices: [
            {
              message: {
                role: "assistant",
                content: "Created notes.md after your approval.",
              },
            },
          ],
        });
      }
    );
    await new Promise<void>((resolve, reject) => {
      modelServer.once("error", reject);
      modelServer.listen(0, "127.0.0.1", resolve);
    });
    const modelAddress = modelServer.address();
    if (!modelAddress || typeof modelAddress === "string")
      throw new Error("Test model server did not bind to an ephemeral port.");
    const modelUrl = `http://127.0.0.1:${modelAddress.port}/v1`;

    let dashboardServer: Server | undefined;
    try {
      await saveLocalModelConfig({
        provider: "openai-compatible",
        baseUrl: modelUrl,
        modelId: "test-model",
        apiKey,
      });
      const savedConfig = await readFile(
        path.join(configDir, "config.json"),
        "utf8"
      );
      expect(savedConfig).not.toContain(apiKey);
      expect(savedConfig).toContain("apiKeyEncrypted");
      expect((await getLocalModelConfig())?.apiKey).toBe(apiKey);
      const publicProfile = await getPublicLocalModelConfig();
      expect(publicProfile?.apiKeyConfigured).toBe(true);
      expect(publicProfile).not.toHaveProperty("apiKey");
      if (process.platform !== "win32") {
        expect((await stat(configDir)).mode & 0o777).toBe(0o700);
        expect(
          (await stat(path.join(configDir, "config.json"))).mode & 0o777
        ).toBe(0o600);
        expect(
          (await stat(path.join(configDir, "local-encryption.key"))).mode &
            0o777
        ).toBe(0o600);
      }

      const app = await createLocalDashboardApp({
        root: projectRoot,
        configDir,
        staticDir: path.join(root, "no-ui"),
      });
      const started = await startApp(app);
      dashboardServer = started.server;
      const runResponse = await api<{ id: string }>(
        started.origin,
        "/api/local/runs",
        {
          method: "POST",
          body: JSON.stringify({
            task: "Create a note and wait for my approval.",
          }),
        }
      );
      expect(runResponse.response.status).toBe(202);
      const runId = runResponse.body.data?.id;
      expect(runId).toBeTruthy();

      const pending = await waitFor(async () => {
        const result = await api<{
          runs: Array<{
            id: string;
            status: string;
            pendingApproval?: {
              id: string;
              path: string;
              safeContent: string;
            } | null;
          }>;
        }>(started.origin, "/api/local/status");
        const run = result.body.data?.runs.find(item => item.id === runId);
        return run?.pendingApproval
          ? { run, approval: run.pendingApproval }
          : null;
      });
      expect(pending.run.status).toBe("running");
      expect(pending.approval.path).toBe("notes.md");
      expect(pending.approval.safeContent).toContain(
        "APEX local dashboard approval test"
      );
      await expect(
        readFile(path.join(projectRoot, "notes.md"))
      ).rejects.toMatchObject({
        code: "ENOENT",
      });

      const approvalResponse = await api(
        started.origin,
        `/api/local/runs/${runId}/approvals/${pending.approval.id}`,
        {
          method: "POST",
          body: JSON.stringify({ approved: true }),
        }
      );
      expect(approvalResponse.response.status).toBe(200);

      const completed = await waitFor(async () => {
        const result = await api<{
          runs: Array<{
            id: string;
            status: string;
            message: string;
            steps: Array<{ status: string }>;
          }>;
        }>(started.origin, "/api/local/status");
        const run = result.body.data?.runs.find(item => item.id === runId);
        return run?.status === "completed" ? run : null;
      });
      expect(completed.message).toContain("Created notes.md");
      expect(completed.steps.some(step => step.status === "approved")).toBe(
        true
      );
      expect(await readFile(path.join(projectRoot, "notes.md"), "utf8")).toBe(
        "APEX local dashboard approval test\n"
      );
      expect(completionCount).toBe(2);
      expect(writes).toEqual([`Bearer ${apiKey}`, `Bearer ${apiKey}`]);
      const runFile = await readFile(
        path.join(configDir, "local-runs.json"),
        "utf8"
      );
      expect(runFile).not.toContain(apiKey);
    } finally {
      if (dashboardServer) await closeServer(dashboardServer);
      await closeServer(modelServer);
    }
  });
});
