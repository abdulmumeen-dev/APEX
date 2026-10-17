import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the existing Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Per-user model endpoints; API secrets are stored only as authenticated ciphertext. */
export const apexProviders = mysqlTable(
  "apex_providers",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    kind: mysqlEnum("kind", ["api", "server", "local"]).notNull(),
    baseUrl: varchar("baseUrl", { length: 2048 }).notNull(),
    modelId: varchar("modelId", { length: 200 }).notNull(),
    encryptedApiKey: text("encryptedApiKey"),
    isDefault: int("isDefault").notNull().default(0),
    testStatus: mysqlEnum("testStatus", ["unchecked", "connected", "failed"])
      .notNull()
      .default("unchecked"),
    testDetail: varchar("testDetail", { length: 300 }),
    testedAt: timestamp("testedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("apex_providers_user_idx").on(table.userId),
    index("apex_providers_default_idx").on(table.userId, table.isDefault),
  ]
);

/** Optional bridges to independently operated agents; never needed by APEX's core loop. */
export const apexBridges = mysqlTable(
  "apex_bridges",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    protocol: mysqlEnum("protocol", [
      "apex_bridge_v1",
      "openai_compatible_agent",
    ]).notNull(),
    endpoint: varchar("endpoint", { length: 2048 }).notNull(),
    encryptedApiKey: text("encryptedApiKey"),
    status: mysqlEnum("bridgeStatus", ["unchecked", "connected", "failed"])
      .notNull()
      .default("unchecked"),
    statusDetail: varchar("statusDetail", { length: 300 }),
    testedAt: timestamp("testedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("apex_bridges_user_idx").on(table.userId),
    index("apex_bridges_status_idx").on(table.userId, table.status),
  ]
);

export const apexSessions = mysqlTable(
  "apex_sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull().default("New task"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("apex_sessions_user_updated_idx").on(table.userId, table.updatedAt),
  ]
);

export const apexMessages = mysqlTable(
  "apex_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    sessionId: varchar("sessionId", { length: 36 })
      .notNull()
      .references(() => apexSessions.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["user", "assistant", "tool"]).notNull(),
    content: text("content").notNull(),
    toolName: varchar("toolName", { length: 120 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("apex_messages_session_created_idx").on(
      table.sessionId,
      table.createdAt
    ),
  ]
);

export const apexRuns = mysqlTable(
  "apex_runs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: varchar("sessionId", { length: 36 })
      .notNull()
      .references(() => apexSessions.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", [
      "blocked",
      "running",
      "waiting_approval",
      "succeeded",
      "failed",
      "cancelled",
    ]).notNull(),
    task: text("task").notNull(),
    providerId: varchar("providerId", { length: 36 }),
    allowBridges: int("allowBridges").notNull().default(0),
    allowPlugins: int("allowPlugins").notNull().default(0),
    result: text("result"),
    error: text("error"),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    finishedAt: timestamp("finishedAt"),
  },
  table => [
    index("apex_runs_user_started_idx").on(table.userId, table.startedAt),
    index("apex_runs_session_idx").on(table.sessionId),
  ]
);

export const apexRunSteps = mysqlTable(
  "apex_run_steps",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    runId: varchar("runId", { length: 36 })
      .notNull()
      .references(() => apexRuns.id, { onDelete: "cascade" }),
    sequence: int("sequence").notNull(),
    kind: varchar("kind", { length: 40 }).notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    status: mysqlEnum("status", [
      "running",
      "completed",
      "blocked",
      "failed",
    ]).notNull(),
    detail: text("detail"),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    finishedAt: timestamp("finishedAt"),
  },
  table => [
    index("apex_run_steps_run_sequence_idx").on(table.runId, table.sequence),
  ]
);

export const apexWorkflows = mysqlTable(
  "apex_workflows",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    triggerType: mysqlEnum("triggerType", ["manual", "schedule", "webhook"])
      .notNull()
      .default("manual"),
    definition: text("definition").notNull(),
    version: int("version").notNull().default(1),
    status: mysqlEnum("status", ["draft", "active", "paused"])
      .notNull()
      .default("draft"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("apex_workflows_user_updated_idx").on(table.userId, table.updatedAt),
  ]
);

