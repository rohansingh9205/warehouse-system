import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { WarehouseModel } from "./warehouse.model";
import { CategoryModel } from "@/modules/categories/category.model";
import { requireAuth, requireRole } from "@/common/middleware/require-auth";
import { adminRateLimiter } from "@/common/middleware/rate-limiters";
import { validateBody } from "@/common/middleware/validate";

const router = Router();
router.use(requireAuth, adminRateLimiter);

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouses = await WarehouseModel.find({});
    res.json({ warehouses });
  } catch (err) {
    next(err);
  }
});

const createWarehouseSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(40).regex(/^[A-Za-z0-9-]+$/),
});

router.post("/", requireRole("SUPER_ADMIN"), validateBody(createWarehouseSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouse = await WarehouseModel.create({ name: req.body.name, code: req.body.code.toUpperCase() });
    res.status(201).json({ warehouse });
  } catch (err) {
    next(err);
  }
});

// Categories — deliberately open-ended, not hard-coded to SAREE/SILK_SUIT only.
router.get("/categories/all", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await CategoryModel.find({});
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

const createCategorySchema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Za-z0-9_]+$/),
  label: z.string().min(2).max(100),
});

router.post("/categories/all", requireRole("SUPER_ADMIN"), validateBody(createCategorySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await CategoryModel.create({ code: req.body.code.toUpperCase(), label: req.body.label });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

export default router;
