import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { CACHE, badRequest, json, parseBody, serverError, unauthorized } from "@/lib/server/http";
import { movieIdSchema, watchProgressSchema } from "@/lib/server/schemas";
import { currentUserId } from "@/lib/server/session";
import type { WatchProgressDTO } from "@/lib/server/types";

const MAX_ITEMS = 24;

type Row = Awaited<ReturnType<typeof prisma.watchProgress.findFirstOrThrow>>;

function toDTO(row: Row): WatchProgressDTO {
  return {
    movieId: row.movieId,
    title: row.title,
    poster: row.poster ?? undefined,
    backdrop: row.backdrop ?? undefined,
    quality: row.quality ?? undefined,
    position: row.position,
    duration: row.duration,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  try {
    const rows = await prisma.watchProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: MAX_ITEMS,
    });
    return json({ items: rows.map(toDTO) }, { cache: CACHE.private });
  } catch (error) {
    console.error("[api/progress GET]", error);
    return serverError("Couldn't load your watch history.");
  }
}

export async function PUT(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const body = await parseBody(req, watchProgressSchema);
  if (!body.ok) return body.response;
  const { movieId, title, poster, backdrop, quality, position, duration } = body.data;
  const data = {
    title,
    poster: poster ?? null,
    backdrop: backdrop ?? null,
    quality: quality ?? null,
    position: duration > 0 ? Math.min(position, duration) : position,
    duration,
  };

  try {
    const row = await prisma.watchProgress.upsert({
      where: { userId_movieId: { userId, movieId } },
      update: data,
      create: { userId, movieId, ...data },
    });
    return json({ item: toDTO(row) }, { cache: CACHE.private });
  } catch (error) {
    console.error("[api/progress PUT]", error);
    return serverError("Couldn't save your progress.");
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = movieIdSchema.safeParse(req.nextUrl.searchParams.get("movieId"));
  if (!parsed.success) return badRequest("Pass ?movieId= with a positive number.");

  try {
    await prisma.watchProgress.deleteMany({ where: { userId, movieId: parsed.data } });
    return json({ ok: true }, { cache: CACHE.private });
  } catch (error) {
    console.error("[api/progress DELETE]", error);
    return serverError("Couldn't remove that title.");
  }
}
