import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const movies = pgTable("movies", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  rating: integer("rating").notNull(), // Rating * 10 to store as integer
  runtime: integer("runtime"),
  genres: jsonb("genres").$type<string[]>().default([]),
  synopsis: text("synopsis"),
  description_full: text("description_full"),
  language: text("language"),
  medium_cover_image: text("medium_cover_image"),
  large_cover_image: text("large_cover_image"),
  background_image: text("background_image"),
  background_image_original: text("background_image_original"),
  torrents: jsonb("torrents").$type<Torrent[]>().default([]),
  cast: jsonb("cast").$type<CastMember[]>().default([]),
  created_at: timestamp("created_at").default(sql`now()`),
});

export const userFavorites = pgTable("user_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  movieId: integer("movie_id").notNull(),
  created_at: timestamp("created_at").default(sql`now()`),
});

export const TorrentSchema = z.object({
  url: z.string(),
  hash: z.string(),
  quality: z.string(),
  type: z.string(),
  seeds: z.number(),
  peers: z.number(),
  size: z.string(),
  size_bytes: z.number(),
  date_uploaded: z.string(),
  date_uploaded_unix: z.number(),
});

export const CastMemberSchema = z.object({
  name: z.string(),
  character_name: z.string(),
  url_small_image: z.string().optional(),
  imdb_code: z.string().optional(),
});

export const insertMovieSchema = createInsertSchema(movies).omit({
  id: true,
  created_at: true,
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).omit({
  id: true,
  created_at: true,
});

export type Movie = typeof movies.$inferSelect;
export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Torrent = z.infer<typeof TorrentSchema>;
export type CastMember = z.infer<typeof CastMemberSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;

// YTS API response types
export const YTSMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.number(),
  rating: z.number(),
  runtime: z.number().optional(),
  genres: z.array(z.string()).optional().default([]),
  synopsis: z.string().optional(),
  description_full: z.string().optional(),
  language: z.string().optional(),
  imdb_code: z.string().optional(),
  medium_cover_image: z.string().optional(),
  large_cover_image: z.string().optional(),
  background_image: z.string().optional(),
  background_image_original: z.string().optional(),
  torrents: z.array(TorrentSchema).optional().default([]),
  cast: z.array(CastMemberSchema).optional().default([]),
});

export const YTSListMoviesResponseSchema = z.object({
  status: z.string(),
  status_message: z.string(),
  data: z.object({
    movie_count: z.number(),
    limit: z.number(),
    page_number: z.number(),
    movies: z.array(YTSMovieSchema).optional(),
  }),
});

export const YTSMovieDetailsResponseSchema = z.object({
  status: z.string(),
  status_message: z.string(),
  data: z.object({
    movie: YTSMovieSchema,
  }),
});

export type YTSMovie = z.infer<typeof YTSMovieSchema>;
export type YTSListMoviesResponse = z.infer<typeof YTSListMoviesResponseSchema>;
export type YTSMovieDetailsResponse = z.infer<typeof YTSMovieDetailsResponseSchema>;
