import "server-only";
import { listMovies } from "@/lib/yts";
import type { MovieFilters, YTSMovie } from "@/types/movie";

/** What we need from either the model or the heuristic parser. */
export interface SuggestPlan {
  titles: string[];
  genres: string[];
  minimum_rating: number;
  yearMin: number | null;
  yearMax: number | null;
  include_keywords: string[];
}

const GENRE_KEYWORDS: Record<string, string[]> = {
  action: ["action", "fight", "battle", "explosive", "thrill"],
  comedy: ["funny", "humor", "humour", "laugh", "feel-good", "comedy"],
  drama: ["drama", "emotional", "character", "relationship"],
  "sci-fi": ["sci-fi", "science", "space", "future", "robot", "alien"],
  thriller: ["thriller", "suspense", "twist", "mystery"],
  romance: ["romance", "love", "romantic", "date"],
  horror: ["horror", "scary", "fear", "ghost", "monster"],
  crime: ["crime", "mafia", "gangster", "heist", "detective"],
  fantasy: ["fantasy", "magic", "dragon", "myth"],
  animation: ["animation", "animated", "pixar", "cartoon"],
};

const TITLE_HINTS: Record<string, string[]> = {
  rdj: ["Iron Man", "Sherlock Holmes", "Avengers", "Tropic Thunder", "Zodiac"],
  "robert downey jr": ["Iron Man", "Sherlock Holmes", "Avengers", "Tropic Thunder", "Zodiac"],
  "tony stark": ["Iron Man", "Avengers"],
  sherlock: ["Sherlock Holmes"],
};

const STOP_WORDS = new Set([
  "with", "that", "like", "something", "movie", "movies", "film", "films", "want", "watch", "about",
  "some", "from", "into", "have", "show", "best", "good", "great", "really", "very", "tonight", "where",
  "which", "there", "their", "this", "these", "those", "recent", "rated", "highly", "award",
]);

/** Heuristic parser — works with no AI provider configured. */
export function heuristicPlan(prompt: string): SuggestPlan {
  const lower = prompt.toLowerCase();
  const genres = Object.entries(GENRE_KEYWORDS)
    .filter(([, kws]) => kws.some((kw) => lower.includes(kw)))
    .map(([g]) => g);

  let yearMin: number | null = null;
  let yearMax: number | null = null;
  const decade = lower.match(/\b(?:19|20)?(\d)0s\b/);
  if (decade) {
    const d = Number(decade[1]);
    const century = /\b20\d0s\b/.test(lower) || d <= 2 ? 2000 : 1900;
    yearMin = century + d * 10;
    yearMax = yearMin + 9;
  }
  if (/\b(recent|new|latest)\b/.test(lower)) yearMin = Math.max(yearMin ?? 0, 2018);

  const topRated = /(top|highly)[ -]rated|award|acclaimed|masterpiece|classic/.test(lower);
  const genreWords = new Set(Object.values(GENRE_KEYWORDS).flat());
  const include_keywords = (lower.match(/[a-z0-9]+/g) ?? []).filter(
    (kw) => kw.length > 3 && !genreWords.has(kw) && !STOP_WORDS.has(kw),
  );

  const titles = Array.from(
    new Set(Object.entries(TITLE_HINTS).flatMap(([key, hints]) => (lower.includes(key) ? hints : []))),
  );

  return { titles, genres, minimum_rating: topRated ? 8 : 0, yearMin, yearMax, include_keywords };
}

function sanitizePlan(raw: unknown): SuggestPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const strings = (v: unknown, max: number) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, max) : [];
  const year = (v: unknown) => (typeof v === "number" && v > 1880 && v < 2100 ? Math.round(v) : null);
  const rating = typeof r.minimum_rating === "number" ? Math.min(9, Math.max(0, Math.floor(r.minimum_rating))) : 0;
  return {
    titles: strings(r.titles, 10),
    genres: strings(r.genres, 3).map((g) => g.toLowerCase()),
    minimum_rating: rating,
    yearMin: year(r.yearMin),
    yearMax: year(r.yearMax),
    include_keywords: strings(r.include_keywords, 6),
  };
}

/** OpenAI chat completions via fetch (no SDK dependency). Returns null on any failure. */
export async function openAIPlan(prompt: string): Promise<SuggestPlan | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that suggests movies. Analyze the user's description and output ONLY a strict JSON object with keys: titles (array of up to 10 movie titles), genres (array of YTS genre names), minimum_rating (number 0-9), yearMin (number or null), yearMax (number or null), include_keywords (array of strings). No prose, no markdown, only JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[ai/suggest] OpenAI error", res.status);
      return null;
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    return sanitizePlan(JSON.parse(text));
  } catch (error) {
    console.error("[ai/suggest] OpenAI failed", error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function inYearRange(m: YTSMovie, plan: SuggestPlan) {
  if (plan.yearMin && m.year < plan.yearMin) return false;
  if (plan.yearMax && m.year > plan.yearMax) return false;
  return true;
}

/** Resolve a plan into real YTS movies (titles first, then filter-based discovery). */
export async function resolvePlan(plan: SuggestPlan, limit = 20): Promise<YTSMovie[]> {
  const seen = new Set<number>();
  const out: YTSMovie[] = [];
  const add = (movies: YTSMovie[], filterYears: boolean) => {
    for (const m of movies) {
      if (out.length >= limit) return;
      if (seen.has(m.id) || (filterYears && !inYearRange(m, plan))) continue;
      seen.add(m.id);
      out.push(m);
    }
  };

  // 1) Named titles — run in parallel, keep model ordering.
  const titleResults = await Promise.allSettled(
    plan.titles.slice(0, 10).map((title) =>
      listMovies({ query_term: title, sort_by: "rating", order_by: "desc", limit: 3 }),
    ),
  );
  for (const r of titleResults) if (r.status === "fulfilled") add((r.value.movies ?? []).slice(0, 2), false);

  // 2) Keyword search (e.g. an actor name) when nothing matched by title.
  if (out.length < 6 && plan.include_keywords.length) {
    const query = plan.include_keywords.slice(0, 3).join(" ");
    try {
      add((await listMovies({ query_term: query, sort_by: "rating", order_by: "desc", limit: 20 })).movies ?? [], true);
    } catch {
      /* ignore */
    }
  }

  // 3) Genre / rating discovery to fill the shelf.
  if (out.length < limit) {
    const genres = plan.genres.length ? plan.genres.slice(0, 2) : [undefined];
    const base: MovieFilters = {
      sort_by: plan.yearMin || plan.yearMax ? "year" : "rating",
      order_by: "desc",
      minimum_rating: plan.minimum_rating || 6,
      limit: 40,
    };
    const results = await Promise.allSettled(genres.map((genre) => listMovies({ ...base, genre })));
    for (const r of results) if (r.status === "fulfilled") add(r.value.movies ?? [], true);
  }

  return out;
}
