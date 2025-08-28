import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
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

  const genreTitle = (genre as string)?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';

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
      const data: MoviesResponse = await response.json();
      
      if (data.status === "ok" && data.data.movies) {
        if (reset) {
          setMovies(data.data.movies);
        } else {
          setMovies(prev => [...prev, ...data.data.movies]);
        }
        setHasMore(data.data.movies.length === ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch movies:", error);
      toast({
        title: "Error",
        description: "Failed to load movies. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [genreTitle, quality, sortBy, minRating, loading, toast]);

  // Reset and fetch when filters change
  useEffect(() => {
    if (genreTitle) {
      setMovies([]);
      setPage(1);
      setHasMore(true);
      fetchMovies(1, true);
    }
  }, [quality, sortBy, minRating, genreTitle]);

  // Load more movies
  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMovies(nextPage);
    }
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 &&
        hasMore && !loading
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page]);

  const handleMovieClick = (movie: YTSMovie) => {
    router.push(`/movie/${movie.id}`);
  };

  const goBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{genreTitle} Movies</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center mb-8 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={quality} onValueChange={setQuality}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent>
              {qualityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              {ratingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={handleMovieClick}
            />
          ))}
          
          {/* Loading skeletons */}
          {loading && Array.from({ length: 12 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="space-y-2">
              <Skeleton className="h-72 w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {!loading && hasMore && movies.length > 0 && (
          <div className="text-center mb-8">
            <Button onClick={loadMore} variant="outline">
              Load More Movies
            </Button>
          </div>
        )}

        {/* No more movies */}
        {!hasMore && movies.length > 0 && (
          <div className="text-center text-muted-foreground mb-8">
            <p>You've reached the end of {genreTitle} movies!</p>
          </div>
        )}

        {/* No movies found */}
        {!loading && movies.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No {genreTitle} movies found with the current filters.
            </p>
            <Button 
              onClick={() => {
                setQuality("all");
                setSortBy("date_added");
                setMinRating("0");
              }}
              variant="outline"
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}