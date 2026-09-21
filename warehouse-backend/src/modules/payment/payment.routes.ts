import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { PaymentSettingsModel } from "./payment-settings.model";
import { requireAuth, requireRole } from "@/common/middleware/require-auth";
import { adminRateLimiter, imageOpsRateLimiter } from "@/common/middleware/rate-limiters";
import { validateImageFile, uploadProductImage, deleteProductImage } from "@/modules/uploads/cloudinary.service";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import { AppError } from "@/common/errors/app-error";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
const router = Router();

router.use(requireAuth, adminRateLimiter);

// Both ADMIN and SUPER_ADMIN can view the current QR.
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await PaymentSettingsModel.findOne({}).sort({ updatedAt: -1 });
    res.json({ payment: settings?.qrImage ?? null });
  } catch (err) {
    next(err);
  }
});

// Only SUPER_ADMIN can upload/replace/delete.
router.post(
  "/qr",
  requireRole("SUPER_ADMIN"),
  imageOpsRateLimiter,
  upload.single("qr"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError(400, "No QR image provided.");
      validateImageFile({ mimetype: req.file.mimetype, size: req.file.size });

      const uploaded = await uploadProductImage(req.file.buffer, "PAYMENT-QR");

      const settings = await PaymentSettingsModel.create({
        qrImage: { secureUrl: uploaded.secureUrl, publicId: uploaded.publicId },
        updatedBy: req.currentUser!.id,
      });

      await recordAuditEvent({
        eventType: "QR_CHANGED",
        actorUserId: req.currentUser!.id,
        actorRole: req.currentUser!.role,
        ip: req.ip,
      });

      res.status(201).json({ payment: settings.qrImage });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/qr", requireRole("SUPER_ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await PaymentSettingsModel.findOne({}).sort({ updatedAt: -1 });
    if (settings?.qrImage?.publicId) {
      await deleteProductImage(settings.qrImage.publicId);
      settings.qrImage = undefined;
      await settings.save();
    }
    await recordAuditEvent({ eventType: "QR_CHANGED", actorUserId: req.currentUser!.id, actorRole: req.currentUser!.role, ip: req.ip, metadata: { action: "deleted" } });
    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
});

export default router;
