import { useState, useEffect, useRef } from "react";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import type { YTSMovie } from "@shared/schema";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface HeroSectionProps {
  movies: YTSMovie[] | undefined;
  isLoading: boolean;
  onPlay: (movie: YTSMovie) => void;
  onMoreInfo: (movie: YTSMovie) => void;
}

export default function HeroSection({ movies, isLoading, onPlay, onMoreInfo }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const swiperRef = useRef<SwiperType>();

  const movie = movies?.[currentIndex];

  const handleSlideChange = (swiper: SwiperType) => {
    setCurrentIndex(swiper.activeIndex);
  };

  const nextSlide = () => {
    swiperRef.current?.slideNext();
  };

  const prevSlide = () => {
    swiperRef.current?.slidePrev();
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
      {movies && movies.length > 0 ? (
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={handleSlideChange}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          effect="fade"
          fadeEffect={{
            crossFade: true
          }}
          navigation={{
            prevEl: '.hero-prev-btn',
            nextEl: '.hero-next-btn',
          }}
          pagination={{
            el: '.hero-pagination',
            clickable: true,
            bulletClass: 'hero-bullet',
            bulletActiveClass: 'hero-bullet-active'
          }}
          className="h-full w-full"
        >
          {movies.map((movieItem) => (
            <SwiperSlide key={movieItem.id}>
              <div className="absolute inset-0">
                <img 
                  src={movieItem?.background_image_original || movieItem?.large_cover_image || movieItem?.medium_cover_image || '/placeholder-backdrop.jpg'}
                  alt={`${movieItem?.title} backdrop`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-backdrop.jpg';
                  }}
                />
                <div className="absolute inset-0 hero-gradient"></div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="absolute inset-0 bg-muted">
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
      )}
      
      {/* Custom Navigation arrows */}
      {movies && movies.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="lg"
            className="hero-prev-btn absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
            onClick={prevSlide}
            data-testid="hero-prev-slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="hero-next-btn absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
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
              className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4"
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
                className="text-sm sm:text-lg mb-8 leading-relaxed text-muted-foreground line-clamp-3"
                data-testid="hero-synopsis"
              >
                {movie.synopsis}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-2 sm:py-3 font-semibold flex items-center justify-center space-x-2 w-full sm:w-auto transform hover:scale-105 transition-transform"
                onClick={() => movie && onPlay(movie)}
                data-testid="hero-play-button"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Play Now</span>
              </Button>
              <Button 
                variant="secondary"
                size="lg"
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 sm:px-8 py-2 sm:py-3 font-semibold flex items-center justify-center space-x-2 w-full sm:w-auto transform hover:scale-105 transition-transform"
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
      
      {/* Custom Pagination */}
      {movies && movies.length > 1 && (
        <div className="hero-pagination absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2"></div>
      )}
    </section>
  );
}
