import { Router } from "express";

import * as controller from "./product.controller";

import { requireAuth, requireRole } from "@/common/middleware/require-auth";

import { validateBody, validateQuery } from "@/common/middleware/validate";

import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} from "./product.validation";

import { adminRateLimiter } from "@/common/middleware/rate-limiters";

const router = Router();

router.use(requireAuth, adminRateLimiter);

// Both ADMIN and SUPER_ADMIN can view.

router.get("/", validateQuery(listProductsQuerySchema), controller.list);

router.get("/dashboard-counts", controller.dashboardCounts);

router.get("/:id", controller.getOne);

// Only SUPER_ADMIN can mutate. Enforced server-side — never trust the frontend.

router.post(
  "/",
  requireRole("SUPER_ADMIN"),
  validateBody(createProductSchema),
  controller.create
);

router.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validateBody(updateProductSchema),
  controller.update
);

// Archive
router.delete(
  "/:id",
  requireRole("SUPER_ADMIN"),
  controller.archive
);

// Restore archived product
router.patch(
  "/:id/restore",
  requireRole("SUPER_ADMIN"),
  controller.restore
);

// Permanently delete product
router.delete(
  "/:id/permanent",
  requireRole("SUPER_ADMIN"),
  controller.deletePermanently
);

export default router;