import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { jwtVerify, SignJWT } from "jose";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import type { User } from "../../drizzle/schema";

export const APEX_LOCAL_COOKIE = "apex_owner_session";
const LOCAL_ISSUER = "apex-local";
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const PASSWORD_BYTES = 64;
const PASSWORD_SALT_BYTES = 16;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const FAILURE_LIMIT = 8;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

export type AuthMode = "manus" | "local";

export function getAuthMode(): AuthMode {
  const mode = process.env.APEX_AUTH_MODE ?? "manus";
  if (mode !== "manus" && mode !== "local") {
    throw new Error("APEX_AUTH_MODE must be either 'manus' or 'local'");
  }
  return mode;
}

function sessionKey(): Uint8Array {
  const encoded = process.env.APEX_LOCAL_SESSION_SECRET ?? "";
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("APEX_LOCAL_SESSION_SECRET must be a Base64-encoded 32-byte key");
  }
  return key;
}

function canonicalUsername(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

export function localOwnerOpenId(username: string): string {
  const canonical = canonicalUsername(username);
  return `local:${createHash("sha256").update(canonical).digest("hex").slice(0, 32)}`;
}

export function hashLocalPassword(password: string): string {
  if (Buffer.byteLength(password, "utf8") < 12 || Buffer.byteLength(password, "utf8") > 4096) {
    throw new Error("Local owner password must be between 12 and 4096 UTF-8 bytes");
  }
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const derived = scryptSync(password, salt, PASSWORD_BYTES, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  });
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export function verifyLocalPassword(password: string, encodedHash: string): boolean {
  try {
    const [scheme, saltText, hashText, extra] = encodedHash.split("$");
    if (scheme !== "scrypt" || !saltText || !hashText || extra !== undefined) return false;
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    if (salt.length !== PASSWORD_SALT_BYTES || expected.length !== PASSWORD_BYTES) return false;
    if (Buffer.byteLength(password, "utf8") > 4096) return false;
    const actual = scryptSync(password, salt, expected.length, {
      N: 16_384,
      r: 8,
      p: 1,
      maxmem: 32 * 1024 * 1024,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function isValidEncodedPasswordHash(encodedHash: string): boolean {
  const parts = encodedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt" || !parts[1] || !parts[2]) return false;
  try {
    return (
      Buffer.from(parts[1], "base64url").length === PASSWORD_SALT_BYTES &&
      Buffer.from(parts[2], "base64url").length === PASSWORD_BYTES
    );
  } catch {
    return false;
  }
}

export function validateLocalAuthConfiguration(): void {
  if (getAuthMode() !== "local") return;
  const username = process.env.APEX_LOCAL_USERNAME?.trim() ?? "";
  const passwordHash = process.env.APEX_LOCAL_PASSWORD_HASH ?? "";
  if (username.length < 3 || username.length > 128) {
    throw new Error("APEX_LOCAL_USERNAME must be between 3 and 128 characters");
  }
  if (!isValidEncodedPasswordHash(passwordHash)) {
    throw new Error("APEX_LOCAL_PASSWORD_HASH is missing or invalid; generate one with 'pnpm hash-password'");
  }
  sessionKey();
}

export function getAuthModeInfo() {
  const mode = getAuthMode();
  return {
    mode,
    localLoginConfigured:
      mode === "local" &&
      Boolean(
        process.env.APEX_LOCAL_USERNAME &&
          process.env.APEX_LOCAL_PASSWORD_HASH &&
          process.env.APEX_LOCAL_SESSION_SECRET
      ),
  } as const;
}

function attemptKey(req: Request, username: string): string {
  const address = req.ip || req.socket.remoteAddress || "unknown";
  return createHash("sha256")
    .update(`${address}\u0000${canonicalUsername(username)}`)
    .digest("hex");
}

function checkAttemptLimit(key: string): void {
  const current = failedAttempts.get(key);
  if (!current || current.resetAt <= Date.now()) {
    failedAttempts.set(key, { count: 0, resetAt: Date.now() + FAILURE_WINDOW_MS });
    return;
  }
  if (current.count >= FAILURE_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many sign-in attempts. Wait 15 minutes and try again.",
    });
  }
}

function recordFailedAttempt(key: string): void {
  const current = failedAttempts.get(key);
  if (!current || current.resetAt <= Date.now()) {
    failedAttempts.set(key, { count: 1, resetAt: Date.now() + FAILURE_WINDOW_MS });
    return;
  }
  current.count += 1;
}

function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.host === host;
  } catch {
    return false;
  }
}

function cookieOptions() {
  const secure = process.env.APEX_COOKIE_SECURE !== "false";
  return {
    httpOnly: true,
    path: "/",
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    maxAge: SESSION_TTL_SECONDS * 1000,
  };
}

function clearCookieOptions() {
  const { maxAge: _maxAge, ...options } = cookieOptions();
  return options;
}

export function clearLocalSessionCookie(res: Response): void {
  res.clearCookie(APEX_LOCAL_COOKIE, clearCookieOptions());
}

export async function localLogin(
  req: Request,
  res: Response,
  username: string,
  password: string
): Promise<User> {
  if (getAuthMode() !== "local") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Local sign-in is disabled on this instance" });
  }
  validateLocalAuthConfiguration();
  if (!isSameOriginRequest(req)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sign-in request origin was rejected" });
  }

  const key = attemptKey(req, username);
  checkAttemptLimit(key);
  const expectedUsername = canonicalUsername(process.env.APEX_LOCAL_USERNAME ?? "");
  const suppliedUsername = canonicalUsername(username);
  const expectedPasswordHash = process.env.APEX_LOCAL_PASSWORD_HASH ?? "";
  const accepted = suppliedUsername === expectedUsername && verifyLocalPassword(password, expectedPasswordHash);
  if (!accepted) {
    recordFailedAttempt(key);
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Username or password is incorrect" });
  }
  failedAttempts.delete(key);

  const openId = localOwnerOpenId(expectedUsername);
  const displayName = process.env.APEX_LOCAL_DISPLAY_NAME?.trim() || "APEX Owner";
  await db.upsertUser({
    openId,
    name: displayName,
    email: process.env.APEX_LOCAL_EMAIL?.trim() || null,
    loginMethod: "local",
    role: "admin",
    lastSignedIn: new Date(),
  });
  const user = await db.getUserByOpenId(openId);
  if (!user) throw new Error("Local owner account could not be loaded");

  const token = await new SignJWT({ name: user.name ?? displayName })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(LOCAL_ISSUER)
    .setAudience(LOCAL_ISSUER)
    .setSubject(openId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionKey());
  res.cookie(APEX_LOCAL_COOKIE, token, cookieOptions());
  return user;
}

export async function getLocalSessionUser(req: Request): Promise<User | null> {
  if (getAuthMode() !== "local") return null;
  const cookie = parseCookieHeader(req.headers.cookie ?? "")[APEX_LOCAL_COOKIE];
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie, sessionKey(), {
      algorithms: ["HS256"],
      issuer: LOCAL_ISSUER,
      audience: LOCAL_ISSUER,
    });
    const openId = payload.sub;
    if (typeof openId !== "string" || !openId.startsWith("local:")) return null;
    const user = await db.getUserByOpenId(openId);
    if (!user || user.loginMethod !== "local") return null;
    return user;
  } catch {
    // Invalid/expired sessions remain logged out. Never log token material.
    return null;
  }
}
