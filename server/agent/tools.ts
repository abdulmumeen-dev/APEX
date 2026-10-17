import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "../db";
import {
  apexApprovals,
  apexBridges,
  apexMemories,
  apexMessages,
  apexProviders,
  apexRuns,
  apexSessions,
  apexWorkspaceFiles,
  apexWorkflows,
} from "../../drizzle/schema";
import { delegateToBridge } from "../bridges/service";
import { callPlugin } from "./plugins";
import type { ChatMessage, FunctionTool } from "../providers/openai-compatible";

export type AgentToolContext = {
  userId: number;
  runId: string;
  allowBridges: boolean;
  allowPlugins: boolean;
  explicitMemoryPermission: boolean;
  conversation: ChatMessage[];
};

type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

const objectSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
};
const definition = (
  name: string,
  description: string,
  properties: Record<string, unknown>
): ToolDefinition => ({
  name,
  description,
  parameters: {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  },
});

const nativeDefinitions: ToolDefinition[] = [
  definition(
    "get_workspace_status",
    "Read actual APEX counts for sessions, runs, saved memories, files, and workflow drafts.",
    {}
  ),
  definition(
    "save_memory",
    "Save a durable note only when the user explicitly asked APEX to remember something.",
    {
      label: { type: "string", description: "Short name for the memory." },
      content: {
        type: "string",
        description:
          "The exact useful fact or preference the user asked APEX to retain.",
      },
    }
  ),
  definition(
    "search_memory",
    "Search this user's saved APEX memories for relevant notes.",
    {
      query: { type: "string", description: "Words or phrase to search for." },
    }
  ),
  definition(
    "create_automation_draft",
    "Save a real workflow draft. It remains inactive until a scheduler or trigger worker is configured by the owner.",
    {
      name: { type: "string", description: "Workflow name." },
      description: {
        type: "string",
        description: "What the workflow should do.",
      },
      trigger: {
        type: "string",
        enum: ["manual", "schedule", "webhook"],
        description: "Intended trigger; saved as draft only.",
      },
      taskPrompt: {
        type: "string",
        description: "Instruction APEX should execute when the workflow runs.",
      },
    }
  ),
  definition(
    "list_workspace_files",
    "List real files in the user's private, versioned APEX workspace.",
    {}
  ),
  definition(
    "read_workspace_file",
    "Read a file from the user's private APEX workspace by its relative path.",
    {
      path: {
        type: "string",
        description: "Relative path, for example notes/plan.md.",
      },
    }
  ),
  definition(
    "write_workspace_file",
    "Create or update a file in the user's private, versioned APEX workspace. Older versions are retained.",
    {
      path: {
        type: "string",
        description: "Relative path, never an absolute or host path.",
      },
      content: { type: "string", description: "New file contents." },
    }
  ),
];

const bridgeDefinition = (
  connected: Array<{ id: string; name: string }>
): ToolDefinition => ({
  name: "delegate_to_agent",
  description:
    "Delegate a clearly bounded subtask to one of the user's live-tested agent bridges. Only call when the user enabled external-agent delegation for this run. The task and recent conversation context are sent to that external agent.",
  parameters: {
    type: "object",
    properties: {
      bridge_id: {
        type: "string",
        enum: connected.map(item => item.id),
        description: "ID of a live-tested bridge.",
      },
      task: {
        type: "string",
        description: "Specific task for the external agent.",
      },
    },
    required: ["bridge_id", "task"],
    additionalProperties: false,
  },
});

const pluginDefinition = (
  plugins: Array<{ id: string; name: string; description: string }>
): ToolDefinition => ({
  name: "call_api_plugin",
  description:
    "Call one of the owner's enabled, live-tested, read-only GET API plugins. This sends the supplied query parameters to that external endpoint. Never include private conversation content unless it is needed and the user explicitly enabled API plugins for this run. Available plugins: " +
    plugins
      .map(item => `${item.name} (${item.id}): ${item.description}`)
      .join("; "),
  parameters: {
    type: "object",
    properties: {
      plugin_id: {
        type: "string",
        enum: plugins.map(item => item.id),
        description: "ID of a live-tested API plugin that the owner enabled.",
      },
      query: {
        type: "object",
        additionalProperties: { type: ["string", "number", "boolean"] },
        description:
          "Small, non-secret query parameters sent to the plugin endpoint.",
      },
    },
    required: ["plugin_id"],
    additionalProperties: false,
  },
});

