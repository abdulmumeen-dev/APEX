#!/usr/bin/env node
import express from "express";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getLocalModelConfig,
  getPublicLocalModelConfig,
  runLocalTask,
  saveLocalModelConfig,
} from "./apex.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PORT = 8765;
const MAX_RUNS = 50;
const MAX_STEPS = 160;

function configDirectory() {
  return path.join(
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
    "apex"
  );
}

function normalizeModelInput(input) {
  if (!input || typeof input !== "object")
    throw new Error("A model profile is required.");
  const provider = input.provider === "ollama" ? "ollama" : "openai-compatible";
  const modelId = String(input.modelId ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(modelId))
    throw new Error("Enter a valid model ID (up to 128 safe characters).");
  let url;
  try {
    url = new URL(String(input.baseUrl ?? "").trim());
  } catch {
    throw new Error(
      "Enter a complete model base URL, including http:// or https://."
    );
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Use an HTTP(S) base URL without credentials, query values, or a fragment."
    );
  const apiKey = typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  if (apiKey.length > 2_000 || /[\r\n\0]/.test(apiKey))
    throw new Error("The API key is invalid or too long.");
  return {
    provider,
    baseUrl: url.toString().replace(/\/+$/, ""),
    modelId,
    apiKey,
    removeApiKey: input.removeApiKey === true,
  };
}

function safeError(error, secret = "") {
  let message =
    error instanceof Error ? error.message : "The local operation failed.";
  if (secret) message = message.split(secret).join("[redacted]");
  return message.slice(0, 1_000);
}

async function requestModelList(profile) {
  const response = await fetch(`${profile.baseUrl}/models`, {
    headers: {
      Accept: "application/json",
      ...(profile.apiKey ? { Authorization: `Bearer ${profile.apiKey}` } : {}),
    },
    signal: AbortSignal.timeout(12_000),
  });
  const text = await response.text();
  if (text.length > 2_000_000)
    throw new Error(
      "The model server's model list exceeded APEX's 2 MB limit."
    );
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `The model server returned non-JSON HTTP ${response.status}.`
    );
  }
  if (!response.ok)
    throw new Error(
      `The model server returned HTTP ${response.status}: ${String(parsed?.error?.message || "request failed").slice(0, 240)}`
    );
  const models = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.data)
      ? parsed.data
      : Array.isArray(parsed?.models)
        ? parsed.models
        : [];
  if (!models.length)
    throw new Error(
      "Connected, but the /models response did not contain a recognized model list."
    );
  const found = models.some(
    item => item?.id === profile.modelId || item?.name === profile.modelId
  );
  return { count: models.length, found };
}

function escapeControls(value) {
  return String(value).replace(
    /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,
    character => `\\u${character.codePointAt(0).toString(16).padStart(4, "0")}`
  );
}

