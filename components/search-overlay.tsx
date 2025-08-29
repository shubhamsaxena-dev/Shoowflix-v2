import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import MovieCard from "./movie-card";
import { useMovies } from "@/hooks/use-movies";
import type { YTSMovie } from "@shared/schema";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieClick: (movie: YTSMovie) => void;
  initialQuery?: string;
}

export default function SearchOverlay({ isOpen, onClose, onMovieClick, initialQuery }: SearchOverlayProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Set initial search term and focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setSearchTerm(initialQuery);
        setDebouncedTerm(initialQuery);
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen, initialQuery]);

  // Fetch search results
  const searchFilters = {
    query_term: debouncedTerm,
    limit: 20,
    sort_by: "rating" as const
  };

  const { data: searchData, isLoading: searchLoading } = useMovies(
    debouncedTerm ? searchFilters : null
  );

  const handleClose = () => {
    setSearchTerm("");
    setDebouncedTerm("");
    onClose();
  };

  const handleMovieClick = (movie: YTSMovie) => {
    onMovieClick(movie);
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="absolute inset-0 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-screen py-4 sm:py-8">
          <div className="container mx-auto px-2 sm:px-4 max-w-6xl">
            {/* Search Header */}
            <div className="bg-card rounded-lg border mb-4 sm:mb-6 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold">Search Movies</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="rounded-full flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for movies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 text-base sm:text-lg h-10 sm:h-12"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="bg-card rounded-lg border p-4 sm:p-6">
              {!debouncedTerm ? (
                <div className="text-center py-16">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Start searching</h3>
                  <p className="text-muted-foreground">
                    Type a movie title to find your favorite films
                  </p>
                </div>
              ) : searchLoading ? (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Searching for "{debouncedTerm}"...</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Skeleton className="h-48 sm:h-64 w-full rounded-lg" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchData?.data?.movies && searchData.data.movies.length > 0 ? (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">
                    Found {searchData.data.movies.length} results for "{debouncedTerm}"
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {searchData.data.movies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={handleMovieClick}
                      />
                    ))}
                  </div>
                </div>
              ) : debouncedTerm ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-semibold mb-2">No movies found</h3>
                  <p className="text-muted-foreground">
                    Try searching for a different movie title
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}