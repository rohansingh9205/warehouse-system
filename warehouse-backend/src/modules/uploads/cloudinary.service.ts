import { v2 as cloudinary } from "cloudinary";
import { env } from "@/common/config/env";
import { AppError } from "@/common/errors/app-error";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MIN_DIMENSION = 300;
const MAX_DIMENSION = 6000;

export function validateImageFile(file: { mimetype: string; size: number }): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new AppError(400, `Unsupported image type: ${file.mimetype}`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError(400, "Image exceeds maximum file size of 10MB.");
  }
}

export function validateImageDimensions(width: number, height: number): void {
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new AppError(400, `Image too small. Minimum ${MIN_DIMENSION}x${MIN_DIMENSION}px.`);
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new AppError(400, `Image too large. Maximum ${MAX_DIMENSION}x${MAX_DIMENSION}px.`);
  }
}

/**
 * Uploads a buffer to Cloudinary under warehouse/products/<SKU>/. Only
 * called from server-side code — the API secret never reaches the browser.
 * The frontend uploads to OUR backend (multipart), and we forward to
 * Cloudinary here, rather than exposing an unsigned/browser-direct preset.
 */
export async function uploadProductImage(buffer: Buffer, sku: string): Promise<{
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}> {
  const folder = `${env.CLOUDINARY_FOLDER_ROOT}/${sku.toUpperCase()}`;

  const result = await new Promise<import("cloudinary").UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", overwrite: false },
      (error, res) => {
        if (error || !res) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(res);
      }
    );
    stream.end(buffer);
  });

  validateImageDimensions(result.width, result.height);

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

export async function deleteProductImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