export function buildAgentTools(
  connectedBridges: Array<{ id: string; name: string }>,
  allowBridges: boolean,
  enabledPlugins: Array<{ id: string; name: string; description: string }>,
  allowPlugins: boolean
): FunctionTool[] {
  const definitions = [...nativeDefinitions];
  if (allowBridges && connectedBridges.length > 0)
    definitions.push(bridgeDefinition(connectedBridges));
  if (allowPlugins && enabledPlugins.length > 0)
    definitions.push(pluginDefinition(enabledPlugins));
  return definitions.map(item => ({
    type: "function",
    function: {
      name: item.name,
      description: item.description,
      parameters: item.parameters,
    },
  }));
}

function parseArguments(raw: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The model sent invalid tool arguments.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Tool arguments must be a JSON object.");
  return parsed as Record<string, unknown>;
}

function safeWorkspacePath(raw: unknown): string {
  if (typeof raw !== "string")
    throw new Error("A relative workspace path is required.");
  const path = raw.trim().replace(/\\/g, "/");
  const segments = path.split("/");
  if (
    !path ||
    path.length > 512 ||
    path.startsWith("/") ||
    /^[a-zA-Z]:/.test(path) ||
    segments.some(
      segment =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.startsWith(".env")
    )
  ) {
    throw new Error(
      "Use a safe relative path inside the APEX workspace. Parent paths, absolute paths, and .env files are not allowed."
    );
  }
  return path;
}

async function database() {
  const db = await getDb();
  if (!db) throw new Error("The application database is not available.");
  return db;
}

