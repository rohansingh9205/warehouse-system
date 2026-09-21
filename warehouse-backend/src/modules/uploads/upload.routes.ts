import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "@/common/middleware/require-auth";
import { imageOpsRateLimiter } from "@/common/middleware/rate-limiters";
import { validateImageFile, uploadProductImage, deleteProductImage } from "./cloudinary.service";
import { ProductModel } from "@/modules/products/product.model";
import { AppError } from "@/common/errors/app-error";
import { recordAuditEvent } from "@/modules/audit/audit.service";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN"), imageOpsRateLimiter);

router.post("/products/:productId/images", upload.single("image"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError(400, "No image file provided.");
    validateImageFile({ mimetype: req.file.mimetype, size: req.file.size });

    const product = await ProductModel.findById(req.params.productId);
    if (!product) throw new AppError(404, "Product not found.");

    const uploaded = await uploadProductImage(req.file.buffer, product.sku);

    product.images.push({
      secureUrl: uploaded.secureUrl,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      sortOrder: product.images.length,
      isPrimary: product.images.length === 0,
    });
    await product.save();

    await recordAuditEvent({
      eventType: "PRODUCT_UPDATED",
      actorUserId: req.currentUser!.id,
      actorRole: req.currentUser!.role,
      targetType: "Product",
      targetId: product._id.toString(),
      ip: req.ip,
      metadata: { action: "image_added", publicId: uploaded.publicId },
    });

    res.status(201).json({ image: uploaded });
  } catch (err) {
    next(err);
  }
});

router.delete("/products/:productId/images/:publicIdEncoded", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publicId = decodeURIComponent(req.params.publicIdEncoded);
    const product = await ProductModel.findById(req.params.productId);
    if (!product) throw new AppError(404, "Product not found.");

    const before = product.images.length;
    product.images = product.images.filter((img) => img.publicId !== publicId);
   if (product.images.length === before) {
  throw new AppError(404, "Image not found on this product.");
}
if (product.images.length > 0 && !product.images.some((img) => img.isPrimary)) {
  product.images[0].isPrimary = true;
  product.images[0].sortOrder = 0;

  product.images.forEach((img, index) => {
    img.sortOrder = index;
  });
}
    await deleteProductImage(publicId);
    await product.save();

    await recordAuditEvent({
      eventType: "PRODUCT_UPDATED",
      actorUserId: req.currentUser!.id,
      actorRole: req.currentUser!.role,
      targetType: "Product",
      targetId: product._id.toString(),
      ip: req.ip,
      metadata: { action: "image_removed", publicId },
    });

    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
});

export default router;
