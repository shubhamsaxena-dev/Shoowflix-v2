import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { YTSListMoviesResponseSchema, YTSMovieDetailsResponseSchema, type YTSMovie } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      const validatedData = YTSListMoviesResponseSchema.parse(data);
      
      res.json(validatedData);
    } catch (error) {
      console.error('Error fetching movies from YTS:', error);
      res.status(500).json({ 
        error: 'Failed to fetch movies',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
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
  });

  app.get("/api/movies/:id/suggestions", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        return res.status(400).json({ error: 'Invalid movie ID' });
      }

      const ytsUrl = `https://yts.mx/api/v2/movie_suggestions.json?movie_id=${movieId}`;
      
      const response = await fetch(ytsUrl);
      if (!response.ok) {
        throw new Error(`YTS API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      const validatedData = YTSListMoviesResponseSchema.parse(data);
      
      res.json(validatedData);
    } catch (error) {
      console.error('Error fetching movie suggestions from YTS:', error);
      res.status(500).json({ 
        error: 'Failed to fetch movie suggestions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate magnet link for torrent
  app.post("/api/magnet", async (req, res) => {
    try {
      const { hash, title } = req.body;
      
      if (!hash || !title) {
        return res.status(400).json({ error: 'Hash and title are required' });
      }

      const trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://glotorrents.pw:6969/announce',
        'udp://tracker.openbittorrent.com:80',
        'udp://tracker.coppersurfer.tk:6969',
        'udp://tracker.leechers-paradise.org:6969'
      ];
      
      const encodedTitle = encodeURIComponent(title);
      const trackerParams = trackers.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
      
      const magnetLink = `magnet:?xt=urn:btih:${hash}&dn=${encodedTitle}&${trackerParams}`;
      
      res.json({ magnetLink });
    } catch (error) {
      console.error('Error generating magnet link:', error);
      res.status(500).json({ 
        error: 'Failed to generate magnet link',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User favorites (if authentication is implemented later)
  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const { userId, movieId } = req.body;
      
      if (!userId || !movieId) {
        return res.status(400).json({ error: 'userId and movieId are required' });
      }

      const favorite = await storage.addUserFavorite({ userId, movieId });
      res.json(favorite);
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ error: 'Failed to add favorite' });
    }
  });

  app.delete("/api/favorites/:userId/:movieId", async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      const success = await storage.removeUserFavorite(userId, parseInt(movieId));
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Favorite not found' });
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ error: 'Failed to remove favorite' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
