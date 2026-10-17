import type { Application, Request, Response } from "express";
import { z } from "zod";
import { getOverview, listRuns, listSessions } from "./data";
import { submitTask } from "./engine";
import { listSkills } from "./skills";
import { listPlugins } from "./plugins";
import { authenticateApiToken } from "./api-tokens";

const runSchema = z.object({
  task: z.string().trim().min(1).max(12_000),
  sessionId: z.string().uuid().optional(),
  allowBridges: z.boolean().default(false),
  allowPlugins: z.boolean().default(false),
});

const rateWindowMs = 60_000;
const requestCounts = new Map<string, { since: number; count: number }>();
const MAX_REQUESTS_PER_WINDOW = 30;

async function userIdFromRequest(req: Request, res: Response) {
  const authorization = req.header("authorization") ?? "";
  const match = /^Bearer\s+(apx_live_[A-Za-z0-9_-]{43})$/i.exec(authorization);
  if (!match) {
    res
      .status(401)
      .json({ ok: false, error: "A valid APEX bearer token is required." });
    return null;
  }
  try {
    const principal = await authenticateApiToken(match[1]);
    if (!principal) {
      res
        .status(401)
        .json({
          ok: false,
          error: "The APEX CLI token is invalid or revoked.",
        });
      return null;
    }
    const now = Date.now();
    const previous = requestCounts.get(principal.tokenId);
    if (!previous || now - previous.since >= rateWindowMs) {
      requestCounts.set(principal.tokenId, { since: now, count: 1 });
    } else if (previous.count >= MAX_REQUESTS_PER_WINDOW) {
      res
        .status(429)
        .json({
          ok: false,
          error: "APEX CLI request limit reached; retry in a minute.",
        });
      return null;
    } else {
      previous.count += 1;
    }
    return principal.userId;
  } catch {
    res
      .status(503)
      .json({ ok: false, error: "The APEX API is temporarily unavailable." });
    return null;
  }
}

function safeFailure(res: Response, error: unknown) {
  const detail =
    error instanceof Error ? error.message : "The APEX API request failed.";
  const status = detail.includes("not found") ? 404 : 400;
  res.status(status).json({ ok: false, error: detail.slice(0, 300) });
}

export function registerApexApiRoutes(app: Application) {
  app.get("/api/v1/status", async (req, res) => {
    const userId = await userIdFromRequest(req, res);
    if (userId === null) return;
    try {
      const [overview, sessions] = await Promise.all([
        getOverview(userId),
        listSessions(userId),
      ]);
      res.json({
        ok: true,
        data: {
          product: "APEX",
          defaultProvider: overview.defaultProvider
            ? {
                name: overview.defaultProvider.name,
                kind: overview.defaultProvider.kind,
                modelId: overview.defaultProvider.modelId,
                testStatus: overview.defaultProvider.testStatus,
              }
            : null,
          sessions: sessions.length,
          runs: overview.counts.runs,
          workflows: overview.counts.workflows,
        },
      });
    } catch (error) {
      safeFailure(res, error);
    }
  });

  app.get("/api/v1/runs", async (req, res) => {
    const userId = await userIdFromRequest(req, res);
    if (userId === null) return;
    try {
      res.json({ ok: true, data: await listRuns(userId) });
    } catch (error) {
      safeFailure(res, error);
    }
  });

  app.get("/api/v1/skills", async (req, res) => {
    const userId = await userIdFromRequest(req, res);
    if (userId === null) return;
    try {
      const rows = await listSkills(userId);
      res.json({
        ok: true,
        data: rows.map(({ id, name, description, enabled, version }) => ({
          id,
          name,
          description,
          enabled,
          version,
        })),
      });
    } catch (error) {
      safeFailure(res, error);
    }
  });

  app.get("/api/v1/plugins", async (req, res) => {
    const userId = await userIdFromRequest(req, res);
    if (userId === null) return;
    try {
      const rows = await listPlugins(userId);
      res.json({
        ok: true,
        data: rows.map(({ id, name, description, enabled, testStatus }) => ({
          id,
          name,
          description,
          enabled,
          testStatus,
        })),
      });
    } catch (error) {
      safeFailure(res, error);
    }
  });

  app.post("/api/v1/runs", async (req, res) => {
    const userId = await userIdFromRequest(req, res);
    if (userId === null) return;
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          ok: false,
          error:
            "Run request is invalid. Check task length and permission fields.",
        });
      return;
    }
    try {
      const result = await submitTask(userId, parsed.data);
      res
        .status(result.status === "failed" ? 502 : 200)
        .json({ ok: true, data: result });
    } catch (error) {
      safeFailure(res, error);
    }
  });
}
