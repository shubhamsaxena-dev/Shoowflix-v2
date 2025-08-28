import { useQuery } from "@tanstack/react-query";
import type { MovieFilters } from "@/lib/types";
import type { YTSListMoviesResponse, YTSMovieDetailsResponse, YTSMovie } from "@shared/schema";

export function useMovies(filters: MovieFilters = {}) {
  return useQuery<YTSListMoviesResponse>({
    queryKey: ['/api/movies', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 0) {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/movies?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch movies: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMovieDetails(movieId: number) {
  return useQuery<YTSMovieDetailsResponse>({
    queryKey: ['/api/movies', movieId],
    queryFn: async () => {
      const response = await fetch(`/api/movies/${movieId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch movie details: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!movieId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useMovieSuggestions(movieId: number) {
  return useQuery<YTSListMoviesResponse>({
    queryKey: ['/api/movies', movieId, 'suggestions'],
    queryFn: async () => {
      const response = await fetch(`/api/movies/${movieId}/suggestions`);
      if (!response.ok) {
        throw new Error(`Failed to fetch movie suggestions: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!movieId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTrendingMovies() {
  return useMovies({
    sort_by: 'download_count',
    order_by: 'desc',
    limit: 20
  });
}

export function useActionMovies() {
  return useMovies({
    genre: 'action',
    sort_by: 'rating',
    order_by: 'desc',
    limit: 20
  });
}

export function useHighRatedMovies() {
  return useMovies({
    minimum_rating: 8,
    sort_by: 'rating',
    order_by: 'desc',
    limit: 20
  });
}

export function useRecentMovies() {
  return useMovies({
    sort_by: 'date_added',
    order_by: 'desc',
    limit: 20
  });
}

// Genre-specific hooks
export function useMoviesByGenre(genre: string) {
  return useMovies({
    genre: genre,
    sort_by: 'rating',
    order_by: 'desc',
    limit: 20
  });
}

export function useSciFiMovies() {
  return useMoviesByGenre('Sci-Fi');
}

export function useComedyMovies() {
  return useMoviesByGenre('Comedy');
}

export function useAdventureMovies() {
  return useMoviesByGenre('Adventure');
}

export function useCrimeMovies() {
  return useMoviesByGenre('Crime');
}

export function useFantasyMovies() {
  return useMoviesByGenre('Fantasy');
}

export function useMysteryMovies() {
  return useMoviesByGenre('Mystery');
}

export function useDramaMovies() {
  return useMoviesByGenre('Drama');
}

export function useHorrorMovies() {
  return useMoviesByGenre('Horror');
}

export function useRomanceMovies() {
  return useMoviesByGenre('Romance');
}

export function useWarMovies() {
  return useMoviesByGenre('War');
}

export function useThrillerMovies() {
  return useMoviesByGenre('Thriller');
}

export function useAnimationMovies() {
  return useMoviesByGenre('Animation');
}

export async function generateMagnetLink(hash: string, title: string): Promise<string> {
  const response = await fetch('/api/magnet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hash, title }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate magnet link');
  }
  
  const data = await response.json();
  return data.magnetLink;
}
