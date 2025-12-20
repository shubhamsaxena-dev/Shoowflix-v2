import type { NextApiRequest, NextApiResponse } from "next";

// Basic keyword → genre mapping for fallback
const GENRE_KEYWORDS: Record<string, string[]> = {
  action: ["action", "fight", "battle", "explosive", "thrill"],
  comedy: ["funny", "humor", "laugh", "feel-good", "comedy"],
  drama: ["drama", "emotional", "character", "relationship"],
  "sci-fi": ["sci-fi", "science", "space", "future", "robot", "alien"],
  thriller: ["thriller", "suspense", "twist", "mystery"],
  romance: ["romance", "love", "romantic", "date"],
  horror: ["horror", "scary", "fear", "ghost", "monster"],
  crime: ["crime", "mafia", "gangster", "heist", "detective"],
  fantasy: ["fantasy", "magic", "dragon", "myth"],
  animation: ["animation", "animated", "pixar", "cartoon"],
};

// Heuristic title hints for common descriptors (works without AI)
const TITLE_HINTS: Record<string, string[]> = {
  rdj: ["Iron Man", "Sherlock Holmes", "Avengers", "Tropic Thunder", "Zodiac"],
  "robert downey jr": [
    "Iron Man",
    "Sherlock Holmes",
    "Avengers",
    "Tropic Thunder",
    "Zodiac",
  ],
  "tony stark": ["Iron Man", "Avengers"],
  sherlock: ["Sherlock Holmes"],
};

function extractFallbackFilters(prompt: string) {
  const lower = prompt.toLowerCase();
  const genres: string[] = [];
  for (const [genre, kws] of Object.entries(GENRE_KEYWORDS)) {
    if (kws.some((kw) => lower.includes(kw))) genres.push(genre);
  }
  // Decade/year hints
  let yearMin: number | undefined;
  let yearMax: number | undefined;
  const decadeMatch = lower.match(/(\d{2})s\b/); // e.g., 90s
  if (decadeMatch) {
    const decade = parseInt(decadeMatch[1], 10);
    yearMin = 1900 + decade * 10;
    yearMax = yearMin + 9;
  }
  if (lower.includes("recent") || lower.includes("new")) {
    yearMin = Math.max(yearMin || 0, 2018);
  }
  const topRated =
    lower.includes("top rated") ||
    lower.includes("highly rated") ||
    lower.includes("award");
  const minimum_rating = topRated ? 8 : 0;

  // Keywords for query_term
  const include_keywords: string[] = [];
  const keywordCandidates = lower.match(/[a-z0-9]+/g) || [];
  keywordCandidates.forEach((kw) => {
    if (kw.length > 3 && !Object.values(GENRE_KEYWORDS).flat().includes(kw)) {
      include_keywords.push(kw);
    }
  });

  return { genres, yearMin, yearMax, minimum_rating, include_keywords };
}

function deriveTitleHints(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const titles: string[] = [];
  for (const [key, hints] of Object.entries(TITLE_HINTS)) {
    if (lower.includes(key)) {
      hints.forEach((t) => titles.push(t));
    }
  }
  return Array.from(new Set(titles));
}

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[AI] No API key found");
    return null;
  }
  try {
    console.log("[AI] Calling OpenAI with prompt:", prompt);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that suggests movies. Analyze the user's description and output ONLY a strict JSON object with keys: titles (array of up to 10 movie titles), genres (array of YTS genre names), minimum_rating (number 0-10), yearMin (number or null), yearMax (number or null), include_keywords (array of strings). No prose, no markdown, only JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) {
      console.error(
        "[AI] OpenAI response error:",
        response.status,
        response.statusText
      );
      return null;
    }
    const json = await response.json();
    console.log("[AI] Full OpenAI Response:", JSON.stringify(json, null, 2));
    const text = json?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error(
      "[AI] Error calling OpenAI:",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}

async function fetchYtsMovies(
  params: Record<string, string | number | undefined>
) {
  const base = process.env.NEXT_PUBLIC_API_ROOT || "https://yts.lt/api/v2";
  const url = new URL(`${base}/list_movies.json`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YTS error ${res.status}`);
  return res.json();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // Try OpenAI only
  const ai = await callOpenAI(prompt);

  if (!ai) {
    return res.status(200).json({
      movies: [],
      usedAI: false,
      reason: "AI service unavailable or returned no results",
      aiResult: null,
    });
  }

  const filters = ai;
  const results: any[] = [];
  const seen = new Set<number>();
  const limit = 20;

  // Search by AI-proposed titles only
  const titles: string[] = Array.isArray(ai?.titles) ? ai.titles : [];

  for (const title of titles) {
    try {
      const data = await fetchYtsMovies({
        query_term: title,
        sort_by: "rating",
        order_by: "desc",
        limit: 5,
      });
      const movies = data?.data?.movies || [];
      for (const m of movies) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          results.push(m);
        }
      }
    } catch (e) {
      // ignore individual failures
    }
    if (results.length >= limit) break;
  }

  return res.status(200).json({
    movies: results.slice(0, limit),
    usedAI: true,
    aiResult: ai,
  });
}
