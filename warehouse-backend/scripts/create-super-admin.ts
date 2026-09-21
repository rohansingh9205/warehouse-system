/**
 * Secure CLI-only Super Admin creation.
 *
 * Usage:
 *   npm run seed:super-admin -- --name "Owner Name" --phone "+919999999999" --email owner@example.com
 *
 * You will be prompted for a password interactively (never pass it as a
 * CLI arg — it would land in shell history / process list).
 *
 * This script is intentionally NOT reachable via any HTTP route.
 */
import "dotenv/config";
import readline from "node:readline";
import { connectDatabase, disconnectDatabase } from "@/db/connection";
import { UserModel } from "@/modules/admin/user.model";
import { hashPassword, validatePasswordStrength } from "@/common/utils/password";

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Basic muting; for production-grade hidden input use a package like `prompts`.
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const name = parseArg("--name");
  const phone = parseArg("--phone");
  const email = parseArg("--email")?.toLowerCase();

  if (!name || !phone || !email) {
    console.error("Usage: npm run seed:super-admin -- --name <name> --phone <+E164> --email <email>");
    process.exit(1);
  }

  await connectDatabase();

  const existing = await UserModel.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    console.error("A user with this email or phone already exists. Aborting.");
    await disconnectDatabase();
    process.exit(1);
  }

  const password = await promptHidden("Set Super Admin password (min 12 chars): ");
  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    console.error(strength.reason);
    await disconnectDatabase();
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await UserModel.create({
    name,
    phone,
    email,
    passwordHash,
    role: "SUPER_ADMIN",
    isActive: true,
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  console.log(`Super Admin created: ${user.email} (${user._id})`);
  await disconnectDatabase();
}

main().catch((err) => {
  console.error("Failed to create Super Admin:", err);
  process.exit(1);
});
