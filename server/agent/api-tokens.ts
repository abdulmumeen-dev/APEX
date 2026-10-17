import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { apexApiTokens } from "../../drizzle/schema";
import { getDb } from "../db";

const TOKEN_PREFIX = "apx_live_";

async function database() {
  const db = await getDb();
  if (!db) throw new Error("The application database is not available.");
  return db;
}

export function digestApiToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function validApiTokenShape(token: string) {
  return /^apx_live_[A-Za-z0-9_-]{43}$/.test(token);
}

export async function listApiTokens(userId: number) {
  const db = await database();
  const rows = await db
    .select({
      id: apexApiTokens.id,
      name: apexApiTokens.name,
      tokenPrefix: apexApiTokens.tokenPrefix,
      createdAt: apexApiTokens.createdAt,
      lastUsedAt: apexApiTokens.lastUsedAt,
      revokedAt: apexApiTokens.revokedAt,
    })
    .from(apexApiTokens)
    .where(eq(apexApiTokens.userId, userId))
    .orderBy(desc(apexApiTokens.createdAt))
    .limit(50);
  return rows;
}

export async function createApiToken(userId: number, name: string) {
  const db = await database();
  const active = await db
    .select({ id: apexApiTokens.id })
    .from(apexApiTokens)
    .where(
      and(eq(apexApiTokens.userId, userId), isNull(apexApiTokens.revokedAt))
    )
    .limit(10);
  if (active.length >= 10)
    throw new Error(
      "Revoke an unused CLI token before creating another; the per-account limit is 10."
    );

  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 120)
    throw new Error("Give this CLI token a name up to 120 characters.");
  const secret = randomBytes(32).toString("base64url");
  const token = `${TOKEN_PREFIX}${secret}`;
  const id = randomUUID();
  await db.insert(apexApiTokens).values({
    id,
    userId,
    name: cleanName,
    tokenPrefix: token.slice(0, 18),
    tokenHash: digestApiToken(token),
  });
  return {
    id,
    name: cleanName,
    token,
    tokenPrefix: token.slice(0, 18),
    warning:
      "Copy this token now. APEX stores only its hash and cannot show it again.",
  };
}

export async function revokeApiToken(userId: number, id: string) {
  const db = await database();
  await db
    .update(apexApiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(apexApiTokens.id, id), eq(apexApiTokens.userId, userId)));
  return { revoked: true } as const;
}

export async function authenticateApiToken(token: string) {
  if (!validApiTokenShape(token)) return null;
  const db = await database();
  const row = (
    await db
      .select({ id: apexApiTokens.id, userId: apexApiTokens.userId })
      .from(apexApiTokens)
      .where(
        and(
          eq(apexApiTokens.tokenHash, digestApiToken(token)),
          isNull(apexApiTokens.revokedAt)
        )
      )
      .limit(1)
  )[0];
  if (!row) return null;
  await db
    .update(apexApiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apexApiTokens.id, row.id));
  return { tokenId: row.id, userId: row.userId };
}
