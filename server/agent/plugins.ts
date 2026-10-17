import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apexPlugins } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  credentialEncryptionReady,
  decryptSecret,
  encryptSecret,
} from "../providers/crypto";
import { safeJsonRequest } from "../providers/safe-http";
import { normalizeModelBaseUrl } from "../providers/openai-compatible";

const inputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2_000),
  baseUrl: z.string().url().max(2_048),
  path: z.string().trim().min(1).max(512),
  apiKey: z.string().max(16_000).optional(),
  removeApiKey: z.boolean().optional(),
});

function validatePath(value: string) {
  if (
    !value.startsWith("/") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("\\") ||
    value.includes("//") ||
    value.split("/").some(segment => segment === "." || segment === "..") ||
    !/^\/[A-Za-z0-9._~/-]*$/.test(value)
  ) {
    throw new Error(
      "Use a fixed absolute API path without queries, fragments, or parent segments."
    );
  }
  return value;
}

function toPublicPlugin(row: typeof apexPlugins.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    baseUrl: row.baseUrl,
    path: row.path,
    hasApiKey: Boolean(row.encryptedApiKey),
    enabled: row.enabled === 1,
    testStatus: row.testStatus,
    testDetail: row.testDetail,
    testedAt: row.testedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function database() {
  const db = await getDb();
  if (!db) throw new Error("The application database is not available.");
  return db;
}

export async function listPlugins(userId: number) {
  const db = await database();
  const rows = await db
    .select()
    .from(apexPlugins)
    .where(eq(apexPlugins.userId, userId))
    .orderBy(desc(apexPlugins.updatedAt));
  return rows.map(toPublicPlugin);
}

export async function listEnabledPlugins(userId: number) {
  const db = await database();
  const rows = await db
    .select()
    .from(apexPlugins)
    .where(
      and(
        eq(apexPlugins.userId, userId),
        eq(apexPlugins.enabled, 1),
        eq(apexPlugins.testStatus, "connected")
      )
    )
    .orderBy(desc(apexPlugins.updatedAt))
    .limit(20);
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description.slice(0, 500),
    path: row.path,
  }));
}

export async function savePlugin(userId: number, raw: unknown) {
  const input = inputSchema.parse(raw);
  const path = validatePath(input.path);
  const baseUrl = await normalizeModelBaseUrl(input.baseUrl);
  const name = input.name.trim();
  if (input.apiKey && input.apiKey.length > 16_000)
    throw new Error("API keys are limited to 16 KB.");

  const db = await database();
  const existing = input.id
    ? (
        await db
          .select()
          .from(apexPlugins)
          .where(
            and(eq(apexPlugins.id, input.id), eq(apexPlugins.userId, userId))
          )
          .limit(1)
      )[0]
    : undefined;
  if (input.id && !existing)
    throw new Error("That API Plugin was not found in your workspace.");

  let encryptedApiKey = existing?.encryptedApiKey ?? null;
  if (input.removeApiKey) encryptedApiKey = null;
  if (input.apiKey) {
    if (!credentialEncryptionReady())
      throw new Error(
        "Secure credential storage is not configured. The operator must set APEX_ENCRYPTION_KEY before saving API keys."
      );
    encryptedApiKey = encryptSecret(input.apiKey);
  }

  const id = existing?.id ?? randomUUID();
  if (existing) {
    await db
      .update(apexPlugins)
      .set({
        name,
        description: input.description.trim(),
        baseUrl,
        path,
        encryptedApiKey,
        enabled: 0,
        testStatus: "unchecked",
        testDetail: "Configuration changed; test and enable this plugin again.",
        testedAt: null,
      })
      .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)));
  } else {
    await db.insert(apexPlugins).values({
      id,
      userId,
      name,
      description: input.description.trim(),
      baseUrl,
      path,
      encryptedApiKey,
      enabled: 0,
      testStatus: "unchecked",
      testDetail: "Not tested yet.",
    });
  }
  const saved = (
    await db
      .select()
      .from(apexPlugins)
      .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)))
      .limit(1)
  )[0];
  return saved ? toPublicPlugin(saved) : null;
}

