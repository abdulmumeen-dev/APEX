import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import {
  apexApprovals,
  apexBridges,
  apexMemories,
  apexMessages,
  apexProviders,
  apexRuns,
  apexRunSteps,
  apexSessions,
  apexWorkspaceFiles,
  apexWorkflows,
} from "../../drizzle/schema";
import { toPublicProvider } from "../providers/service";
import { toPublicBridge } from "../bridges/service";

export async function requireDatabase() {
  const db = await getDb();
  if (!db) throw new Error("The application database is not available.");
  return db;
}

export async function getOverview(userId: number) {
  const db = await requireDatabase();
  const [
    sessionCount,
    runCount,
    workflowCount,
    approvalCount,
    memoryCount,
    fileCount,
    bridgeCount,
    providerRows,
    bridgeRows,
  ] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(apexSessions)
      .where(eq(apexSessions.userId, userId)),
    db
      .select({ total: sql<number>`count(*)` })
      .from(apexRuns)
      .where(eq(apexRuns.userId, userId)),
    db
      .select({ total: sql<number>`count(*)` })
      .from(apexWorkflows)
      .where(eq(apexWorkflows.userId, userId)),
    db
      .select({ total: sql<number>`count(*)` })
      .from(apexApprovals)
      .where(
        and(
          eq(apexApprovals.userId, userId),
          eq(apexApprovals.status, "pending")
        )
      ),
    db
      .select({ total: sql<number>`count(*)` })
      .from(apexMemories)
      .where(eq(apexMemories.userId, userId)),
    db
      .select({ total: sql<number>`count(*)` })
      .from(apexWorkspaceFiles)
      .where(
        and(
          eq(apexWorkspaceFiles.userId, userId),
          eq(apexWorkspaceFiles.isCurrent, 1)
        )
      ),
    db
      .select({ total: sql<number>`count(*)` })
      .from(apexBridges)
      .where(
        and(eq(apexBridges.userId, userId), eq(apexBridges.status, "connected"))
      ),
    db
      .select()
      .from(apexProviders)
      .where(
        and(eq(apexProviders.userId, userId), eq(apexProviders.isDefault, 1))
      )
      .limit(1),
    db
      .select()
      .from(apexBridges)
      .where(eq(apexBridges.userId, userId))
      .orderBy(desc(apexBridges.updatedAt))
      .limit(5),
  ]);
  const count = (rows: Array<{ total: number }>) => Number(rows[0]?.total ?? 0);
  return {
    counts: {
      sessions: count(sessionCount),
      runs: count(runCount),
      workflows: count(workflowCount),
      pendingApprovals: count(approvalCount),
      memories: count(memoryCount),
      files: count(fileCount),
      connectedBridges: count(bridgeCount),
    },
    defaultProvider: providerRows[0] ? toPublicProvider(providerRows[0]) : null,
    recentBridges: bridgeRows.map(toPublicBridge),
  };
}

export async function listSessions(userId: number) {
  const db = await requireDatabase();
  return db
    .select()
    .from(apexSessions)
    .where(eq(apexSessions.userId, userId))
    .orderBy(desc(apexSessions.updatedAt))
    .limit(100);
}

export async function createSession(userId: number, title = "New task") {
  const db = await requireDatabase();
  const id = randomUUID();
  await db
    .insert(apexSessions)
    .values({ id, userId, title: title.trim().slice(0, 160) || "New task" });
  return (
    await db
      .select()
      .from(apexSessions)
      .where(and(eq(apexSessions.id, id), eq(apexSessions.userId, userId)))
      .limit(1)
  )[0];
}

async function assertOwnSession(userId: number, sessionId: string) {
  const db = await requireDatabase();
  const session = (
    await db
      .select()
      .from(apexSessions)
      .where(
        and(eq(apexSessions.id, sessionId), eq(apexSessions.userId, userId))
      )
      .limit(1)
  )[0];
  if (!session)
    throw new Error("That APEX session was not found in your workspace.");
  return { db, session };
}

export async function getSessionMessages(userId: number, sessionId: string) {
  const { db } = await assertOwnSession(userId, sessionId);
  return db
    .select()
    .from(apexMessages)
    .where(eq(apexMessages.sessionId, sessionId))
    .orderBy(apexMessages.createdAt)
    .limit(200);
}

export async function listRuns(userId: number) {
  const db = await requireDatabase();
  return db
    .select()
    .from(apexRuns)
    .where(eq(apexRuns.userId, userId))
    .orderBy(desc(apexRuns.startedAt))
    .limit(100);
}

