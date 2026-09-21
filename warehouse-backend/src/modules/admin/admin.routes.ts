import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserModel } from "./user.model";
import { requireAuth, requireRole } from "@/common/middleware/require-auth";
import { adminRateLimiter } from "@/common/middleware/rate-limiters";
import { validateBody } from "@/common/middleware/validate";
import { revokeAllSessionsForUser } from "@/modules/auth/session.service";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import { AppError } from "@/common/errors/app-error";

const router = Router();
router.use(requireAuth, requireRole("SUPER_ADMIN"), adminRateLimiter);

router.get("/users", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserModel.find({}).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

const toggleSchema = z.object({ isActive: z.boolean() });

router.patch("/users/:id/status", validateBody(toggleSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await UserModel.findById(req.params.id);
    if (!target) throw new AppError(404, "User not found.");
    if (target.role === "SUPER_ADMIN") throw new AppError(400, "Super Admin status cannot be changed here.");

    target.isActive = req.body.isActive;
    if (!target.isActive) {
      target.disabledAt = new Date();
      target.disabledBy = req.currentUser!.id as unknown as typeof target.disabledBy;
      await revokeAllSessionsForUser(target._id); // kick out immediately
    } else {
      target.disabledAt = undefined;
      target.disabledBy = undefined;
    }
    await target.save();

    await recordAuditEvent({
      eventType: target.isActive ? "ADMIN_ENABLED" : "ADMIN_DISABLED",
      actorUserId: req.currentUser!.id,
      actorRole: req.currentUser!.role,
      targetType: "User",
      targetId: target._id.toString(),
      ip: req.ip,
    });

    res.json({ user: target });
  } catch (err) {
    next(err);
  }
});

export default router;