export async function testPlugin(userId: number, id: string) {
  const db = await database();
  const row = (
    await db
      .select()
      .from(apexPlugins)
      .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)))
      .limit(1)
  )[0];
  if (!row) throw new Error("That API Plugin was not found in your workspace.");
  try {
    const url = `${row.baseUrl}${row.path}`;
    const result = await safeJsonRequest(
      url,
      row.encryptedApiKey ? decryptSecret(row.encryptedApiKey) : undefined,
      undefined,
      256_000,
      15_000
    );
    const topLevelFields = Object.keys(result).slice(0, 12);
    await db
      .update(apexPlugins)
      .set({
        testStatus: "connected",
        testDetail: `GET check succeeded; response fields: ${topLevelFields.join(", ") || "none"}.`,
        testedAt: new Date(),
      })
      .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)));
    const updated = (
      await db
        .select()
        .from(apexPlugins)
        .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)))
        .limit(1)
    )[0];
    return updated ? toPublicPlugin(updated) : null;
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message.slice(0, 280)
        : "The API check failed.";
    await db
      .update(apexPlugins)
      .set({
        testStatus: "failed",
        testDetail: detail,
        testedAt: new Date(),
        enabled: 0,
      })
      .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)));
    throw new Error(detail);
  }
}

export async function setPluginEnabled(
  userId: number,
  id: string,
  enabled: boolean
) {
  const db = await database();
  const row = (
    await db
      .select()
      .from(apexPlugins)
      .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)))
      .limit(1)
  )[0];
  if (!row) throw new Error("That API Plugin was not found in your workspace.");
  if (enabled && row.testStatus !== "connected")
    throw new Error(
      "Run a successful live GET check before enabling this plugin."
    );
  await db
    .update(apexPlugins)
    .set({ enabled: enabled ? 1 : 0 })
    .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)));
  const updated = (
    await db
      .select()
      .from(apexPlugins)
      .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)))
      .limit(1)
  )[0];
  return updated ? toPublicPlugin(updated) : null;
}

export async function deletePlugin(userId: number, id: string) {
  const db = await database();
  await db
    .delete(apexPlugins)
    .where(and(eq(apexPlugins.id, id), eq(apexPlugins.userId, userId)));
  return { deleted: true } as const;
}

function redactSecrets(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth limited]";
  if (Array.isArray(value))
    return value.slice(0, 40).map(item => redactSecrets(item, depth + 1));
  if (!value || typeof value !== "object") {
    if (typeof value === "string") return value.slice(0, 2_000);
    return value;
  }
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(
    value as Record<string, unknown>
  ).slice(0, 80)) {
    if (
      /(?:token|secret|password|authorization|api.?key|credential)/i.test(key)
    ) {
      output[key] = "[redacted]";
    } else {
      output[key] = redactSecrets(child, depth + 1);
    }
  }
  return output;
}

function parseQuery(raw: unknown) {
  const schema = z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({});
  const query = schema.parse(raw);
  const entries = Object.entries(query);
  if (entries.length > 20)
    throw new Error("API plugins accept at most 20 query parameters per call.");
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (!/^[A-Za-z0-9_.-]{1,64}$/.test(key))
      throw new Error("An API query parameter name is invalid.");
    const text = String(value);
    if (text.length > 1_500)
      throw new Error("An API query parameter is limited to 1,500 characters.");
    params.append(key, text);
  }
  return params;
}

export async function callPlugin(
  userId: number,
  pluginId: string,
  rawQuery: unknown
) {
  const db = await database();
  const row = (
    await db
      .select()
      .from(apexPlugins)
      .where(and(eq(apexPlugins.id, pluginId), eq(apexPlugins.userId, userId)))
      .limit(1)
  )[0];
  if (!row || row.enabled !== 1 || row.testStatus !== "connected")
    throw new Error(
      "That API Plugin is not enabled and live-tested in this workspace."
    );
  const query = parseQuery(rawQuery);
  const endpoint = `${row.baseUrl}${row.path}`;
  const response = await safeJsonRequest(
    endpoint,
    row.encryptedApiKey ? decryptSecret(row.encryptedApiKey) : undefined,
    undefined,
    256_000,
    20_000,
    query
  );
  const safe = redactSecrets(response);
  const serialized = JSON.stringify(safe);
  if (serialized.length > 16_000)
    return `${serialized.slice(0, 16_000)}… [response truncated]`;
  return safe;
}
