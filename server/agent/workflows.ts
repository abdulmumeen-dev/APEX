import { and, eq } from "drizzle-orm";
import { apexWorkflows } from "../../drizzle/schema";
import { getDb } from "../db";
import { createSession } from "./data";
import { submitTask } from "./engine";

export async function runWorkflowNow(userId: number, workflowId: string) {
  const db = await getDb();
  if (!db) throw new Error("The application database is not available.");
  const workflow = (
    await db
      .select()
      .from(apexWorkflows)
      .where(
        and(eq(apexWorkflows.id, workflowId), eq(apexWorkflows.userId, userId))
      )
      .limit(1)
  )[0];
  if (!workflow)
    throw new Error("That workflow was not found in your workspace.");
  if (workflow.status === "paused")
    throw new Error("A paused workflow cannot be run until you resume it.");

  let definition: unknown;
  try {
    definition = JSON.parse(workflow.definition);
  } catch {
    throw new Error("This workflow definition is invalid and cannot run.");
  }
  if (
    !definition ||
    typeof definition !== "object" ||
    Array.isArray(definition)
  ) {
    throw new Error("This workflow definition is invalid and cannot run.");
  }
  const taskPrompt = (definition as Record<string, unknown>).taskPrompt;
  if (
    typeof taskPrompt !== "string" ||
    !taskPrompt.trim() ||
    taskPrompt.length > 8_000
  ) {
    throw new Error("This workflow does not contain a valid task instruction.");
  }

  const session = await createSession(userId, `Workflow: ${workflow.name}`);
  const result = await submitTask(userId, {
    sessionId: session.id,
    task: taskPrompt,
    allowBridges: false,
  });
  return { workflowId: workflow.id, workflowName: workflow.name, ...result };
}
