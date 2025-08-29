import { Card } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import type { YTSMovie } from "@shared/schema";

// Helper function to create URL-friendly slug from movie title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface MovieCardProps {
  movie: YTSMovie;
  onClick: (movie: YTSMovie) => void;
  className?: string;
  isLoading?: boolean;
}

export default function MovieCard({ movie, onClick, className = "", isLoading = false }: MovieCardProps) {
  const router = useRouter();
  
  const handleClick = () => {
    // Call the onClick prop instead of navigating directly
    onClick(movie);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div 
      className={`movie-card flex-shrink-0 w-36 sm:w-48 cursor-pointer ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${movie.title}`}
      data-testid={`movie-card-${movie.id}`}
    >
      <Card className="bg-card rounded-lg overflow-hidden border-0">
        <div className="relative" style={{ aspectRatio: '2/3' }}>
          <img 
            src={movie.medium_cover_image || '/placeholder-movie.jpg'}
            alt={`${movie.title} poster`}
            className="w-full h-full object-cover"
            width={300}
            height={450}
            loading="lazy"
            decoding="async"
            style={{ aspectRatio: '2/3' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-movie.jpg';
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
          <h3 className="font-semibold text-sm mb-1 line-clamp-2" data-testid={`movie-title-${movie.id}`}>
            {movie.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid={`movie-year-${movie.id}`}>{movie.year}</span>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span data-testid={`movie-rating-${movie.id}`}>{movie.rating}</span>
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
