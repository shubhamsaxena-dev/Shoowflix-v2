import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Play, Info, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import type { YTSMovie } from "@/types/movie";
import { useRouter } from "next/router";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

interface HeroSectionProps {
  movies: YTSMovie[];
  onPlayMovie?: (movie: YTSMovie, torrent: any) => void;
  isLoadingPlay?: boolean;
  isAuthenticated?: boolean;
}

export default function HeroSection({
  movies,
  onPlayMovie,
  isLoadingPlay,
  isAuthenticated,
}: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<{ [key: number]: boolean }>(
    {}
  );
  const swiperRef = useRef<SwiperType>();
  const router = useRouter();

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
  if (!movies || movies.length === 0) {
    return (
      <section
        className="relative overflow-hidden mt-16"
        style={{ height: "100vh", minHeight: "600px" }}
      >
        <div className="absolute inset-0" style={{ aspectRatio: "16/9" }}>
          <div className="w-full h-full bg-gray-800"></div>
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="max-w-xl sm:max-w-2xl">
              <div className="h-12 sm:h-16 md:h-20 w-3/4 mb-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 sm:h-6 w-1/2 mb-2 bg-gray-600 rounded animate-pulse"></div>
              <div className="h-16 sm:h-20 w-full mb-8 bg-gray-600 rounded animate-pulse"></div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="h-10 sm:h-12 w-full sm:w-32 bg-gray-600 rounded animate-pulse"></div>
                <div className="h-10 sm:h-12 w-full sm:w-32 bg-gray-600 rounded animate-pulse"></div>
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
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4">
                Welcome to Shoowflix
              </h1>
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
    <section
      className="relative overflow-hidden mt-16"
      style={{
        height: "100vh",
        minHeight: "600px",
        aspectRatio: "16/9",
        contain: "layout style paint",
      }}
      data-testid="hero-section"
    >
      {movies && movies.length > 0 ? (
        <Swiper
          modules={[Autoplay, EffectFade]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={handleSlideChange}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          speed={600}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          effect="fade"
          fadeEffect={{
            crossFade: true,
          }}
          navigation={false}
          pagination={false}
          className="h-full w-full"
        >
          {movies.map((movieItem, index) => {
            // Generate a unique solid color based on movie id for loading state
            const hue = (movieItem.id * 137.5) % 360;
            const solidColor = `hsl(${hue}, 40%, 18%)`;

            return (
              <SwiperSlide key={movieItem.id}>
                <div
                  className="absolute inset-0"
                  style={{
                    aspectRatio: "16/9",
                    backgroundColor: solidColor,
                  }}
                >
                  <div
                    className="relative w-full h-full"
                    style={{
                      aspectRatio: "16/9",
                      backgroundColor: solidColor,
                      contentVisibility: "auto",
                    }}
                  >
                    <Image
                      src={
                        movieItem?.background_image_original ||
                        movieItem?.large_cover_image ||
                        movieItem?.medium_cover_image ||
                        "/placeholder-backdrop.jpg"
                      }
                      alt={`${movieItem?.title} backdrop`}
                      fill
                      priority
                      fetchPriority="high"
                      sizes="100vw"
                      quality={90}
                      className="object-cover"
                      style={{ transform: "translateZ(0)" }}
                    />

                    <div className="absolute inset-0 hero-gradient"></div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
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

      <div className="absolute inset-0 z-20 h-full flex items-center">
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
              <span data-testid="hero-rating" className="ml-2">
                {movie?.rating} ⭐
              </span>
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
                style={{
                  contentVisibility: "auto",
                  containIntrinsicSize: "0 80px",
                }}
              >
                {movie.synopsis}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {isAuthenticated && (
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-2 sm:py-3 font-semibold flex items-center justify-center space-x-2 w-full sm:w-auto transform hover:scale-105 transition-transform"
                  onClick={() =>
                    movie && onPlayMovie?.(movie, movie.torrents?.[0])
                  }
                  disabled={isLoadingPlay}
                  data-testid="hero-play-button"
                >
                  {isLoadingPlay ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Play Now</span>
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="secondary"
                size="lg"
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 sm:px-8 py-2 sm:py-3 font-semibold flex items-center justify-center space-x-2 w-full sm:w-auto transform hover:scale-105 transition-transform"
                onClick={() => {
                  if (movie) {
                    const movieSlug = movie.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "");
                    router.push(`/movie/${movie.id}/${movieSlug}`);
                  }
                }}
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
