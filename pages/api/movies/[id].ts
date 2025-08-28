import type { NextApiRequest, NextApiResponse } from 'next';
import { YTSMovieDetailsResponseSchema } from "@shared/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const movieId = parseInt(id as string);
    
    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    const ytsUrl = `https://yts.mx/api/v2/movie_details.json?movie_id=${movieId}&with_images=true&with_cast=true`;
    
    const response = await fetch(ytsUrl);
    if (!response.ok) {
      throw new Error(`YTS API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    const validatedData = YTSMovieDetailsResponseSchema.parse(data);
    
    res.json(validatedData);
  } catch (error) {
    console.error('Error fetching movie details from YTS:', error);
    res.status(500).json({ 
      error: 'Failed to fetch movie details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}