export async function getRunSteps(userId: number, runId: string) {
  const db = await requireDatabase();
  const run = (
    await db
      .select({ id: apexRuns.id })
      .from(apexRuns)
      .where(and(eq(apexRuns.id, runId), eq(apexRuns.userId, userId)))
      .limit(1)
  )[0];
  if (!run) throw new Error("That run was not found in your workspace.");
  return db
    .select()
    .from(apexRunSteps)
    .where(eq(apexRunSteps.runId, runId))
    .orderBy(apexRunSteps.sequence);
}

export async function listWorkflows(userId: number) {
  const db = await requireDatabase();
  return db
    .select()
    .from(apexWorkflows)
    .where(eq(apexWorkflows.userId, userId))
    .orderBy(desc(apexWorkflows.updatedAt))
    .limit(100);
}

export async function createWorkflowDraft(
  userId: number,
  input: {
    name: string;
    description: string;
    triggerType: "manual" | "schedule" | "webhook";
    taskPrompt: string;
  }
) {
  const db = await requireDatabase();
  const id = randomUUID();
  const definition = JSON.stringify({
    version: 1,
    taskPrompt: input.taskPrompt,
    activationRequirement:
      "Configure and verify a durable worker before activation.",
  });
  await db.insert(apexWorkflows).values({
    id,
    userId,
    name: input.name,
    description: input.description,
    triggerType: input.triggerType,
    definition,
    version: 1,
    status: "draft",
  });
  return (
    await db
      .select()
      .from(apexWorkflows)
      .where(and(eq(apexWorkflows.id, id), eq(apexWorkflows.userId, userId)))
      .limit(1)
  )[0];
}

export async function listMemories(userId: number) {
  const db = await requireDatabase();
  return db
    .select()
    .from(apexMemories)
    .where(eq(apexMemories.userId, userId))
    .orderBy(desc(apexMemories.updatedAt))
    .limit(200);
}

export async function createMemory(
  userId: number,
  input: { label: string; content: string }
) {
  const db = await requireDatabase();
  const id = randomUUID();
  await db
    .insert(apexMemories)
    .values({ id, userId, label: input.label, content: input.content });
  return (
    await db
      .select()
      .from(apexMemories)
      .where(and(eq(apexMemories.id, id), eq(apexMemories.userId, userId)))
      .limit(1)
  )[0];
}

export async function removeMemory(userId: number, id: string) {
  const db = await requireDatabase();
  await db
    .delete(apexMemories)
    .where(and(eq(apexMemories.id, id), eq(apexMemories.userId, userId)));
}

export async function listWorkspaceFiles(userId: number) {
  const db = await requireDatabase();
  return db
    .select({
      id: apexWorkspaceFiles.id,
      path: apexWorkspaceFiles.path,
      version: apexWorkspaceFiles.version,
      updatedAt: apexWorkspaceFiles.updatedAt,
    })
    .from(apexWorkspaceFiles)
    .where(
      and(
        eq(apexWorkspaceFiles.userId, userId),
        eq(apexWorkspaceFiles.isCurrent, 1)
      )
    )
    .orderBy(desc(apexWorkspaceFiles.updatedAt))
    .limit(200);
}

export async function readWorkspaceFile(userId: number, fileId: string) {
  const db = await requireDatabase();
  const row = (
    await db
      .select()
      .from(apexWorkspaceFiles)
      .where(
        and(
          eq(apexWorkspaceFiles.id, fileId),
          eq(apexWorkspaceFiles.userId, userId)
        )
      )
      .limit(1)
  )[0];
  if (!row) throw new Error("That workspace file was not found.");
  return row;
}

export async function listFileVersions(userId: number, path: string) {
  const db = await requireDatabase();
  return db
    .select({
      id: apexWorkspaceFiles.id,
      path: apexWorkspaceFiles.path,
      version: apexWorkspaceFiles.version,
      updatedAt: apexWorkspaceFiles.updatedAt,
    })
    .from(apexWorkspaceFiles)
    .where(
      and(
        eq(apexWorkspaceFiles.userId, userId),
        eq(apexWorkspaceFiles.path, path)
      )
    )
    .orderBy(desc(apexWorkspaceFiles.version))
    .limit(50);
}

export async function listApprovals(userId: number) {
  const db = await requireDatabase();
  return db
    .select()
    .from(apexApprovals)
    .where(eq(apexApprovals.userId, userId))
    .orderBy(desc(apexApprovals.createdAt))
    .limit(100);
}
