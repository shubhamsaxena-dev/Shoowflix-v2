import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * In dev the client is kept on globalThis so hot reloads don't open new connections. After
 * `prisma generate` adds a model, that cached client wouldn't have it ("cannot read findMany
 * of undefined"), so reuse it only if it has every model the freshly generated client knows.
 */
function hasEveryModel(client: PrismaClient): boolean {
  return Object.values(Prisma.ModelName).every(
    (name) => (name.charAt(0).toLowerCase() + name.slice(1)) in client,
  );
}

const cached = globalForPrisma.prisma;
export const prisma = cached && hasEveryModel(cached) ? cached : new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
