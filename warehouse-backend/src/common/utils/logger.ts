import pino from "pino";
import { env } from "@/common/config/env";

/**
 * Central logger. IMPORTANT: never pass OTP codes, passwords, session
 * secrets, API secrets, or raw request bodies containing credentials to
 * this logger. Redaction paths are set defensively as a second layer.
 */
export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "password",
      "*.password",
      "otp",
      "*.otp",
      "otpCode",
      "*.otpCode",
      "sessionSecret",
      "apiSecret",
      "req.headers.cookie",
      "req.headers.authorization",
    ],
    censor: "[REDACTED]",
  },
});
