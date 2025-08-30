import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import type { MovieFilters } from "@/lib/types";
import type { YTSListMoviesResponse, YTSMovieDetailsResponse, YTSMovie, Torrent } from "@/types/movie";

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  return response.json();
};

// Build query string from filters
function buildQueryString(filters: MovieFilters | null = {}, page: number = 1): string {
  const params = new URLSearchParams();
  
  // Add page parameter
  params.append('page', page.toString());
  
  // Handle null or undefined filters
  if (filters && typeof filters === 'object') {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 0) {
        params.append(key, value.toString());
      }
    });
  }
  
  return params.toString();
}

// Get key for infinite loading
const getKey = (filters: MovieFilters | null) => (pageIndex: number, previousPageData: YTSListMoviesResponse | null) => {
  // If filters is null, return null (no request)
  if (!filters) return null;
  
  // First page, no previous data
  if (pageIndex === 0) return `/api/movies?${buildQueryString(filters, 1)}`;
  
  // Previous page didn't have data or we reached the end
  if (!previousPageData || !previousPageData.data?.movies?.length) return null;
  
  // Return URL for next page
  return `/api/movies?${buildQueryString(filters, pageIndex + 1)}`;
};

// Base hook for movies with infinite scroll
export function useMoviesInfinite(filters: MovieFilters | null = {}) {
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate
  } = useSWRInfinite<YTSListMoviesResponse>(
    getKey(filters),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Flatten all movies from all pages
  const movies = data?.reduce<YTSMovie[]>((acc, page) => {
    if (page.data?.movies) {
      return [...acc, ...page.data.movies];
    }
    return acc;
  }, []) || [];

  // Check if we can load more
  const canLoadMore = data && data[data.length - 1]?.data?.movies?.length === parseInt(filters?.limit?.toString() || '20');
  
  const loadMore = () => {
    if (canLoadMore && !isValidating) {
      setSize(size + 1);
    }
  };

  return {
    movies,
    error,
    isLoading: !data && !error,
    isLoadingMore: isValidating && data && data.length > 0,
    canLoadMore,
    loadMore,
    mutate,
    size,
    isEmpty: data?.[0]?.data?.movies?.length === 0,
  };
}

// Regular hook for single page of movies (for sections)
export function useMovies(filters: MovieFilters | null = {}) {
  // If filters is null, don't make any request
  const shouldFetch = filters !== null;
  const queryString = shouldFetch ? buildQueryString(filters, 1) : '';
  const url = shouldFetch ? `/api/movies?${queryString}` : null;
  
  const { data, error, mutate } = useSWR<YTSListMoviesResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    data,
    error,
    isLoading: shouldFetch ? (!data && !error) : false,
    mutate,
    movies: data?.data?.movies || [],
  };
}

export function useMovieDetails(movieId: number) {
  const { data, error, mutate } = useSWR<YTSMovieDetailsResponse>(
    movieId ? `/api/movies/${movieId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
    movie: data?.data?.movie,
  };
}

export function useMovieSuggestions(movieId: number) {
  const { data, error, mutate } = useSWR<YTSListMoviesResponse>(
    movieId ? `/api/movies/${movieId}/suggestions` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
    movies: data?.data?.movies || [],
  };
}

// Predefined movie hooks
export function useTrendingMovies() {
  return useMovies({
    sort_by: 'download_count',
    order_by: 'desc',
    limit: 20
  });
}

export function useTrendingMoviesInfinite() {
  return useMoviesInfinite({
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

export function useActionMoviesInfinite() {
  return useMoviesInfinite({
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

export function useHighRatedMoviesInfinite() {
  return useMoviesInfinite({
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

export function useRecentMoviesInfinite() {
  return useMoviesInfinite({
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

export function useMoviesByGenreInfinite(genre: string) {
  return useMoviesInfinite({
    genre: genre,
    sort_by: 'rating',
    order_by: 'desc',
    limit: 20
  });
}

// Search hook with infinite scroll
export function useSearchMoviesInfinite(query: string, filters: MovieFilters = {}) {
  return useMoviesInfinite({
    query_term: query,
    ...filters,
    limit: 20
  });
}

// All genre hooks
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

// Magnet link generation (unchanged)
export async function generateMagnetLink(movie: YTSMovie, torrent: Torrent): Promise<string> {
  const response = await fetch('/api/magnet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      hash: torrent.hash, 
      title: movie.title 
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate magnet link');
  }
  
  const data = await response.json();
  return data.magnetLink;
}