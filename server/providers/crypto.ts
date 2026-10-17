import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";

function getKey(): Buffer {
  const configured = process.env.APEX_ENCRYPTION_KEY?.trim();
  if (!configured) {
    throw new Error(
      "APEX_ENCRYPTION_KEY is not configured. Provider keys cannot be saved securely until the operator adds it."
    );
  }

  const key = /^[0-9a-f]{64}$/i.test(configured)
    ? Buffer.from(configured, "hex")
    : Buffer.from(configured, "base64");
  if (key.length !== 32) {
    throw new Error(
      "APEX_ENCRYPTION_KEY must decode to exactly 32 bytes (64 hex characters or Base64 for 32 random bytes)."
    );
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) throw new Error("A non-empty secret is required.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSecret(envelope: string): string {
  const [version, ivValue, tagValue, ciphertextValue, ...extra] =
    envelope.split(".");
  if (
    version !== VERSION ||
    !ivValue ||
    !tagValue ||
    !ciphertextValue ||
    extra.length > 0
  ) {
    throw new Error("Stored provider credential has an unsupported format.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function credentialEncryptionReady(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}
