import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const YTS_API_BASE = process.env.NEXT_PUBLIC_API_ROOT;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
  res.setHeader("Surrogate-Control", "max-age=300");

  try {
    const { id } = req.query;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Valid movie ID is required" });
    }

    const ytsUrl = `${YTS_API_BASE}/movie_details.json?movie_id=${id}&with_images=true&with_cast=true`;

    const response = await fetch(ytsUrl);

    if (!response.ok) {
      throw new Error(`YTS API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data?.movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Failed to fetch movie details",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
