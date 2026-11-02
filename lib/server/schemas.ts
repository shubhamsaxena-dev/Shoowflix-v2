import { z } from "zod";

const SORT_BY = ["title", "year", "rating", "peers", "seeds", "download_count", "like_count", "date_added"] as const;

/** Mirrors `MovieFilters` from types/movie.ts; query values arrive as strings. */
export const movieFiltersSchema = z.object({
  query_term: z.string().trim().max(120).optional(),
  genre: z
    .string()
    .trim()
    .toLowerCase()
    .max(32)
    .regex(/^[a-z-]+$/, "Unknown genre.")
    .optional(),
  quality: z.enum(["480p", "720p", "1080p", "1080p.x265", "2160p", "3D", "all"]).optional(),
  minimum_rating: z.coerce.number().int().min(0).max(9).optional(),
  sort_by: z.enum(SORT_BY).optional(),
  order_by: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
});

export const movieIdSchema = z.coerce.number().int().positive().max(10_000_000);

export const watchlistBodySchema = z.object({
  movieId: z.coerce.number().int().positive(),
  action: z.enum(["add", "remove"]),
});

const imageUrl = z.url().max(2048).optional();

export const watchProgressSchema = z.object({
  movieId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  poster: imageUrl,
  backdrop: imageUrl,
  quality: z.string().max(32).optional(),
  position: z.number().min(0).max(60 * 60 * 24),
  duration: z.number().min(0).max(60 * 60 * 24),
  updatedAt: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.email("Enter a valid email address.").max(254).transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

export const aiSuggestSchema = z.object({
  prompt: z.string().trim().min(2, "Describe what you feel like watching.").max(500),
});
