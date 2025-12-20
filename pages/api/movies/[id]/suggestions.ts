import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const YTS_API_BASE = process.env.NEXT_PUBLIC_API_ROOT;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Valid movie ID is required" });
    }

    const ytsUrl = `${YTS_API_BASE}/movie_suggestions.json?movie_id=${id}`;

    const response = await fetch(ytsUrl);

    if (!response.ok) {
      throw new Error(`YTS API error: ${response.status}`);
    }

    const data = await response.json();

    // If YTS doesn't return suggestions, create fallback with similar movies
    if (!data?.data?.movies || data.data.movies.length === 0) {
      // Fallback: Get similar movies by fetching popular movies
      const fallbackUrl = `${YTS_API_BASE}/list_movies.json?sort_by=rating&limit=8&minimum_rating=7`;
      const fallbackResponse = await fetch(fallbackUrl);

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return res.status(200).json(fallbackData);
      }
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Failed to fetch movie suggestions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
