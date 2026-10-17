import { execFile as execFileCallback } from "node:child_process";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFile = promisify(execFileCallback);
const cliPath = fileURLToPath(new URL("./apex.mjs", import.meta.url));
const temporaryDirectories: string[] = [];

async function temporaryDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "apex-cli-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

async function runCli(
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv }
) {
  return execFile(process.execPath, [cliPath, ...args], {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    timeout: 20_000,
    maxBuffer: 2_000_000,
  });
}

async function closeServer(server: ReturnType<typeof createServer>) {
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve()))
  );
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

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map(directory => rm(directory, { recursive: true, force: true }))
  );
});

describe("APEX local CLI", () => {
  it("shows the entire proposed file before a declined write and sends Ollama tools without forced tool_choice", async () => {
    const root = await temporaryDirectory();
    const projectRoot = path.join(root, "project");
    const configRoot = path.join(root, "config");
    await mkdir(projectRoot, { recursive: true });
    const starter = await runCli(
      ["skills", "starter", "interview-practice-coach"],
      { cwd: projectRoot, env: { XDG_CONFIG_HOME: configRoot } }
    );
    expect(starter.stdout).toContain("Imported Interview Practice Coach");
    const fullContent =
      Array.from(
        { length: 26 },
        (_, index) => `visible line ${index + 1}`
      ).join("\n") + "\n\u001b[31mterminal-control\u001b[0m\u202espoof";
    const requests: Awaited<ReturnType<typeof readRequest>>[] = [];
    const server = createServer(
      async (request: IncomingMessage, response: ServerResponse) => {
        if (request.url !== "/v1/chat/completions") {
          response.writeHead(404).end();
          return;
        }
        const body = await readRequest(request);
        requests.push(body);
        if (requests.length === 1) {
          respond(response, {
            choices: [
              {
                message: {
                  content: "I can propose that file.",
                  tool_calls: [
                    {
                      id: "call_write_1",
                      type: "function",
                      function: {
                        name: "write_project_file",
                        arguments: JSON.stringify({
                          path: "notes.md",
                          content: fullContent,
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
                content: "The write was declined; no file was changed.",
              },
            },
          ],
        });
      }
    );
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Test model server did not start.");

    try {
      const result = await runCli(
        ["local", "--cwd", projectRoot, "--json", "write a project note"],
        {
          cwd: projectRoot,
          env: {
            XDG_CONFIG_HOME: configRoot,
            APEX_MODEL_BASE_URL: `http://127.0.0.1:${address.port}/v1`,
            APEX_MODEL_ID: "qwen3.5:4b",
            APEX_MODEL_PROVIDER: "ollama",
          },
        }
      );

      expect(requests).toHaveLength(2);
      expect(requests[0].model).toBe("qwen3.5:4b");
      expect(requests[0].tools?.length).toBeGreaterThan(0);
      expect(requests[0].tool_choice).toBeUndefined();
      expect(requests[0].stream).toBe(false);
      expect(requests[0].messages[0].content).toContain(
        "Interview Practice Coach"
      );
      expect(requests[0].messages[0].content).toContain(
        "Do not act as a hidden answer feed"
      );
      expect(result.stdout).toContain("visible line 26");
      expect(result.stdout).toContain("terminal-control");
      expect(result.stdout).toContain("\\u001b");
      expect(result.stdout).toContain("\\u202e");
      expect(result.stdout).not.toContain("\u001b[31m");
      expect(result.stdout).not.toContain("\u202e");
      expect(result.stdout).toContain("The write was declined");
      await expect(
        readFile(path.join(projectRoot, "notes.md"))
      ).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await closeServer(server);
    }
  });

  it("imports reviewed Markdown Skills into owner-only local storage", async () => {
    const root = await temporaryDirectory();
    const projectRoot = path.join(root, "project");
    const configRoot = path.join(root, "config");
    const source = path.join(projectRoot, "SKILL.md");
    await mkdir(projectRoot, { recursive: true });
    await writeFile(
      source,
      "---\nname: Interview Practice Coach\ndescription: Private mock practice\n---\n# Instructions\nAsk one realistic question at a time.\n",
      { mode: 0o644 }
    );

    const imported = await runCli(["skills", "import", source], {
      cwd: projectRoot,
      env: { XDG_CONFIG_HOME: configRoot },
    });
    const skillDirectory = path.join(configRoot, "apex", "skills");
    const storedSkill = path.join(
      skillDirectory,
      "interview-practice-coach.md"
    );
    expect(imported.stdout).toContain("Imported Interview Practice Coach");
    expect(await readFile(storedSkill, "utf8")).toContain(
      "Ask one realistic question at a time."
    );
    if (process.platform !== "win32") {
      expect((await stat(skillDirectory)).mode & 0o777).toBe(0o700);
      expect((await stat(storedSkill)).mode & 0o777).toBe(0o600);
    }

    const listed = await runCli(["skills", "list"], {
      cwd: projectRoot,
      env: { XDG_CONFIG_HOME: configRoot },
    });
    expect(listed.stdout).toContain("Interview Practice Coach");
  });
});
