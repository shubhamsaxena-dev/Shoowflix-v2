import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Filter } from "lucide-react";
import MovieCard from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { YTSMovie } from "@shared/schema";

interface MoviesResponse {
  status: string;
  data: {
    movies: YTSMovie[];
    movie_count: number;
  };
}

const ITEMS_PER_PAGE = 20;

const qualityOptions = [
  { value: "all", label: "All Quality" },
  { value: "2160p", label: "4K (2160p)" },
  { value: "1080p", label: "HD (1080p)" },
  { value: "720p", label: "HD (720p)" },
  { value: "480p", label: "SD (480p)" }
];

const sortOptions = [
  { value: "date_added", label: "Latest" },
  { value: "rating", label: "Rating" },
  { value: "year", label: "Year" },
  { value: "title", label: "Title" },
  { value: "download_count", label: "Downloads" }
];

const ratingOptions = [
  { value: "0", label: "All Ratings" },
  { value: "9", label: "9+ Stars" },
  { value: "8", label: "8+ Stars" },
  { value: "7", label: "7+ Stars" },
  { value: "6", label: "6+ Stars" }
];

export default function GenrePage() {
  const router = useRouter();
  const { genre } = router.query;
  const { toast } = useToast();
  
  const [movies, setMovies] = useState<YTSMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState<YTSMovie | null>(null);
  
  // Filters
  const [quality, setQuality] = useState("all");
  const [sortBy, setSortBy] = useState("date_added");
  const [minRating, setMinRating] = useState("0");

  const genreTitle = typeof genre === 'string' ? genre.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';

  const fetchMovies = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        genre: genreTitle,
        limit: ITEMS_PER_PAGE.toString(),
        page: pageNum.toString(),
        sort_by: sortBy,
        minimum_rating: minRating,
        ...(quality !== "all" && { quality })
      });

      const response = await fetch(`/api/movies?${params}`);
      if (!response.ok) throw new Error('Failed to fetch movies');
      
      const data: MoviesResponse = await response.json();
      
      if (data.data?.movies) {
        setMovies(prev => reset ? data.data.movies : [...prev, ...data.data.movies]);
        setHasMore(data.data.movies.length === ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast({
        title: "Error",
        description: "Failed to load movies. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [genreTitle, sortBy, quality, minRating, loading, toast]);

  useEffect(() => {
    if (genreTitle) {
      setMovies([]);
      setPage(1);
      setHasMore(true);
      fetchMovies(1, true);
    }
  }, [genreTitle, sortBy, quality, minRating]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage);
  };

  const handleMovieClick = (movie: YTSMovie) => {
    router.push(`/movie/${movie.id}`);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    
    switch (filterType) {
      case 'quality':
        setQuality(value);
        break;
      case 'sort':
        setSortBy(value);
        break;
      case 'rating':
        setMinRating(value);
        break;
    }
  };

  const clearFilters = () => {
    setQuality("all");
    setSortBy("date_added");
    setMinRating("0");
  };

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        if (hasMore && !loading) {
          handleLoadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:text-red-500">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{genreTitle} Movies</h1>
          </div>
          
          <Link href="/" className="text-red-500 font-bold text-xl tracking-wider">
            SHOOWFLIX
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={quality} onValueChange={(value) => handleFilterChange('quality', value)}>
            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {qualityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => handleFilterChange('sort', value)}>
            <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={minRating} onValueChange={(value) => handleFilterChange('rating', value)}>
            <SelectTrigger className="w-[130px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ratingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="border-gray-700 hover:bg-gray-800"
          >
            Clear
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Movies Grid */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {movies.map((movie, index) => (
              <MovieCard 
                key={`${movie.id}-${index}`}
                movie={movie}
                onClick={() => handleMovieClick(movie)}
                className="w-full"
              />
            ))}
          </div>
        ) : loading && movies.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full bg-gray-800" />
                <Skeleton className="h-4 w-full bg-gray-800" />
                <Skeleton className="h-3 w-2/3 bg-gray-800" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-xl text-gray-400 mb-4">No movies found</p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        )}

        {/* Loading More */}
        {loading && movies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 mt-8">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full bg-gray-800" />
                <Skeleton className="h-4 w-full bg-gray-800" />
                <Skeleton className="h-3 w-2/3 bg-gray-800" />
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && movies.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button onClick={handleLoadMore} size="lg" className="bg-red-600 hover:bg-red-700">
              Load More Movies
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}