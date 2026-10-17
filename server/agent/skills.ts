import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apexSkills } from "../../drizzle/schema";
import { getDb } from "../db";

const skillInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1_000).default(""),
  instructions: z.string().trim().min(1).max(24_000),
  enabled: z.boolean().default(false),
});

async function database() {
  const db = await getDb();
  if (!db) throw new Error("The application database is not available.");
  return db;
}

function toPublicSkill(row: typeof apexSkills.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    instructions: row.instructions,
    enabled: row.enabled === 1,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listSkills(userId: number) {
  const db = await database();
  const rows = await db
    .select()
    .from(apexSkills)
    .where(eq(apexSkills.userId, userId))
    .orderBy(desc(apexSkills.updatedAt));
  return rows.map(toPublicSkill);
}

export async function listEnabledSkills(userId: number) {
  const db = await database();
  const rows = await db
    .select()
    .from(apexSkills)
    .where(and(eq(apexSkills.userId, userId), eq(apexSkills.enabled, 1)))
    .orderBy(desc(apexSkills.updatedAt))
    .limit(8);
  return rows.map(row => ({
    name: row.name,
    description: row.description ?? "",
    instructions: row.instructions.slice(0, 24_000),
  }));
}

export async function saveSkill(userId: number, raw: unknown) {
  const input = skillInput.parse(raw);
  const db = await database();
  const existing = input.id
    ? (
        await db
          .select()
          .from(apexSkills)
          .where(
            and(eq(apexSkills.id, input.id), eq(apexSkills.userId, userId))
          )
          .limit(1)
      )[0]
    : undefined;
  if (input.id && !existing)
    throw new Error("That Skill was not found in your workspace.");

  if (input.enabled) {
    const enabled = await db
      .select({ id: apexSkills.id })
      .from(apexSkills)
      .where(and(eq(apexSkills.userId, userId), eq(apexSkills.enabled, 1)))
      .limit(8);
    const alreadyEnabled = existing?.enabled === 1;
    if (!alreadyEnabled && enabled.length >= 8)
      throw new Error("Enable at most eight Skills at a time.");
  }

  if (existing) {
    await db
      .update(apexSkills)
      .set({
        name: input.name,
        description: input.description,
        instructions: input.instructions,
        enabled: input.enabled ? 1 : 0,
        version: existing.version + 1,
      })
      .where(
        and(eq(apexSkills.id, existing.id), eq(apexSkills.userId, userId))
      );
    const updated = (
      await db
        .select()
        .from(apexSkills)
        .where(
          and(eq(apexSkills.id, existing.id), eq(apexSkills.userId, userId))
        )
        .limit(1)
    )[0];
    return updated ? toPublicSkill(updated) : null;
  }

  const id = randomUUID();
  await db.insert(apexSkills).values({
    id,
    userId,
    name: input.name,
    description: input.description,
    instructions: input.instructions,
    enabled: input.enabled ? 1 : 0,
    version: 1,
  });
  const saved = (
    await db
      .select()
      .from(apexSkills)
      .where(and(eq(apexSkills.id, id), eq(apexSkills.userId, userId)))
      .limit(1)
  )[0];
  return saved ? toPublicSkill(saved) : null;
}

export async function setSkillEnabled(
  userId: number,
  id: string,
  enabled: boolean
) {
  const db = await database();
  const row = (
    await db
      .select()
      .from(apexSkills)
      .where(and(eq(apexSkills.id, id), eq(apexSkills.userId, userId)))
      .limit(1)
  )[0];
  if (!row) throw new Error("That Skill was not found in your workspace.");
  if (enabled && row.enabled !== 1) {
    const active = await db
      .select({ id: apexSkills.id })
      .from(apexSkills)
      .where(and(eq(apexSkills.userId, userId), eq(apexSkills.enabled, 1)))
      .limit(8);
    if (active.length >= 8)
      throw new Error("Enable at most eight Skills at a time.");
  }
  await db
    .update(apexSkills)
    .set({ enabled: enabled ? 1 : 0 })
    .where(and(eq(apexSkills.id, id), eq(apexSkills.userId, userId)));
  const updated = (
    await db
      .select()
      .from(apexSkills)
      .where(and(eq(apexSkills.id, id), eq(apexSkills.userId, userId)))
      .limit(1)
  )[0];
  return updated ? toPublicSkill(updated) : null;
}

export async function deleteSkill(userId: number, id: string) {
  const db = await database();
  await db
    .delete(apexSkills)
    .where(and(eq(apexSkills.id, id), eq(apexSkills.userId, userId)));
  return { deleted: true } as const;
}
