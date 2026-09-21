import { Router, Request, Response, NextFunction } from "express";
import { ProductModel } from "@/modules/products/product.model";
import { CategoryModel } from "@/modules/categories/category.model";
import { requireIntegrationApiKey } from "./integration-auth.middleware";
import { integrationRateLimiter } from "@/common/middleware/rate-limiters";
import { toPublicProductDto, publicVisibilityFilter } from "./product.dto";
import { AppError } from "@/common/errors/app-error";

const router = Router();
router.use(requireIntegrationApiKey, integrationRateLimiter);

// GET /api/v1/integration/products?page=&pageSize=&category=
router.get("/products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20);
    const filter: Record<string, unknown> = { ...publicVisibilityFilter() };
    if (req.query.category) filter.category = String(req.query.category).toUpperCase();

    const [items, total] = await Promise.all([
      ProductModel.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      ProductModel.countDocuments(filter),
    ]);

    res.json({
      items: items.map(toPublicProductDto),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/integration/products/:sku
router.get("/products/:sku", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sku = req.params.sku.toUpperCase();
    const product = await ProductModel.findOne({ sku, ...publicVisibilityFilter() }).collation({ locale: "en", strength: 2 });
    if (!product) throw new AppError(404, "Product not found.");
    res.json({ product: toPublicProductDto(product) });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/integration/inventory  (lightweight sku -> availability map, for cart/stock checks)
router.get("/inventory", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = { ...publicVisibilityFilter() };
    const products = await ProductModel.find(filter).select("sku stockQuantity inventoryStatus updatedAt");
    res.json({
      items: products.map((p) => ({
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        availability: p.stockQuantity > 0 && p.inventoryStatus === "ACTIVE" ? "IN_STOCK" : "OUT_OF_STOCK",
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/integration/categories
router.get("/categories", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await CategoryModel.find({ isActive: true }).select("code label");
    res.json({ items: categories.map((c) => ({ code: c.code, label: c.label })) });
  } catch (err) {
    next(err);
  }
});

export default router;
