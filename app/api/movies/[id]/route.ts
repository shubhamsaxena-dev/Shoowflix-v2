import { getMovie } from "@/lib/yts";
import { CACHE, json, badRequest, notFound } from "@/lib/server/http";
import { movieIdSchema } from "@/lib/server/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = movieIdSchema.safeParse((await params).id);
  if (!parsed.success) return badRequest("Movie id must be a positive number.");

  const movie = await getMovie(parsed.data);
  if (!movie) return notFound("Movie");
  return json({ movie }, { cache: CACHE.public });
}
