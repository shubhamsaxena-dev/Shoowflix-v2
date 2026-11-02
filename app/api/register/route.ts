import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CACHE, json, jsonError, parseBody, serverError } from "@/lib/server/http";
import { limitRequest } from "@/lib/server/rate-limit";
import { registerSchema } from "@/lib/server/schemas";

const DUPLICATE = "An account with this email already exists. Sign in instead.";

export async function POST(req: Request) {
  const limited = limitRequest(req, "register", { limit: 8, windowMs: 10 * 60_000 });
  if (limited) return limited;

  const body = await parseBody(req, registerSchema);
  if (!body.ok) return body.response;
  const { name, email, password } = body.data; // email already lower-cased

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return jsonError(409, DUPLICATE);

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, password: hashed } });
    return json({ ok: true }, { status: 201, cache: CACHE.private });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(409, DUPLICATE);
    }
    console.error("[api/register]", error);
    return serverError("Couldn't create your account. Try again in a moment.");
  }
}
