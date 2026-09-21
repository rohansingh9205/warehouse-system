import crypto from "node:crypto";
import { env } from "@/common/config/env";

/** Generates a random numeric OTP of configured length. Never logged. */
export function generateOtpCode(): string {
  const length = env.OTP_LENGTH;
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(length, "0");
}

/** HMAC-based hash for OTP codes, keyed by OTP_SECRET, so DB leakage alone doesn't leak codes. */
export function hashOtpCode(code: string): string {
  return crypto.createHmac("sha256", env.OTP_SECRET).update(code).digest("hex");
}

export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Opaque, high-entropy session token. Only its hash is stored server-side. */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(token).digest("hex");
}

/** Constant-format API keys for the future integration client. */
export function generateApiKey(): string {
  return `wh_live_${crypto.randomBytes(24).toString("base64url")}`;
}