export const apexApprovals = mysqlTable(
  "apex_approvals",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    runId: varchar("runId", { length: 36 })
      .notNull()
      .references(() => apexRuns.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 200 }).notNull(),
    details: text("details").notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected"])
      .notNull()
      .default("pending"),
    decisionNote: text("decisionNote"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    decidedAt: timestamp("decidedAt"),
  },
  table => [
    index("apex_approvals_user_status_idx").on(table.userId, table.status),
  ]
);

export const apexMemories = mysqlTable(
  "apex_memories",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 160 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("apex_memories_user_updated_idx").on(table.userId, table.updatedAt),
  ]
);

export const apexWorkspaceFiles = mysqlTable(
  "apex_workspace_files",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    path: varchar("path", { length: 512 }).notNull(),
    version: int("version").notNull().default(1),
    isCurrent: int("isCurrent").notNull().default(1),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("apex_workspace_files_user_path_version_uq").on(
      table.userId,
      table.path,
      table.version
    ),
    index("apex_workspace_files_current_idx").on(
      table.userId,
      table.path,
      table.isCurrent
    ),
    index("apex_workspace_files_user_updated_idx").on(
      table.userId,
      table.updatedAt
    ),
  ]
);

export const apexLibraryItems = mysqlTable(
  "apex_library_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: mysqlEnum("kind", ["prompt", "tool", "workflow"]).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    body: text("body").notNull(),
    version: int("version").notNull().default(1),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("apex_library_user_kind_idx").on(table.userId, table.kind)]
);

/** User-authored instruction skills, versioned and activated only by the owner. */
export const apexSkills = mysqlTable(
  "apex_skills",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    instructions: text("instructions").notNull(),
    enabled: int("enabled").notNull().default(0),
    version: int("version").notNull().default(1),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("apex_skills_user_enabled_idx").on(table.userId, table.enabled),
    index("apex_skills_user_updated_idx").on(table.userId, table.updatedAt),
  ]
);

/** Owner-configured, GET-only JSON API plugins; code is never loaded into the server. */
export const apexPlugins = mysqlTable(
  "apex_plugins",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull(),
    baseUrl: varchar("baseUrl", { length: 2048 }).notNull(),
    path: varchar("path", { length: 512 }).notNull(),
    encryptedApiKey: text("encryptedApiKey"),
    enabled: int("enabled").notNull().default(0),
    testStatus: mysqlEnum("testStatus", ["unchecked", "connected", "failed"])
      .notNull()
      .default("unchecked"),
    testDetail: varchar("testDetail", { length: 300 }),
    testedAt: timestamp("testedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("apex_plugins_user_enabled_idx").on(table.userId, table.enabled),
    index("apex_plugins_user_updated_idx").on(table.userId, table.updatedAt),
  ]
);

/** Hashed, revocable personal access tokens for the APEX CLI and API. */
export const apexApiTokens = mysqlTable(
  "apex_api_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    tokenPrefix: varchar("tokenPrefix", { length: 24 }).notNull(),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    lastUsedAt: timestamp("lastUsedAt"),
    revokedAt: timestamp("revokedAt"),
  },
  table => [
    uniqueIndex("apex_api_tokens_hash_uq").on(table.tokenHash),
    index("apex_api_tokens_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ApexProvider = typeof apexProviders.$inferSelect;
export type ApexBridge = typeof apexBridges.$inferSelect;
export type ApexSession = typeof apexSessions.$inferSelect;
export type ApexMessage = typeof apexMessages.$inferSelect;
export type ApexRun = typeof apexRuns.$inferSelect;
export type ApexWorkflow = typeof apexWorkflows.$inferSelect;
export type ApexApproval = typeof apexApprovals.$inferSelect;
export type ApexMemory = typeof apexMemories.$inferSelect;
export type ApexWorkspaceFile = typeof apexWorkspaceFiles.$inferSelect;
export type ApexLibraryItem = typeof apexLibraryItems.$inferSelect;
export type ApexSkill = typeof apexSkills.$inferSelect;
export type ApexPlugin = typeof apexPlugins.$inferSelect;
export type ApexApiToken = typeof apexApiTokens.$inferSelect;
