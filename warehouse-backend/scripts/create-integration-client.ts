/**
 * Issues a new integration API key for a future consumer of
 * /api/v1/integration/* (e.g. the selling website). Print the raw key ONCE
 * — only its hash is stored, so it cannot be recovered later; rotate by
 * creating a new client and revoking the old one.
 *
 * Usage:
 *   npm run create-integration-client -- --name "selling-website-prod"
 */
import "dotenv/config";
import crypto from "node:crypto";
import { connectDatabase, disconnectDatabase } from "@/db/connection";
import { IntegrationClientModel } from "@/modules/integration/integration-client.model";
import { env } from "@/common/config/env";
import { generateApiKey } from "@/common/utils/crypto";

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

function hashApiKey(key: string): string {
  return crypto.createHmac("sha256", env.INTEGRATION_SECRET).update(key).digest("hex");
}

async function main() {
  const clientName = parseArg("--name");
  if (!clientName) {
    console.error("Usage: npm run create-integration-client -- --name <client-name>");
    process.exit(1);
  }

  await connectDatabase();

  const apiKey = generateApiKey();
  await IntegrationClientModel.create({ clientName, apiKeyHash: hashApiKey(apiKey) });

  console.log(`Integration client "${clientName}" created.`);
  console.log(`API key (store securely — shown once): ${apiKey}`);
  console.log(`Send it as header:  x-api-key: ${apiKey}`);

  await disconnectDatabase();
}

main().catch((err) => {
  console.error("Failed to create integration client:", err);
  process.exit(1);
});