/** @param {{root?: string, configDir?: string, staticDir?: string}} options */
export async function createLocalDashboardApp({
  root,
  configDir = configDirectory(),
  staticDir = path.resolve(here, "../dist/public"),
} = {}) {
  const projectRoot = await fs.realpath(root || process.cwd());
  const rootStat = await fs.stat(projectRoot);
  if (!rootStat.isDirectory())
    throw new Error("The local project root must be a directory.");

  const app = express();
  app.disable("x-powered-by");
  app.locals.port = 0;
  const state = {
    root: projectRoot,
    configDir,
    runs: [],
    activeRunId: null,
    approvals: new Map(),
    persistQueue: Promise.resolve(),
  };
  const runsPath = path.join(configDir, "local-runs.json");

  async function persistRuns() {
    state.persistQueue = state.persistQueue.then(async () => {
      await fs.mkdir(configDir, { recursive: true, mode: 0o700 });
      if (process.platform !== "win32") await fs.chmod(configDir, 0o700);
      const temporary = `${runsPath}.${randomUUID()}.tmp`;
      const value = {
        version: 1,
        runs: state.runs.slice(0, MAX_RUNS),
      };
      await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
        flag: "wx",
        mode: 0o600,
      });
      await fs.rename(temporary, runsPath);
      if (process.platform !== "win32") await fs.chmod(runsPath, 0o600);
    });
    return state.persistQueue;
  }

  try {
    const saved = JSON.parse(await fs.readFile(runsPath, "utf8"));
    if (Array.isArray(saved?.runs)) {
      state.runs = saved.runs
        .filter(run => run && typeof run.id === "string")
        .slice(0, MAX_RUNS);
      for (const run of state.runs) {
        if (run.status === "running") {
          run.status = "interrupted";
          run.error =
            "APEX stopped before this local run finished. Start a new run to continue.";
          run.finishedAt = new Date().toISOString();
          run.pendingApproval = null;
        }
      }
      if (state.runs.some(run => run.status === "interrupted"))
        await persistRuns();
    }
  } catch (error) {
    if (error?.code !== "ENOENT")
      throw new Error(
        "Could not read local run history; the file may be damaged."
      );
  }

  app.use((req, res, next) => {
    const host = String(req.headers.host || "");
    let parsed;
    try {
      parsed = new URL(`http://${host}`);
    } catch {
      res.status(403).json({ ok: false, error: "Local Host header rejected." });
      return;
    }
    if (
      parsed.hostname !== "127.0.0.1" ||
      Number(parsed.port) !== Number(req.app.locals.port) ||
      req.socket.remoteAddress !== "127.0.0.1"
    ) {
      res.status(403).json({
        ok: false,
        error: "APEX accepts local loopback requests only.",
      });
      return;
    }
    if (!/^(GET|HEAD|OPTIONS)$/.test(req.method)) {
      const origin = req.headers.origin;
      if (!origin || origin !== `http://${host}`) {
        res
          .status(403)
          .json({ ok: false, error: "Local request origin rejected." });
        return;
      }
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    );
    next();
  });
  app.use(express.json({ limit: "64kb", strict: true }));

  app.get("/api/local/status", async (_req, res) => {
    res.json({
      ok: true,
      data: {
        root: state.root,
        model: await getPublicLocalModelConfig(),
        activeRunId: state.activeRunId,
        runs: state.runs.slice(0, 20),
        security: {
          listener: "127.0.0.1 only",
          shellFromDashboard: false,
          osSandbox: false,
        },
      },
    });
  });

  app.get("/api/local/runs", (_req, res) => {
    res.json({ ok: true, data: state.runs.slice(0, 20) });
  });

  app.post("/api/local/models/test", async (req, res) => {
    try {
      const input = normalizeModelInput(req.body);
      if (!input.apiKey) {
        const saved = await getLocalModelConfig();
        if (
          saved?.baseUrl === input.baseUrl &&
          saved?.modelId === input.modelId
        )
          input.apiKey = saved.apiKey;
      }
      const result = await requestModelList(input);
      res.json({
        ok: true,
        data: {
          reachable: true,
          modelFound: result.found,
          modelId: input.modelId,
          availableModels: result.count,
          note: "This checks the model list only; it does not certify tool calling.",
        },
      });
    } catch (error) {
      res
        .status(502)
        .json({ ok: false, error: safeError(error, req.body?.apiKey) });
    }
  });

  app.put("/api/local/models", async (req, res) => {
    try {
      const profile = await saveLocalModelConfig(req.body);
      res.json({ ok: true, data: profile });
    } catch (error) {
      res.status(400).json({ ok: false, error: safeError(error) });
    }
  });

  app.post("/api/local/runs", async (req, res) => {
    const task = typeof req.body?.task === "string" ? req.body.task.trim() : "";
    if (!task || task.length > 12_000) {
      res.status(400).json({
        ok: false,
        error: "Enter a task between 1 and 12,000 characters.",
      });
      return;
    }
    if (state.activeRunId) {
      res
        .status(409)
        .json({ ok: false, error: "A local run is already active." });
      return;
    }
    let model;
    try {
      model = await getLocalModelConfig();
    } catch (error) {
      res.status(409).json({ ok: false, error: safeError(error) });
      return;
    }
    if (!model) {
      res.status(409).json({
        ok: false,
        error: "Configure Ollama or a cloud model before starting a run.",
      });
      return;
    }

    const run = {
      id: randomUUID(),
      status: "running",
      task,
      root: state.root,
      model: {
        provider: model.provider,
        modelId: model.modelId,
        baseUrl: model.baseUrl,
      },
      steps: [],
      message: "",
      error: "",
      pendingApproval: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
    };
    state.runs.unshift(run);
    state.runs = state.runs.slice(0, MAX_RUNS);
    state.activeRunId = run.id;
    await persistRuns();
    res.status(202).json({ ok: true, data: run });

    const addStep = async step => {
      run.steps.unshift(step);
      run.steps = run.steps.slice(0, MAX_STEPS);
      await persistRuns();
    };
    const appendEvent = async event => {
      const createdAt = new Date().toISOString();
      if (event.type === "model_started") {
        await addStep({
          id: randomUUID(),
          kind: "model",
          label: `Reasoning cycle ${event.cycle}`,
          status: "running",
          createdAt,
        });
      } else if (event.type === "model_finished") {
        const step = run.steps.find(
          item => item.kind === "model" && item.status === "running"
        );
        if (step) {
          step.status = "completed";
          step.detail = `Model returned ${event.toolCalls} tool call(s).`;
          step.finishedAt = createdAt;
          await persistRuns();
        }
      } else if (event.type === "tool_started") {
        const step = {
          id: event.toolCallId || randomUUID(),
          kind: "tool",
          label: event.name,
          status: "running",
          arguments: escapeControls(event.arguments || "").slice(0, 16_000),
          createdAt,
        };
        await addStep(step);
      } else if (event.type === "tool_finished") {
        const step = run.steps.find(item => item.id === event.toolCallId);
        if (step) {
          step.status = event.status;
          step.detail = escapeControls(event.result || "").slice(0, 20_000);
          step.finishedAt = createdAt;
          await persistRuns();
        }
      } else if (event.type === "final") {
        run.message = event.message;
        await persistRuns();
      }
    };

    const approveWrite = proposal =>
      new Promise(async resolve => {
        const approvalId = randomUUID();
        const pendingApproval = {
          id: approvalId,
          path: proposal.path,
          operation: proposal.operation,
          bytes: proposal.bytes,
          safeContent: proposal.safeContent,
          createdAt: new Date().toISOString(),
        };
        run.pendingApproval = pendingApproval;
        const timeout = setTimeout(() => {
          state.approvals.delete(approvalId);
          run.pendingApproval = null;
          void addStep({
            id: approvalId,
            kind: "approval",
            label: `Write ${proposal.path}`,
            status: "expired",
            detail: "The write approval expired; no change was applied.",
            createdAt: new Date().toISOString(),
          });
          resolve(false);
        }, 5 * 60_000);
        state.approvals.set(approvalId, {
          runId: run.id,
          resolve: approved => {
            clearTimeout(timeout);
            state.approvals.delete(approvalId);
            run.pendingApproval = null;
            resolve(approved);
          },
        });
        await addStep({
          id: approvalId,
          kind: "approval",
          label: `${proposal.operation === "update" ? "Update" : "Create"} ${proposal.path}`,
          status: "pending",
          detail: "Review the complete proposed file content before deciding.",
          createdAt: pendingApproval.createdAt,
        });
      });

    void (async () => {
      try {
        const result = await runLocalTask({
          task,
          root: state.root,
          config: model,
          allowShell: false,
          autoWrite: false,
          approveWrite,
          onEvent: appendEvent,
        });
        run.status = "completed";
        run.message = result.message;
      } catch (error) {
        run.status = "failed";
        run.error = safeError(error, model.apiKey);
      } finally {
        run.finishedAt = new Date().toISOString();
        run.pendingApproval = null;
        if (state.activeRunId === run.id) state.activeRunId = null;
        await persistRuns();
      }
    })();
  });

  app.post("/api/local/runs/:runId/approvals/:approvalId", async (req, res) => {
    const pending = state.approvals.get(req.params.approvalId);
    const approved = req.body?.approved;
    if (
      !pending ||
      pending.runId !== req.params.runId ||
      !state.runs.some(run => run.id === pending.runId) ||
      typeof approved !== "boolean"
    ) {
      res.status(404).json({
        ok: false,
        error: "That local approval is no longer pending.",
      });
      return;
    }
    const run = state.runs.find(item => item.id === pending.runId);
    const step = run.steps.find(item => item.id === req.params.approvalId);
    if (step) {
      step.status = approved ? "approved" : "rejected";
      step.detail = approved
        ? "The owner approved this exact proposed write."
        : "The owner rejected this write; no file change was applied.";
      step.finishedAt = new Date().toISOString();
    }
    await persistRuns();
    pending.resolve(approved);
    res.json({ ok: true, data: { approved } });
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ ok: false, error: "Local API route not found." });
  });
  app.use(express.static(staticDir, { index: false, fallthrough: true }));
  app.get("*", async (req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ ok: false, error: "Local API route not found." });
      return;
    }
    try {
      await fs.access(path.join(staticDir, "index.html"));
      res.sendFile(path.join(staticDir, "index.html"));
    } catch {
      res
        .status(503)
        .type("text/plain")
        .send(
          "APEX Desktop UI is not built yet. Run `pnpm build` from the APEX source checkout, then start `apex dashboard`."
        );
    }
  });
  return app;
}

