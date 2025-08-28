import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { YTSMovie } from "@shared/schema";

interface HeroSectionProps {
  movie: YTSMovie | undefined;
  isLoading: boolean;
  onPlay: (movie: YTSMovie) => void;
  onMoreInfo: (movie: YTSMovie) => void;
}

export default function HeroSection({ movie, isLoading, onPlay, onMoreInfo }: HeroSectionProps) {
  if (isLoading) {
    return (
      <section className="relative h-screen overflow-hidden mt-16">
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <Skeleton className="h-16 md:h-20 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-20 w-full mb-8" />
              <div className="flex space-x-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!movie) {
    return (
      <section className="relative h-screen overflow-hidden mt-16">
        <div className="absolute inset-0 bg-muted">
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold mb-4">Welcome to YTS Movies</h1>
              <p className="text-lg mb-8 leading-relaxed text-muted-foreground">
                Discover and stream your favorite movies in high quality.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-screen overflow-hidden mt-16" data-testid="hero-section">
      <div className="absolute inset-0">
        <img 
          src={movie.background_image_original || movie.large_cover_image || movie.medium_cover_image || '/placeholder-backdrop.jpg'}
          alt={`${movie.title} backdrop`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-backdrop.jpg';
          }}
        />
        <div className="absolute inset-0 hero-gradient"></div>
      </div>
      
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 
              className="text-5xl md:text-7xl font-bold mb-4"
              data-testid="hero-title"
            >
              {movie.title}
            </h1>
            <p className="text-xl mb-2 text-muted-foreground">
              <span data-testid="hero-year">{movie.year}</span> • 
              <span data-testid="hero-rating" className="ml-2">{movie.rating} ⭐</span>
              {movie.runtime && (
                <>
                  <span className="mx-2">•</span>
                  <span data-testid="hero-runtime">{movie.runtime} min</span>
                </>
              )}
            </p>
            
            {movie.synopsis && (
              <p 
                className="text-lg mb-8 leading-relaxed text-muted-foreground line-clamp-3"
                data-testid="hero-synopsis"
              >
                {movie.synopsis}
              </p>
            )}
            
            <div className="flex space-x-4">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 font-semibold flex items-center space-x-2"
                onClick={() => onPlay(movie)}
                data-testid="hero-play-button"
              >
                <Play className="h-5 w-5" />
                <span>Play Now</span>
              </Button>
              <Button 
                variant="secondary"
                size="lg"
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-8 py-3 font-semibold flex items-center space-x-2"
                onClick={() => onMoreInfo(movie)}
                data-testid="hero-info-button"
              >
                <Info className="h-5 w-5" />
                <span>More Info</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
