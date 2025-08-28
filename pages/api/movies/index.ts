import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from "zod";
import { YTSListMoviesResponseSchema } from "@shared/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      query_term = '', 
      genre = '', 
      quality = '', 
      minimum_rating = '0',
      limit = '20',
      page = '1',
      sort_by = 'date_added',
      order_by = 'desc'
    } = req.query;

    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      quality: quality.toString(),
      minimum_rating: minimum_rating.toString(),
      query_term: query_term.toString(),
      genre: genre.toString(),
      sort_by: sort_by.toString(),
      order_by: order_by.toString()
    });

    // Remove empty parameters
    Object.entries(Object.fromEntries(params)).forEach(([key, value]) => {
      if (!value || value === '0' || value === '') {
        params.delete(key);
      }
    });

    const ytsUrl = `https://yts.mx/api/v2/list_movies.json?${params.toString()}`;
    
    const response = await fetch(ytsUrl);
    if (!response.ok) {
      throw new Error(`YTS API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    const validatedData = YTSListMoviesResponseSchema.parse(data);
    
    res.json(validatedData);
  } catch (error) {
    console.error('Error fetching movies from YTS:', error);
    res.status(500).json({ 
      error: 'Failed to fetch movies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}