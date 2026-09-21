import { Router, Request, Response, NextFunction } from "express";
import { AuditLogModel } from "./audit-log.model";
import { requireAuth, requireRole } from "@/common/middleware/require-auth";
import { adminRateLimiter } from "@/common/middleware/rate-limiters";

const router = Router();
router.use(requireAuth, requireRole("SUPER_ADMIN"), adminRateLimiter);

// Read-only. There is intentionally no PATCH/DELETE route for audit logs —
// they must never be modifiable through the API.
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 50);
    const filter: Record<string, unknown> = {};
    if (req.query.eventType) filter.eventType = req.query.eventType;

    const [items, total] = await Promise.all([
      AuditLogModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      AuditLogModel.countDocuments(filter),
    ]);

    res.json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (err) {
    next(err);
  }
});

export default router;
