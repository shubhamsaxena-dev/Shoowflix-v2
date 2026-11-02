import { getSuggestions } from "@/lib/yts";
import { CACHE, json, badRequest, jsonError } from "@/lib/server/http";
import { movieIdSchema } from "@/lib/server/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = movieIdSchema.safeParse((await params).id);
  if (!parsed.success) return badRequest("Movie id must be a positive number.");

  try {
    const movies = await getSuggestions(parsed.data);
    return json({ movies: movies.filter((m) => m.id !== parsed.data).slice(0, 12) }, { cache: CACHE.public });
  } catch (error) {
    console.error("[api/movies/suggestions]", error);
    return jsonError(502, "Suggestions are unavailable right now.", undefined, "no-store");
  }
}
