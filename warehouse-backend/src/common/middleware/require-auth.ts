import { Request, Response, NextFunction } from "express";
import { env } from "@/common/config/env";
import { findActiveSessionByToken } from "@/modules/auth/session.service";
import { UserModel, UserRole } from "@/modules/admin/user.model";
import { AppError } from "@/common/errors/app-error";
import { recordAuditEvent } from "@/modules/audit/audit.service";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        role: UserRole;
        name: string;
        email: string;
      };
      sessionId?: string;
    }
  }
}

/**
 * Requires a valid, non-expired, non-revoked session. Populates
 * req.currentUser. This is the ONLY source of truth for identity —
 * frontend hints are never trusted.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[env.SESSION_COOKIE_NAME];
    if (!token) throw new AppError(401, "Authentication required.");

    const session = await findActiveSessionByToken(token);
    if (!session) throw new AppError(401, "Session expired or invalid.");

    const user = await UserModel.findById(session.userId);
    if (!user || !user.isActive) throw new AppError(401, "Account is not active.");

    req.currentUser = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };
    req.sessionId = session._id.toString();
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based authorization gate. ALL authorization decisions are made
 * server-side here — the frontend hiding a button is a UX nicety only,
 * never a security boundary.
 */
export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.currentUser) {
      next(new AppError(401, "Authentication required."));
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      await recordAuditEvent({
        eventType: "UNAUTHORIZED_ATTEMPT",
        actorUserId: req.currentUser.id,
        actorRole: req.currentUser.role,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: { path: req.originalUrl, method: req.method, requiredRoles: roles },
      });
      next(new AppError(403, "You do not have permission to perform this action."));
      return;
    }
    next();
  };
}
