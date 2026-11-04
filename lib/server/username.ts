import "server-only";
import { randomBytes } from "node:crypto";

/**
 * A unique-enough handle for a new user, e.g. "jane.doe-4f9a2c".
 *
 * `users.userName` has a unique index in MongoDB, and Mongo indexes a missing field as null,
 * so only one user may ever lack a userName. Every create must therefore set one.
 * The 6-hex suffix (16.7M values) makes a collision practically impossible.
 */
export function generateUserName(email?: string | null): string {
  const base =
    (email?.split("@")[0] ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 20) || "user";
  return `${base}-${randomBytes(3).toString("hex")}`;
}