async function executeNative(
  name: string,
  args: Record<string, unknown>,
  context: AgentToolContext
): Promise<unknown> {
  const db = await database();

  if (name === "get_workspace_status") {
    const [
      sessions,
      runs,
      memories,
      files,
      workflows,
      pendingApprovals,
      providers,
      bridges,
    ] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)` })
        .from(apexSessions)
        .where(eq(apexSessions.userId, context.userId)),
      db
        .select({ total: sql<number>`count(*)` })
        .from(apexRuns)
        .where(eq(apexRuns.userId, context.userId)),
      db
        .select({ total: sql<number>`count(*)` })
        .from(apexMemories)
        .where(eq(apexMemories.userId, context.userId)),
      db
        .select({ total: sql<number>`count(*)` })
        .from(apexWorkspaceFiles)
        .where(
          and(
            eq(apexWorkspaceFiles.userId, context.userId),
            eq(apexWorkspaceFiles.isCurrent, 1)
          )
        ),
      db
        .select({ total: sql<number>`count(*)` })
        .from(apexWorkflows)
        .where(eq(apexWorkflows.userId, context.userId)),
      db
        .select({ total: sql<number>`count(*)` })
        .from(apexApprovals)
        .where(
          and(
            eq(apexApprovals.userId, context.userId),
            eq(apexApprovals.status, "pending")
          )
        ),
      db
        .select({ total: sql<number>`count(*)` })
        .from(apexProviders)
        .where(eq(apexProviders.userId, context.userId)),
      db
        .select({ total: sql<number>`count(*)` })
        .from(apexBridges)
        .where(
          and(
            eq(apexBridges.userId, context.userId),
            eq(apexBridges.status, "connected")
          )
        ),
    ]);
    const count = (result: Array<{ total: number }>) =>
      Number(result[0]?.total ?? 0);
    return {
      sessions: count(sessions),
      runs: count(runs),
      memories: count(memories),
      workspaceFiles: count(files),
      workflows: count(workflows),
      pendingApprovals: count(pendingApprovals),
      modelProfiles: count(providers),
      liveAgentBridges: count(bridges),
    };
  }

  if (name === "save_memory") {
    if (!context.explicitMemoryPermission)
      throw new Error(
        "The user did not explicitly ask APEX to save a memory in this task."
      );
    const input = z
      .object({
        label: z.string().trim().min(1).max(160),
        content: z.string().trim().min(1).max(12_000),
      })
      .parse(args);
    const id = randomUUID();
    await db.insert(apexMemories).values({
      id,
      userId: context.userId,
      label: input.label,
      content: input.content,
    });
    return { saved: true, memoryId: id, label: input.label };
  }

  if (name === "search_memory") {
    const { query } = z
      .object({ query: z.string().trim().min(1).max(160) })
      .parse(args);
    const rows = await db
      .select({
        id: apexMemories.id,
        label: apexMemories.label,
        content: apexMemories.content,
        updatedAt: apexMemories.updatedAt,
      })
      .from(apexMemories)
      .where(eq(apexMemories.userId, context.userId))
      .orderBy(desc(apexMemories.updatedAt))
      .limit(100);
    const needle = query.toLocaleLowerCase();
    return rows
      .filter(row =>
        `${row.label} ${row.content}`.toLocaleLowerCase().includes(needle)
      )
      .slice(0, 15);
  }

  if (name === "create_automation_draft") {
    const input = z
      .object({
        name: z.string().trim().min(1).max(160),
        description: z.string().trim().min(1).max(2_000),
        trigger: z.enum(["manual", "schedule", "webhook"]),
        taskPrompt: z.string().trim().min(1).max(8_000),
      })
      .parse(args);
    const id = randomUUID();
    const definition = JSON.stringify({
      version: 1,
      taskPrompt: input.taskPrompt,
      activationRequirement:
        "Configure and verify a real worker before activating this workflow.",
    });
    await db.insert(apexWorkflows).values({
      id,
      userId: context.userId,
      name: input.name,
      description: input.description,
      triggerType: input.trigger,
      definition,
      version: 1,
      status: "draft",
    });
    return {
      saved: true,
      workflowId: id,
      name: input.name,
      status: "draft",
      note: "No trigger is active; configure a real worker before activation.",
    };
  }

  if (name === "list_workspace_files") {
    return await db
      .select({
        path: apexWorkspaceFiles.path,
        version: apexWorkspaceFiles.version,
        updatedAt: apexWorkspaceFiles.updatedAt,
      })
      .from(apexWorkspaceFiles)
      .where(
        and(
          eq(apexWorkspaceFiles.userId, context.userId),
          eq(apexWorkspaceFiles.isCurrent, 1)
        )
      )
      .orderBy(desc(apexWorkspaceFiles.updatedAt))
      .limit(100);
  }

  if (name === "read_workspace_file") {
    const input = z.object({ path: z.string() }).parse(args);
    const path = safeWorkspacePath(input.path);
    const row = (
      await db
        .select()
        .from(apexWorkspaceFiles)
        .where(
          and(
            eq(apexWorkspaceFiles.userId, context.userId),
            eq(apexWorkspaceFiles.path, path),
            eq(apexWorkspaceFiles.isCurrent, 1)
          )
        )
        .limit(1)
    )[0];
    if (!row)
      throw new Error("That file does not exist in the APEX workspace.");
    return {
      path,
      version: row.version,
      content: row.content.slice(0, 30_000),
    };
  }

  if (name === "write_workspace_file") {
    const input = z
      .object({ path: z.string(), content: z.string().max(40_000) })
      .parse(args);
    const path = safeWorkspacePath(input.path);
    if (Buffer.byteLength(input.content, "utf8") > 48_000)
      throw new Error("Workspace text files are limited to 48 KB.");
    const existing = (
      await db
        .select()
        .from(apexWorkspaceFiles)
        .where(
          and(
            eq(apexWorkspaceFiles.userId, context.userId),
            eq(apexWorkspaceFiles.path, path),
            eq(apexWorkspaceFiles.isCurrent, 1)
          )
        )
        .limit(1)
    )[0];
    const version = (existing?.version ?? 0) + 1;
    const id = randomUUID();
    await db.transaction(async tx => {
      if (existing)
        await tx
          .update(apexWorkspaceFiles)
          .set({ isCurrent: 0 })
          .where(
            and(
              eq(apexWorkspaceFiles.userId, context.userId),
              eq(apexWorkspaceFiles.path, path),
              eq(apexWorkspaceFiles.isCurrent, 1)
            )
          );
      await tx.insert(apexWorkspaceFiles).values({
        id,
        userId: context.userId,
        path,
        version,
        isCurrent: 1,
        content: input.content,
      });
    });
    return {
      saved: true,
      fileId: id,
      path,
      version,
      previousVersionRetained: Boolean(existing),
    };
  }

  throw new Error(`The requested native tool "${name}" is not available.`);
}

export async function executeAgentTool(
  name: string,
  rawArguments: string,
  context: AgentToolContext
): Promise<string> {
  const args = parseArguments(rawArguments);
  let result: unknown;
  if (name === "delegate_to_agent") {
    if (!context.allowBridges)
      throw new Error(
        "External-agent delegation was not enabled by the user for this task."
      );
    const input = z
      .object({
        bridge_id: z.string().uuid(),
        task: z.string().trim().min(1).max(8_000),
      })
      .parse(args);
    result = await delegateToBridge(
      context.userId,
      input.bridge_id,
      input.task,
      context.conversation,
      context.runId
    );
  } else if (name === "call_api_plugin") {
    if (!context.allowPlugins)
      throw new Error(
        "API plugin access was not enabled by the user for this run."
      );
    const input = z
      .object({
        plugin_id: z.string().uuid(),
        query: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .optional(),
      })
      .parse(args);
    result = await callPlugin(
      context.userId,
      input.plugin_id,
      input.query ?? {}
    );
  } else {
    result = await executeNative(name, args, context);
  }
  const output = JSON.stringify(result);
  return output.length > 12_000
    ? `${output.slice(0, 12_000)}…[tool result truncated]`
    : output;
}
