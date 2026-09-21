import { Request, Response, NextFunction } from "express";
import { UserModel } from "@/modules/admin/user.model";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/common/utils/password";
import { requestOtp, verifyOtp } from "./otp.service";
import { createSession, setSessionCookie, clearSessionCookie, revokeSession, revokeAllSessionsForUser } from "./session.service";
import { AppError } from "@/common/errors/app-error";
import { recordAuditEvent } from "@/modules/audit/audit.service";

// --- OTP request/verify (shared by registration, login-2FA, password reset) ---

export async function requestPhoneOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, purpose } = req.body;
    const { expiresAt } = await requestOtp({ destination: phone, channel: "PHONE", purpose });
    await recordAuditEvent({ eventType: "OTP_REQUESTED", ip: req.ip, userAgent: req.headers["user-agent"], metadata: { channel: "PHONE", purpose } });
    res.json({ status: "sent", expiresAt });
  } catch (err) {
    next(err);
  }
}

export async function verifyPhoneOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, code, purpose } = req.body;
    await verifyOtp({ destination: phone, channel: "PHONE", purpose, code });
    res.json({ status: "verified" });
  } catch (err) {
    if (err instanceof AppError) {
      await recordAuditEvent({ eventType: "OTP_FAILED", ip: req.ip, userAgent: req.headers["user-agent"], metadata: { channel: "PHONE" } });
    }
    next(err);
  }
}

export async function requestEmailOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, purpose } = req.body;
    const { expiresAt } = await requestOtp({ destination: email, channel: "EMAIL", purpose });
    await recordAuditEvent({ eventType: "OTP_REQUESTED", ip: req.ip, userAgent: req.headers["user-agent"], metadata: { channel: "EMAIL", purpose } });
    res.json({ status: "sent", expiresAt });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmailOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code, purpose } = req.body;
    await verifyOtp({ destination: email, channel: "EMAIL", purpose, code });
    res.json({ status: "verified" });
  } catch (err) {
    if (err instanceof AppError) {
      await recordAuditEvent({ eventType: "OTP_FAILED", ip: req.ip, userAgent: req.headers["user-agent"], metadata: { channel: "EMAIL" } });
    }
    next(err);
  }
}

// --- Registration (Admin accounts only; Super Admin is CLI-only, see scripts/create-super-admin.ts) ---

export async function registerAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, phone, email, password } = req.body;

    const strength = validatePasswordStrength(password);
    if (!strength.valid) throw new AppError(400, strength.reason!);

    // Both phone and email OTP must have been verified immediately prior
    // to this call. We check for a recently consumed OTP for each.
    const otpModel = (await import("./otp.model")).OtpModel;
    const phoneOk = await otpModel.findOne({ destination: phone, channel: "PHONE", purpose: "REGISTRATION", consumedAt: { $exists: true } }).sort({ createdAt: -1 });
    const emailOk = await otpModel.findOne({ destination: email, channel: "EMAIL", purpose: "REGISTRATION", consumedAt: { $exists: true } }).sort({ createdAt: -1 });

    if (!phoneOk || !emailOk) {
      throw new AppError(400, "Phone and email must be verified before completing registration.");
    }

    const existingByEmail = await UserModel.findOne({ email });
    const existingByPhone = await UserModel.findOne({ phone });
    if (existingByEmail || existingByPhone) {
      // Generic message — do not reveal which field collided (enumeration protection).
      throw new AppError(409, "An account with these details already exists.");
    }

    const passwordHash = await hashPassword(password);

    const user = await UserModel.create({
      name,
      phone,
      email,
      passwordHash,
      role: "ADMIN", // registration NEVER creates SUPER_ADMIN
      isPhoneVerified: true,
      isEmailVerified: true,
    });

    await recordAuditEvent({ eventType: "ADMIN_CREATED", actorUserId: user._id, actorRole: "ADMIN", targetType: "User", targetId: user._id.toString(), ip: req.ip });

    res.status(201).json({ status: "created", userId: user._id });
  } catch (err) {
    next(err);
  }
}

// --- Login ---

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, password } = req.body;
    const isEmail = identifier.includes("@");

    const user = await UserModel.findOne(isEmail ? { email: identifier.toLowerCase() } : { phone: identifier }).select("+passwordHash");

    // Constant-shape response to prevent user enumeration via timing/response differences.
    const genericFail = async () => {
      await recordAuditEvent({ eventType: "LOGIN_FAILURE", ip: req.ip, userAgent: req.headers["user-agent"], metadata: { identifier } });
      throw new AppError(401, "Invalid credentials.");
    };

    if (!user) await genericFail();
    if (!user!.isActive) throw new AppError(403, "Account is disabled. Contact your Super Admin.");

    const passwordOk = await verifyPassword(user!.passwordHash, password);
    if (!passwordOk) await genericFail();

    const { token, expiresAt } = await createSession({ userId: user!._id, ip: req.ip, userAgent: req.headers["user-agent"] });
    setSessionCookie(res, token, expiresAt);

    await recordAuditEvent({ eventType: "LOGIN_SUCCESS", actorUserId: user!._id, actorRole: user!.role, ip: req.ip, userAgent: req.headers["user-agent"] });

    res.json({
      status: "ok",
      user: { id: user!._id, name: user!.name, role: user!.role, email: user!.email },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.sessionId) await revokeSession(req.sessionId);
    clearSessionCookie(res);
    await recordAuditEvent({ eventType: "LOGOUT", actorUserId: req.currentUser?.id, actorRole: req.currentUser?.role, ip: req.ip });
    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function logoutAllDevices(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.currentUser) throw new AppError(401, "Authentication required.");
    await revokeAllSessionsForUser(req.currentUser.id);
    clearSessionCookie(res);
    await recordAuditEvent({ eventType: "LOGOUT_ALL_DEVICES", actorUserId: req.currentUser.id, actorRole: req.currentUser.role, ip: req.ip });
    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
}

// --- Password management ---

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.currentUser) throw new AppError(401, "Authentication required.");
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.currentUser.id).select("+passwordHash");
    if (!user) throw new AppError(401, "Account not found.");

    const ok = await verifyPassword(user.passwordHash, currentPassword);
    if (!ok) throw new AppError(400, "Current password is incorrect.");

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) throw new AppError(400, strength.reason!);

    user.passwordHash = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    await user.save();

    // Invalidate all other sessions on password change.
    await revokeAllSessionsForUser(user._id);
    const { token, expiresAt } = await createSession({ userId: user._id, ip: req.ip, userAgent: req.headers["user-agent"] });
    setSessionCookie(res, token, expiresAt);

    await recordAuditEvent({ eventType: "PASSWORD_CHANGED", actorUserId: user._id, actorRole: user.role, ip: req.ip });

    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, otpChannel, code, newPassword } = req.body;
    const isEmail = otpChannel === "EMAIL";

    const user = await UserModel.findOne(isEmail ? { email: identifier.toLowerCase() } : { phone: identifier });
    if (!user) throw new AppError(400, "Invalid request."); // generic — no enumeration

    await verifyOtp({ destination: isEmail ? user.email : user.phone, channel: otpChannel, purpose: "PASSWORD_RESET", code });

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) throw new AppError(400, strength.reason!);

    user.passwordHash = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    await user.save();

    // Invalidate all previous sessions after a reset.
    await revokeAllSessionsForUser(user._id);

    await recordAuditEvent({ eventType: "PASSWORD_RESET", actorUserId: user._id, actorRole: user.role, ip: req.ip });

    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.currentUser) throw new AppError(401, "Authentication required.");
    res.json({ user: req.currentUser });
  } catch (err) {
    next(err);
  }
}
