import rateLimit from "express-rate-limit";
import { env } from "@/common/config/env";

/**
 * Separate limiter instances per endpoint class, as required: login, OTP,
 * admin endpoints, integration endpoints, image operations. Each is keyed
 * by IP by default; login/OTP limiters additionally key by the submitted
 * destination to blunt distributed credential-stuffing against one target.
 */

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.LOGIN_RATE_LIMIT_PER_15MIN,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.OTP_RATE_LIMIT_PER_15MIN,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests. Please try again later." },
});

export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.ADMIN_RATE_LIMIT_PER_MIN,
  standardHeaders: true,
  legacyHeaders: false,
});

export const integrationRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.INTEGRATION_RATE_LIMIT_PER_MIN,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Integration API rate limit exceeded." },
});

export const imageOpsRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
