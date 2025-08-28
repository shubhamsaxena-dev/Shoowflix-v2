import { useState, useEffect } from "react";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { YTSMovie } from "@shared/schema";

interface HeroSectionProps {
  movies: YTSMovie[] | undefined;
  isLoading: boolean;
  onPlay: (movie: YTSMovie) => void;
  onMoreInfo: (movie: YTSMovie) => void;
}

export default function HeroSection({ movies, isLoading, onPlay, onMoreInfo }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const movie = movies?.[currentIndex];

  // Auto-advance slideshow - always running
  useEffect(() => {
    if (!movies || movies.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
      }
    }, 4000); // Change slide every 4 seconds
    
    return () => clearInterval(interval);
  }, [movies, isPaused]);

  // Resume auto-play after user interaction
  useEffect(() => {
    if (isPaused) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
      }, 8000); // Resume after 8 seconds of inactivity
      
      return () => clearTimeout(timeout);
    }
  }, [isPaused]);

  const nextSlide = () => {
    if (!movies) return;
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setIsPaused(true);
  };

  const prevSlide = () => {
    if (!movies) return;
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setIsPaused(true);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
  };
  if (isLoading) {
    return (
      <section className="relative h-screen overflow-hidden mt-16">
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="max-w-xl sm:max-w-2xl">
              <Skeleton className="h-12 sm:h-16 md:h-20 w-3/4 mb-4" />
              <Skeleton className="h-4 sm:h-6 w-1/2 mb-2" />
              <Skeleton className="h-16 sm:h-20 w-full mb-8" />
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Skeleton className="h-10 sm:h-12 w-full sm:w-32" />
                <Skeleton className="h-10 sm:h-12 w-full sm:w-32" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <section className="relative h-screen overflow-hidden mt-16">
        <div className="absolute inset-0 bg-muted">
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="max-w-xl sm:max-w-2xl">
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4">Welcome to Shoowflix</h1>
              <p className="text-base sm:text-lg mb-8 leading-relaxed text-muted-foreground">
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
          src={movie?.background_image_original || movie?.large_cover_image || movie?.medium_cover_image || '/placeholder-backdrop.jpg'}
          alt={`${movie?.title} backdrop`}
          className="w-full h-full object-cover transition-all duration-1000"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-backdrop.jpg';
          }}
        />
        <div className="absolute inset-0 hero-gradient"></div>
      </div>
      
      {/* Navigation arrows */}
      {movies && movies.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="lg"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
            onClick={prevSlide}
            data-testid="hero-prev-slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
            onClick={nextSlide}
            data-testid="hero-next-slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
      
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="max-w-xl sm:max-w-2xl">
            <h1 
              className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 transition-all duration-500"
              data-testid="hero-title"
            >
              {movie?.title}
            </h1>
            <p className="text-base sm:text-xl mb-2 text-muted-foreground">
              <span data-testid="hero-year">{movie?.year}</span> • 
              <span data-testid="hero-rating" className="ml-2">{movie?.rating} ⭐</span>
              {movie?.runtime && (
                <>
                  <span className="mx-2">•</span>
                  <span data-testid="hero-runtime">{movie.runtime} min</span>
                </>
              )}
            </p>
            
            {movie?.synopsis && (
              <p 
                className="text-sm sm:text-lg mb-8 leading-relaxed text-muted-foreground line-clamp-3 transition-all duration-500"
                data-testid="hero-synopsis"
              >
                {movie.synopsis}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-2 sm:py-3 font-semibold flex items-center justify-center space-x-2 w-full sm:w-auto"
                onClick={() => movie && onPlay(movie)}
                data-testid="hero-play-button"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Play Now</span>
              </Button>
              <Button 
                variant="secondary"
                size="lg"
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 sm:px-8 py-2 sm:py-3 font-semibold flex items-center justify-center space-x-2 w-full sm:w-auto"
                onClick={() => movie && onMoreInfo(movie)}
                data-testid="hero-info-button"
              >
                <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>More Info</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Slide indicators */}
      {movies && movies.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {movies.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-primary' : 'bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => goToSlide(index)}
              data-testid={`hero-indicator-${index}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
