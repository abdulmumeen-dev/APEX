import { afterEach, describe, expect, it } from "vitest";
import {
  hashLocalPassword,
  localOwnerOpenId,
  verifyLocalPassword,
} from "./local-auth";

afterEach(() => {
  delete process.env.APEX_AUTH_MODE;
});

describe("local owner credentials", () => {
  it("hashes passwords with a random salt and verifies only the matching value", () => {
    const password = "correct-horse-battery-staple";
    const first = hashLocalPassword(password);
    const second = hashLocalPassword(password);

    expect(first).toMatch(/^scrypt\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
    expect(first).not.toBe(second);
    expect(verifyLocalPassword(password, first)).toBe(true);
    expect(verifyLocalPassword("a-different-password", first)).toBe(false);
  });

  it("rejects weak password setup values and malformed hashes", () => {
    expect(() => hashLocalPassword("short")).toThrow(/12/);
    expect(verifyLocalPassword("anything", "not-a-hash")).toBe(false);
  });

  it("derives a stable non-identifying local owner ID from the configured username", () => {
    expect(localOwnerOpenId("APEX-Owner")).toBe(localOwnerOpenId(" apex-owner "));
    expect(localOwnerOpenId("apex-owner")).toMatch(/^local:[a-f0-9]{32}$/);
    expect(localOwnerOpenId("different-owner")).not.toBe(localOwnerOpenId("apex-owner"));
  });
});
