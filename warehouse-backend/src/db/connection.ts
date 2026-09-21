import mongoose from "mongoose";
import { env } from "@/common/config/env";
import { logger } from "@/common/utils/logger";

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI, {
    // A dedicated, least-privilege DB user should be used in MONGODB_URI.
    // This app never assumes root/admin credentials.
    autoIndex: env.NODE_ENV !== "production", // build indexes explicitly in prod via migration script
  });

  isConnected = true;
  logger.info("Connected to MongoDB (silk_warehouse)");

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("MongoDB disconnected");
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
}
