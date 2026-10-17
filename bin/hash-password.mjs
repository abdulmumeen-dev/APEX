#!/usr/bin/env node
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

const PASSWORD_BYTES = 64;
const salt = randomBytes(16);
const input = readline.createInterface({ input: process.stdin, output: process.stdout });

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal so the password is not echoed."));
      return;
    }
    process.stdout.write(prompt);
    let value = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const onData = chunk => {
      const key = chunk.toString("utf8");
      if (key === "\u0003") {
        process.stdin.setRawMode(false);
        reject(new Error("Cancelled."));
        return;
      }
      if (key === "\r" || key === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value);
        return;
      }
      if (key === "\u007f" || key === "\b") value = value.slice(0, -1);
      else if (key.length === 1 && key >= " ") value += key;
    };
    process.stdin.on("data", onData);
  });
}

try {
  const first = await readHidden("New APEX local-owner password (12+ characters): ");
  const second = await readHidden("Confirm password: ");
  if (first !== second) throw new Error("Passwords do not match.");
  if (Buffer.byteLength(first, "utf8") < 12 || Buffer.byteLength(first, "utf8") > 4096) {
    throw new Error("Password must be between 12 and 4096 UTF-8 bytes.");
  }
  const derived = scryptSync(first, salt, PASSWORD_BYTES, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  });
  process.stdout.write(`APEX_LOCAL_PASSWORD_HASH=scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "Password hash generation failed."}\n`);
  process.exitCode = 1;
} finally {
  input.close();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
}
