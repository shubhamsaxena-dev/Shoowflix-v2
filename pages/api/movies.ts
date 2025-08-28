import type { Express } from "express";
import { z } from "zod";
import { YTSListMoviesResponseSchema, YTSMovieDetailsResponseSchema, type YTSMovie } from "@shared/schema";

export function registerMoviesRoutes(app: Express) {
  // YTS API proxy routes
  app.get("/api/movies", async (req, res) => {
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
      
      // Validate the response using the schema
      const validatedData = YTSListMoviesResponseSchema.parse(data);
      
      res.json(validatedData);
    } catch (error) {
      console.error('Error fetching movies:', error);
      res.status(500).json({ 
        error: 'Failed to fetch movies from YTS API',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get movie details by ID
  app.get("/api/movies/:id", async (req, res) => {
    try {
      const movieId = req.params.id;
      
      if (!movieId || isNaN(Number(movieId))) {
        return res.status(400).json({ error: 'Valid movie ID is required' });
      }

      const ytsUrl = `https://yts.mx/api/v2/movie_details.json?movie_id=${movieId}&with_images=true&with_cast=true`;
      
      const response = await fetch(ytsUrl);
      if (!response.ok) {
        throw new Error(`YTS API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate the response using the schema
      const validatedData = YTSMovieDetailsResponseSchema.parse(data);
      
      if (!validatedData.data.movie) {
        return res.status(404).json({ error: 'Movie not found' });
      }

      res.json(validatedData);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      res.status(500).json({ 
        error: 'Failed to fetch movie details from YTS API',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get movie suggestions
  app.get("/api/movies/:id/suggestions", async (req, res) => {
    try {
      const movieId = req.params.id;
      
      if (!movieId || isNaN(Number(movieId))) {
        return res.status(400).json({ error: 'Valid movie ID is required' });
      }

      const ytsUrl = `https://yts.mx/api/v2/movie_suggestions.json?movie_id=${movieId}`;
      
      const response = await fetch(ytsUrl);
      if (!response.ok) {
        throw new Error(`YTS API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Note: Using the list movies schema since suggestions have the same structure
      const validatedData = YTSListMoviesResponseSchema.parse(data);
      
      res.json(validatedData);
    } catch (error) {
      console.error('Error fetching movie suggestions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch movie suggestions from YTS API',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}