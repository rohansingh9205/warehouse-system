import { OtpModel, OtpChannel, OtpPurpose } from "./otp.model";
import { generateOtpCode, hashOtpCode } from "@/common/utils/crypto";
import { env } from "@/common/config/env";
import { AppError } from "@/common/errors/app-error";
import { logger } from "@/common/utils/logger";

/**
 * Sends OTP via the configured provider. Stubbed here since this sandbox
 * has no network access to a real SMS/Email provider — wire up your
 * provider's SDK (e.g. Twilio, MSG91, SendGrid, SES) in these two
 * functions. IMPORTANT: never log the OTP code itself, only that a send
 * was attempted.
 */
async function dispatchOtp(channel: OtpChannel, destination: string, code: string): Promise<void> {
  if (env.NODE_ENV !== "production") {
    // Dev convenience only — this branch must never run in production.
    logger.debug({ destination, channel }, "DEV MODE: OTP generated (not logged for security)");
  }
  // TODO: integrate real provider using env.SMS_PROVIDER_API_KEY / EMAIL_PROVIDER_API_KEY
  void code; // never logged, never returned to caller beyond this function
}

export async function requestOtp(params: {
  destination: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
}): Promise<{ expiresAt: Date }> {
  const { destination, channel, purpose } = params;

  const existing = await OtpModel.findOne({ destination, channel, purpose })
    .sort({ createdAt: -1 })
    .select("+codeHash");

  if (existing?.lockedUntil && existing.lockedUntil > new Date()) {
    throw new AppError(429, "OTP temporarily locked. Try again later.");
  }

  if (existing?.lastSentAt) {
    const cooldownMs = env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
    const elapsed = Date.now() - existing.lastSentAt.getTime();
    if (elapsed < cooldownMs) {
      throw new AppError(429, "Please wait before requesting another OTP.");
    }
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  await OtpModel.create({
    destination,
    channel,
    purpose,
    codeHash,
    attempts: 0,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    expiresAt,
    lastSentAt: new Date(),
  });

  await dispatchOtp(channel, destination, code);

  return { expiresAt };
}

export async function verifyOtp(params: {
  destination: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  code: string;
}): Promise<boolean> {
  const { destination, channel, purpose, code } = params;

  const record = await OtpModel.findOne({ destination, channel, purpose, consumedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .select("+codeHash");

  // Generic error message to prevent account/OTP enumeration.
  const genericError = () => new AppError(400, "Invalid or expired code.");

  if (!record) throw genericError();
  if (record.lockedUntil && record.lockedUntil > new Date()) throw new AppError(429, "Too many attempts. Try again later.");
  if (record.expiresAt < new Date()) throw genericError();

  const candidateHash = hashOtpCode(code);
  const isMatch = candidateHash === record.codeHash;

  if (!isMatch) {
    record.attempts += 1;
    if (record.attempts >= record.maxAttempts) {
      record.lockedUntil = new Date(Date.now() + env.OTP_LOCKOUT_MINUTES * 60 * 1000);
    }
    await record.save();
    throw genericError();
  }

  record.consumedAt = new Date();
  await record.save();
  return true;
}
