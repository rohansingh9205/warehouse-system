import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../src/common/utils/password";
import { generateOtpCode, hashOtpCode, timingSafeEqual } from "../src/common/utils/crypto";

describe("password utils", () => {
  it("rejects passwords shorter than 12 characters", () => {
    expect(validatePasswordStrength("short1234").valid).toBe(false);
  });

  it("accepts passwords of 12+ characters", () => {
    expect(validatePasswordStrength("aVeryLongPassword123").valid).toBe(true);
  });

  it("hashes and verifies a password round-trip", async () => {
    const hash = await hashPassword("aVeryLongPassword123");
    expect(hash).not.toContain("aVeryLongPassword123");
    expect(await verifyPassword(hash, "aVeryLongPassword123")).toBe(true);
    expect(await verifyPassword(hash, "wrongPassword12345")).toBe(false);
  });
});

describe("otp crypto utils", () => {
  it("generates codes of the configured length", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hashes consistently for the same code", () => {
    const code = "123456";
    expect(hashOtpCode(code)).toBe(hashOtpCode(code));
  });

  it("produces different hashes for different codes", () => {
    expect(hashOtpCode("111111")).not.toBe(hashOtpCode("222222"));
  });

  it("timingSafeEqual matches equal strings and rejects unequal ones", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});
