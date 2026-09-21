import { Response } from "express";
import { Types } from "mongoose";
import { SessionModel } from "./session.model";
import { generateSessionToken, hashSessionToken } from "@/common/utils/crypto";
import { env } from "@/common/config/env";

export interface CreateSessionInput {
  userId: Types.ObjectId | string;
  ip?: string;
  userAgent?: string;
  rotatedFrom?: Types.ObjectId | string;
}

const ttlMs = () => env.SESSION_TTL_MINUTES * 60 * 1000;

export async function createSession(input: CreateSessionInput): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + ttlMs());

  await SessionModel.create({
    userId: input.userId,
    tokenHash,
    ip: input.ip,
    userAgent: input.userAgent,
    expiresAt,
    rotatedFrom: input.rotatedFrom,
  });

  return { token, expiresAt };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE, // must be true in production (HTTPS)
    sameSite: "lax",
    domain: env.COOKIE_DOMAIN === "localhost" ? undefined : env.COOKIE_DOMAIN,
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(env.SESSION_COOKIE_NAME, { path: "/" });
}

export async function findActiveSessionByToken(token: string) {
  const tokenHash = hashSessionToken(token);
  return SessionModel.findOne({
    tokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
}

export async function revokeSession(sessionId: Types.ObjectId | string): Promise<void> {
  await SessionModel.updateOne({ _id: sessionId }, { $set: { revokedAt: new Date() } });
}

/** Logout from all devices: revoke every active session for a user. */
export async function revokeAllSessionsForUser(userId: Types.ObjectId | string): Promise<void> {
  await SessionModel.updateMany(
    { userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}

/**
 * Session rotation: on privilege-sensitive events (login, password change),
 * issue a brand new token and revoke the old one, rather than reusing it.
 */
export async function rotateSession(oldSessionId: Types.ObjectId | string, userId: Types.ObjectId | string, ip?: string, userAgent?: string) {
  await revokeSession(oldSessionId);
  return createSession({ userId, ip, userAgent, rotatedFrom: oldSessionId });
}
