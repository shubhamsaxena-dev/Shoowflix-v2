import { useState, useRef, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import MovieCardWithFavorites from "./movie-card-with-favorites";
import type { YTSMovie } from "@/types/movie";

interface AISuggestOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieClick: (movie: YTSMovie) => void;
}

export default function AISuggestOverlay({
  isOpen,
  onClose,
  onMovieClick,
}: AISuggestOverlayProps) {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<YTSMovie[]>([]);
  const [usedAI, setUsedAI] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const runSuggest = async () => {
    if (!inputValue.trim()) return;
    setSearchQuery(inputValue);
    setLoading(true);
    setMovies([]);
    setUsedAI(false);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputValue }),
      });
      const data = await res.json();
      setMovies(data?.movies || []);
      setUsedAI(data?.usedAI || false);
    } catch {
      setMovies([]);
      setUsedAI(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-screen py-4 sm:py-8">
          <div className="container mx-auto px-2 sm:px-4 max-w-6xl">
            {/* Header */}
            <div className="bg-card rounded-lg border mb-4 sm:mb-6 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> AI Movie Picks
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Describe what you want to watch (e.g., 'a movie with Tom Hanks' or 'sci-fi thriller from the 2000s')"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 h-10 sm:h-12"
                />
                <Button
                  onClick={runSuggest}
                  disabled={loading}
                  className="h-10 sm:h-12"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find Movies
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-card rounded-lg border p-4 sm:p-6">
              {movies.length === 0 && !loading && (!searchQuery || !usedAI) && (
                <div className="text-center py-16">
                  <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Discover movies with AI
                  </h3>
                  <p className="text-muted-foreground">
                    Describe actors, genres, moods, or themes and let AI find
                    the perfect movies for you.
                  </p>
                </div>
              )}
              {loading && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Finding picks for "{inputValue}"...</span>
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
              )}
              {!loading && movies.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">
                    AI picks for "{searchQuery}"
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 items-stretch">
                    {movies.map((movie: any) => (
                      <MovieCardWithFavorites
                        key={movie.id}
                        movie={movie}
                        onClick={onMovieClick}
                      />
                    ))}
                  </div>
                </div>
              )}
              {!loading && prompt && usedAI && movies.length === 0 && (
                <div className="text-center py-16">
                  <h3 className="text-xl font-semibold mb-2">
                    No movies found
                  </h3>
                  <p className="text-muted-foreground">
                    AI couldn't find any movies matching your description. Try
                    being more specific or use different keywords.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