function parseDashboardArgs(args) {
  const options = { port: DEFAULT_PORT, root: process.cwd() };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--cwd") {
      if (!args[index + 1]) throw new Error("Provide a path after --cwd.");
      options.root = path.resolve(args[++index]);
    } else if (arg === "--port") {
      const port = Number(args[++index]);
      if (!Number.isInteger(port) || port < 0 || port > 65535)
        throw new Error("Port must be an integer from 0 to 65535.");
      options.port = port;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: apex dashboard [--cwd PATH] [--port PORT]\nThe listener is always bound to 127.0.0.1. Port 0 selects an available port."
      );
      return null;
    } else {
      throw new Error(`Unknown dashboard option: ${arg}`);
    }
  }
  return options;
}

export async function startLocalDashboard(input = []) {
  const options = Array.isArray(input) ? parseDashboardArgs(input) : input;
  if (!options) return null;
  const app = await createLocalDashboardApp(options);
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(options.port ?? DEFAULT_PORT, "127.0.0.1");
    listener.once("error", reject);
    listener.once("listening", () => resolve(listener));
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not determine the local dashboard address.");
  }
  app.locals.port = address.port;
  const origin = `http://127.0.0.1:${address.port}`;
  if (!options.quiet) {
    console.log(`APEX local workbench: ${origin}/local`);
    console.log(`Workspace: ${path.resolve(options.root || process.cwd())}`);
    console.log(
      "Listener: 127.0.0.1 only. Browser shell: disabled. OS sandbox: not provided."
    );
    console.log("Press Ctrl+C to stop APEX.");
  }
  return {
    app,
    server,
    origin,
    root: path.resolve(options.root || process.cwd()),
  };
}
