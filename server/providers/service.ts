import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import { apexProviders } from "../../drizzle/schema";
import {
  credentialEncryptionReady,
  decryptSecret,
  encryptSecret,
} from "./crypto";
import {
  listModels,
  normalizeModelBaseUrl,
  type ModelConfig,
} from "./openai-compatible";

export type ProviderInput = {
  id?: string;
  name: string;
  kind: "api" | "server" | "local";
  baseUrl: string;
  modelId: string;
  apiKey?: string;
  removeApiKey?: boolean;
};

function requiredDb() {
  return getDb().then(db => {
    if (!db) throw new Error("The application database is not available.");
    return db;
  });
}

export function toPublicProvider(row: typeof apexProviders.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    baseUrl: row.baseUrl,
    modelId: row.modelId,
    hasApiKey: Boolean(row.encryptedApiKey),
    isDefault: row.isDefault === 1,
    testStatus: row.testStatus,
    testDetail: row.testDetail,
    testedAt: row.testedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function getProviderSetupStatus() {
  return {
    encryptedCredentialStorageReady: credentialEncryptionReady(),
    privateEndpointsAllowed:
      process.env.APEX_ALLOW_PRIVATE_ENDPOINTS === "true",
  };
}

export async function listProviders(userId: number) {
  const db = await requiredDb();
  const rows = await db
    .select()
    .from(apexProviders)
    .where(eq(apexProviders.userId, userId))
    .orderBy(apexProviders.createdAt);
  return rows.map(toPublicProvider);
}

export async function saveProvider(userId: number, input: ProviderInput) {
  const db = await requiredDb();
  const baseUrl = await normalizeModelBaseUrl(input.baseUrl);
  const name = input.name.trim();
  const modelId = input.modelId.trim();
  if (!name || name.length > 120)
    throw new Error("Give this model connection a name up to 120 characters.");
  if (!modelId || modelId.length > 200)
    throw new Error("Enter a model identifier up to 200 characters.");
  if (input.apiKey && input.apiKey.length > 16_000)
    throw new Error("API keys are limited to 16 KB.");

  const existing = input.id
    ? (
        await db
          .select()
          .from(apexProviders)
          .where(
            and(
              eq(apexProviders.id, input.id),
              eq(apexProviders.userId, userId)
            )
          )
          .limit(1)
      )[0]
    : undefined;
  if (input.id && !existing)
    throw new Error("That model connection was not found in your workspace.");

  let encryptedApiKey = existing?.encryptedApiKey ?? null;
  if (input.removeApiKey) encryptedApiKey = null;
  if (input.apiKey) {
    if (!credentialEncryptionReady())
      throw new Error(
        "Secure credential storage is not configured. The operator must set APEX_ENCRYPTION_KEY before saving API keys."
      );
    encryptedApiKey = encryptSecret(input.apiKey);
  }
  if (input.kind === "api" && !encryptedApiKey)
    throw new Error("A model API connection needs an API key.");

  const id = existing?.id ?? randomUUID();
  await db.transaction(async tx => {
    if (existing) {
      await tx
        .update(apexProviders)
        .set({
          name,
          kind: input.kind,
          baseUrl,
          modelId,
          encryptedApiKey,
          testStatus: "unchecked",
          testDetail: "Configuration changed; test this model again.",
          testedAt: null,
        })
        .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)));
    } else {
      await tx.insert(apexProviders).values({
        id,
        userId,
        name,
        kind: input.kind,
        baseUrl,
        modelId,
        encryptedApiKey,
        isDefault: 0,
        testStatus: "unchecked",
        testDetail: "Not tested yet.",
      });
    }
  });

  const saved = (
    await db
      .select()
      .from(apexProviders)
      .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)))
      .limit(1)
  )[0];
  if (!saved)
    throw new Error("The model connection could not be read after saving.");
  return toPublicProvider(saved);
}

export async function testProvider(userId: number, id: string) {
  const db = await requiredDb();
  const row = (
    await db
      .select()
      .from(apexProviders)
      .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)))
      .limit(1)
  )[0];
  if (!row)
    throw new Error("That model connection was not found in your workspace.");

  try {
    const config: ModelConfig = {
      baseUrl: row.baseUrl,
      modelId: row.modelId,
      ...(row.encryptedApiKey
        ? { apiKey: decryptSecret(row.encryptedApiKey) }
        : {}),
    };
    const models = await listModels(config);
    if (!models.includes(row.modelId))
      throw new Error(
        "The model server is reachable but did not list the selected model identifier."
      );
    await db
      .update(apexProviders)
      .set({
        testStatus: "connected",
        testDetail: `Verified model ${row.modelId}.`,
        testedAt: new Date(),
      })
      .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)));
    const updated = (
      await db
        .select()
        .from(apexProviders)
        .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)))
        .limit(1)
    )[0];
    return updated ? toPublicProvider(updated) : null;
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message.slice(0, 280)
        : "The model check failed.";
    await db
      .update(apexProviders)
      .set({ testStatus: "failed", testDetail: detail, testedAt: new Date() })
      .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)));
    throw new Error(detail);
  }
}

export async function setDefaultProvider(userId: number, id: string) {
  const db = await requiredDb();
  const row = (
    await db
      .select()
      .from(apexProviders)
      .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)))
      .limit(1)
  )[0];
  if (!row)
    throw new Error("That model connection was not found in your workspace.");
  if (row.testStatus !== "connected")
    throw new Error(
      "Test this model connection before making it APEX's default."
    );
  await db.transaction(async tx => {
    await tx
      .update(apexProviders)
      .set({ isDefault: 0 })
      .where(eq(apexProviders.userId, userId));
    await tx
      .update(apexProviders)
      .set({ isDefault: 1 })
      .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)));
  });
  const updated = (
    await db
      .select()
      .from(apexProviders)
      .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)))
      .limit(1)
  )[0];
  return updated ? toPublicProvider(updated) : null;
}

export async function deleteProvider(userId: number, id: string) {
  const db = await requiredDb();
  await db
    .delete(apexProviders)
    .where(and(eq(apexProviders.id, id), eq(apexProviders.userId, userId)));
}

export async function getDefaultProvider(userId: number) {
  const db = await requiredDb();
  const row = (
    await db
      .select()
      .from(apexProviders)
      .where(
        and(eq(apexProviders.userId, userId), eq(apexProviders.isDefault, 1))
      )
      .limit(1)
  )[0];
  if (!row) return null;
  return {
    public: toPublicProvider(row),
    model: {
      baseUrl: row.baseUrl,
      modelId: row.modelId,
      ...(row.encryptedApiKey
        ? { apiKey: decryptSecret(row.encryptedApiKey) }
        : {}),
    } satisfies ModelConfig,
  };
}
