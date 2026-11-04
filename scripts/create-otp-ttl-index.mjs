// One-off: MongoDB TTL indexes for password reset. Prisma can't declare TTL indexes.
// - password_reset_otps: a code row is deleted once it expires.
// - password_reset_requests: a request log row is deleted 24 h after it was made.
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
  console.log("TTL indexes for password reset are in place.");
} finally {
  await prisma.$disconnect();
}
