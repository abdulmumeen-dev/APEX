import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import { apexBridges } from "../../drizzle/schema";
import {
  credentialEncryptionReady,
  decryptSecret,
  encryptSecret,
} from "../providers/crypto";
import { normalizeModelBaseUrl } from "../providers/openai-compatible";
import { checkApexBridge, runApexBridge } from "./protocol";

export type BridgeInput = {
  id?: string;
  name: string;
  endpoint: string;
  apiKey?: string;
  removeApiKey?: boolean;
};

async function requiredDb() {
  const db = await getDb();
  if (!db) throw new Error("The application database is not available.");
  return db;
}

export function toPublicBridge(row: typeof apexBridges.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    protocol: row.protocol,
    endpoint: row.endpoint,
    hasApiKey: Boolean(row.encryptedApiKey),
    status: row.status,
    statusDetail: row.statusDetail,
    testedAt: row.testedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listBridges(userId: number) {
  const db = await requiredDb();
  const rows = await db
    .select()
    .from(apexBridges)
    .where(eq(apexBridges.userId, userId))
    .orderBy(apexBridges.createdAt);
  return rows.map(toPublicBridge);
}

export async function saveBridge(userId: number, input: BridgeInput) {
  const db = await requiredDb();
  const endpoint = await normalizeModelBaseUrl(input.endpoint);
  const name = input.name.trim();
  if (!name || name.length > 120)
    throw new Error("Give this agent bridge a name up to 120 characters.");
  if (input.apiKey && input.apiKey.length > 16_000)
    throw new Error("Bridge credentials are limited to 16 KB.");

  const existing = input.id
    ? (
        await db
          .select()
          .from(apexBridges)
          .where(
            and(eq(apexBridges.id, input.id), eq(apexBridges.userId, userId))
          )
          .limit(1)
      )[0]
    : undefined;
  if (input.id && !existing)
    throw new Error("That agent bridge was not found in your workspace.");

  let encryptedApiKey = existing?.encryptedApiKey ?? null;
  if (input.removeApiKey) encryptedApiKey = null;
  if (input.apiKey) {
    if (!credentialEncryptionReady())
      throw new Error(
        "Secure credential storage is not configured. The operator must set APEX_ENCRYPTION_KEY before saving bridge keys."
      );
    encryptedApiKey = encryptSecret(input.apiKey);
  }

  const id = existing?.id ?? randomUUID();
  if (existing) {
    await db
      .update(apexBridges)
      .set({
        name,
        endpoint,
        encryptedApiKey,
        status: "unchecked",
        statusDetail: "Configuration changed; test this bridge again.",
        testedAt: null,
      })
      .where(and(eq(apexBridges.id, id), eq(apexBridges.userId, userId)));
  } else {
    await db.insert(apexBridges).values({
      id,
      userId,
      name,
      protocol: "apex_bridge_v1",
      endpoint,
      encryptedApiKey,
      status: "unchecked",
      statusDetail: "Not tested yet.",
    });
  }

  const saved = (
    await db
      .select()
      .from(apexBridges)
      .where(and(eq(apexBridges.id, id), eq(apexBridges.userId, userId)))
      .limit(1)
  )[0];
  if (!saved)
    throw new Error("The agent bridge could not be read after saving.");
  return toPublicBridge(saved);
}

export async function testBridge(userId: number, id: string) {
  const db = await requiredDb();
  const row = (
    await db
      .select()
      .from(apexBridges)
      .where(and(eq(apexBridges.id, id), eq(apexBridges.userId, userId)))
      .limit(1)
  )[0];
  if (!row)
    throw new Error("That agent bridge was not found in your workspace.");
  try {
    const apiKey = row.encryptedApiKey
      ? decryptSecret(row.encryptedApiKey)
      : undefined;
    const health = await checkApexBridge(row.endpoint, apiKey);
    const detail = health.capabilities.length
      ? `Live APEX Bridge v1 check passed; the endpoint declared ${health.capabilities.length} capability/ies.`
      : "Live APEX Bridge v1 check passed; no capabilities were declared.";
    await db
      .update(apexBridges)
      .set({ status: "connected", statusDetail: detail, testedAt: new Date() })
      .where(and(eq(apexBridges.id, id), eq(apexBridges.userId, userId)));
    const updated = (
      await db
        .select()
        .from(apexBridges)
        .where(and(eq(apexBridges.id, id), eq(apexBridges.userId, userId)))
        .limit(1)
    )[0];
    return updated ? toPublicBridge(updated) : null;
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message.slice(0, 280)
        : "The agent bridge check failed.";
    await db
      .update(apexBridges)
      .set({ status: "failed", statusDetail: detail, testedAt: new Date() })
      .where(and(eq(apexBridges.id, id), eq(apexBridges.userId, userId)));
    throw new Error(detail);
  }
}

export async function removeBridge(userId: number, id: string) {
  const db = await requiredDb();
  await db
    .delete(apexBridges)
    .where(and(eq(apexBridges.id, id), eq(apexBridges.userId, userId)));
}

export async function delegateToBridge(
  userId: number,
  bridgeId: string,
  task: string,
  context: Array<{ role: string; content: string }>,
  requestId: string
) {
  const db = await requiredDb();
  const row = (
    await db
      .select()
      .from(apexBridges)
      .where(and(eq(apexBridges.id, bridgeId), eq(apexBridges.userId, userId)))
      .limit(1)
  )[0];
  if (!row)
    throw new Error("That agent bridge is not available in your workspace.");
  if (row.status !== "connected")
    throw new Error(
      "This bridge has not passed a real connection check. Test it before delegating."
    );
  const apiKey = row.encryptedApiKey
    ? decryptSecret(row.encryptedApiKey)
    : undefined;
  const result = await runApexBridge(row.endpoint, apiKey, {
    requestId,
    task,
    context: context
      .slice(-8)
      .map(message => ({
        role: message.role,
        content: message.content.slice(0, 3_000),
      })),
  });
  return { bridgeName: row.name, ...result };
}
