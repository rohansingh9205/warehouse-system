import "dotenv/config";
import { z } from "zod";

/**
 * All environment variables are validated at boot. The process refuses to
 * start with missing/invalid config rather than running with silent
 * defaults for security-sensitive values.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 chars"),
  SESSION_TTL_MINUTES: z.coerce.number().default(60),
  SESSION_COOKIE_NAME: z.string().default("wh_sid"),
  COOKIE_DOMAIN: z.string().default("localhost"),
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  OTP_SECRET: z.string().min(16, "OTP_SECRET must be at least 16 chars"),
  OTP_LENGTH: z.coerce.number().default(6),
  OTP_TTL_MINUTES: z.coerce.number().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  OTP_LOCKOUT_MINUTES: z.coerce.number().default(15),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_FOLDER_ROOT: z.string().default("warehouse/products"),

  EMAIL_PROVIDER_API_KEY: z.string().default(""),
  SMS_PROVIDER_API_KEY: z.string().default(""),

  INTEGRATION_SECRET: z.string().min(16, "INTEGRATION_SECRET must be at least 16 chars"),
  INTEGRATION_RATE_LIMIT_PER_MIN: z.coerce.number().default(60),

  WAREHOUSE_FRONTEND_ORIGIN: z.string().default("http://localhost:3000"),

  LOGIN_RATE_LIMIT_PER_15MIN: z.coerce.number().default(10),
  OTP_RATE_LIMIT_PER_15MIN: z.coerce.number().default(5),
  ADMIN_RATE_LIMIT_PER_MIN: z.coerce.number().default(120),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
