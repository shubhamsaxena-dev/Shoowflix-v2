import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Loader2, Heart } from "lucide-react";
import { useRouter } from "next/router";
import { useFavorites } from "@/hooks/use-favorites";
import type { YTSMovie } from "@/types/movie";

interface MovieCardWithFavoritesProps {
  movie: YTSMovie;
  onClick: (movie: YTSMovie) => void;
  className?: string;
  isLoading?: boolean;
}

export default function MovieCardWithFavorites({
  movie,
  onClick,
  className = "",
  isLoading = false,
}: MovieCardWithFavoritesProps) {
  const { data: session } = useSession();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    onClick(movie);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session) {
      // Redirect to sign in if not authenticated
      router.push("/api/auth/signin");
      return;
    }

    setFavoriteLoading(true);

    try {
      if (isFavorite(movie.id)) {
        await removeFromFavorites(movie.id);
      } else {
        await addToFavorites(movie.id);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`movie-card w-full cursor-pointer ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${movie.title}`}
      data-testid={`movie-card-${movie.id}`}
    >
      <Card className="bg-card rounded-lg overflow-hidden border-0 relative group">
        <div className="relative" style={{ aspectRatio: "2/3" }}>
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleFavoriteClick}
            disabled={favoriteLoading}
            data-testid={`button-favorite-${movie.id}`}
          >
            {favoriteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={`h-4 w-4 ${
                  session && isFavorite(movie.id)
                    ? "fill-red-500 text-red-500"
                    : "text-white"
                }`}
              />
            )}
          </Button>

          <Image
            src={movie.medium_cover_image || "/placeholder-movie.jpg"}
            alt={`${movie.title} poster`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 144px, 192px"
            loading="lazy"
            quality={75}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-movie.jpg";
            }}
            data-testid={`movie-poster-${movie.id}`}
          />

          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />
                  Loading...
                </>
              ) : (
                "View Details"
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3
            className="font-semibold text-sm mb-1 line-clamp-2"
            data-testid={`movie-title-${movie.id}`}
          >
            {movie.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid={`movie-year-${movie.id}`}>{movie.year}</span>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span data-testid={`movie-rating-${movie.id}`}>
                {movie.rating}
              </span>
            </div>
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {movie.genres.slice(0, 2).map((genre, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                  data-testid={`movie-genre-${movie.id}-${index}`}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
