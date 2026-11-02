import { prisma } from "@/lib/prisma";
import { CACHE, json, parseBody, serverError, unauthorized } from "@/lib/server/http";
import { watchlistBodySchema } from "@/lib/server/schemas";
import { currentUserId } from "@/lib/server/session";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  try {
    const row = await prisma.userFeaturedMovies.findUnique({ where: { userId } });
    return json({ ids: row?.movieIds ?? [] }, { cache: CACHE.private });
  } catch (error) {
    console.error("[api/watchlist GET]", error);
    return serverError("Couldn't load your list.");
  }
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const body = await parseBody(req, watchlistBodySchema);
  if (!body.ok) return body.response;
  const { movieId, action } = body.data;
  const id = String(movieId); // schema stores String[]

  try {
    const existing = await prisma.userFeaturedMovies.findUnique({ where: { userId } });
    const current = existing?.movieIds ?? [];
    const next =
      action === "add" ? [id, ...current.filter((x) => x !== id)] : current.filter((x) => x !== id);

    const row = await prisma.userFeaturedMovies.upsert({
      where: { userId },
      update: { movieIds: next },
      create: { userId, movieIds: next },
    });
    return json({ ids: row.movieIds }, { cache: CACHE.private });
  } catch (error) {
    console.error("[api/watchlist POST]", error);
    return serverError("Couldn't update your list.");
  }
}
