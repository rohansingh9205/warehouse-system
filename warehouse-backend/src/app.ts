import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "@/common/config/env";
import { logger } from "@/common/utils/logger";
import { errorHandler, notFoundHandler } from "@/common/middleware/error-handler";

import authRoutes from "@/modules/auth/auth.routes";
import productRoutes from "@/modules/products/product.routes";
import adminRoutes from "@/modules/admin/admin.routes";
import warehouseRoutes from "@/modules/warehouses/warehouse.routes";
import paymentRoutes from "@/modules/payment/payment.routes";
import auditRoutes from "@/modules/audit/audit.routes";
import uploadRoutes from "@/modules/uploads/upload.routes";
import integrationRoutes from "@/modules/integration/integration.routes";

export function createApp(): Express {
  const app = express();

  // --- Security-hardening middleware (applied globally) ---
  app.use(helmet());
  app.use(
    cors({
      origin: env.WAREHOUSE_FRONTEND_ORIGIN, // only the warehouse frontend by default
      credentials: true, // required for HTTP-only session cookies
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" })); // small limit — image bytes go via multer, not JSON
  app.use(pinoHttp({ logger }));

  // Never trust X-Forwarded-* blindly unless behind a known proxy; adjust
  // `trust proxy` to match your real deployment topology.
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

  // --- Versioned API (see docs/API.md; breaking changes go to /api/v2) ---
  const v1 = express.Router();
  v1.use("/auth", authRoutes);
  v1.use("/products", productRoutes);
  v1.use("/admin", adminRoutes);
  v1.use("/warehouses", warehouseRoutes);
  v1.use("/payment", paymentRoutes);
  v1.use("/audit-logs", auditRoutes);
  v1.use("/uploads", uploadRoutes);

  // Public-facing, API-key-authenticated boundary for the FUTURE website.
  // Never mount this under the same auth as the admin routes above.
  v1.use("/integration", integrationRoutes);

  app.use("/api/v1", v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
