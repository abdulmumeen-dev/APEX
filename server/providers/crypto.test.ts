import { afterEach, describe, expect, it } from "vitest";
import {
  credentialEncryptionReady,
  decryptSecret,
  encryptSecret,
} from "./crypto";

const originalKey = process.env.APEX_ENCRYPTION_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.APEX_ENCRYPTION_KEY;
  else process.env.APEX_ENCRYPTION_KEY = originalKey;
});

describe("APEX credential encryption", () => {
  it("round-trips a secret without storing its plaintext", () => {
    process.env.APEX_ENCRYPTION_KEY = "a".repeat(64);
    const plaintext = "test-key-never-use-as-a-real-credential";
    const envelope = encryptSecret(plaintext);
    expect(envelope).not.toContain(plaintext);
    expect(envelope.startsWith("v1.")).toBe(true);
    expect(decryptSecret(envelope)).toBe(plaintext);
    expect(credentialEncryptionReady()).toBe(true);
  });

  it("refuses to encrypt when the instance master key is missing", () => {
    delete process.env.APEX_ENCRYPTION_KEY;
    expect(credentialEncryptionReady()).toBe(false);
    expect(() => encryptSecret("test-only-value")).toThrow(
      /APEX_ENCRYPTION_KEY/
    );
  });

  it("rejects malformed master keys", () => {
    process.env.APEX_ENCRYPTION_KEY = "too-short";
    expect(credentialEncryptionReady()).toBe(false);
    expect(() => encryptSecret("test-only-value")).toThrow(/32 bytes/);
  });

  it("detects modified ciphertext", () => {
    process.env.APEX_ENCRYPTION_KEY = "b".repeat(64);
    const envelope = encryptSecret("test-only-value");
    const parts = envelope.split(".");
    parts[3] = `${parts[3].slice(0, -1)}${parts[3].endsWith("A") ? "B" : "A"}`;
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });
});
