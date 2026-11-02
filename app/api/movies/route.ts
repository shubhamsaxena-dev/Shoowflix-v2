import type { NextRequest } from "next/server";
import { listMovies } from "@/lib/yts";
import { CACHE, json, parseSearchParams, jsonError } from "@/lib/server/http";
import { movieFiltersSchema } from "@/lib/server/schemas";

export async function GET(req: NextRequest) {
  const parsed = parseSearchParams(req.nextUrl.searchParams, movieFiltersSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const data = await listMovies(parsed.data);
    return json(data, { cache: CACHE.public });
  } catch (error) {
    console.error("[api/movies]", error);
    return jsonError(502, "The catalog is not responding. Try again shortly.", undefined, "no-store");
  }
}
