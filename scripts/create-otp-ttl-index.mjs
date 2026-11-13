// One-off: MongoDB TTL indexes for password reset and the daily AI-suggestion limit. Prisma can't declare TTL indexes.
// - password_reset_otps: a code row is deleted once it expires.
// - password_reset_requests: a request log row is deleted 24 h after it was made.
// - ai_suggest_usage: a daily "Ask the projectionist" row is deleted 48 h after it was made.
// Safe to re-run. Usage: npm run db:otp-index
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  await prisma.$runCommandRaw({
    createIndexes: "password_reset_otps",
    indexes: [{ key: { expires_at: 1 }, name: "password_reset_otps_ttl", expireAfterSeconds: 0 }],
  });
  await prisma.$runCommandRaw({
    createIndexes: "password_reset_requests",
    indexes: [{ key: { created_at: 1 }, name: "password_reset_requests_ttl", expireAfterSeconds: 24 * 60 * 60 }],
  });
  await prisma.$runCommandRaw({
    createIndexes: "ai_suggest_usage",
    indexes: [{ key: { created_at: 1 }, name: "ai_suggest_usage_ttl", expireAfterSeconds: 48 * 60 * 60 }],
  });
  console.log("TTL indexes for password reset and AI suggestions are in place.");
} finally {
  await prisma.$disconnect();
}
