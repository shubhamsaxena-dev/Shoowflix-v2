import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Sparkles } from "lucide-react";
import { AppHeader } from "@/components/header";
import HeroSection from "@/components/hero-section";
import MovieSection from "@/components/movie-section";
import VideoPlayer from "@/components/video-player";
import SearchOverlay from "@/components/search-overlay";
import AISuggestOverlay from "@/components/ai-suggest-overlay";
import { Button } from "@/components/ui/button";
import {
  useTrendingMovies,
  useHighRatedMovies,
  useRecentMovies,
  generateMagnetLink,
} from "@/hooks/use-movies";
import type { YTSMovie, Torrent } from "@/types/movie";

const genres = [
  "Sci-Fi",
  "Action",
  "Comedy",
  "Adventure",
  "Crime",
  "Fantasy",
  "Mystery",
  "Drama",
  "Horror",
  "Romance",
  "War",
  "Thriller",
  "Animation",
];

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showAiOverlay, setShowAiOverlay] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<YTSMovie | null>(null);
  const [selectedTorrent, setSelectedTorrent] = useState<Torrent | null>(null);
  const [magnetLink, setMagnetLink] = useState<string | null>(null);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>("");
  const [loadingMovieId, setLoadingMovieId] = useState<number | null>(null);
  const [loadingViewAll, setLoadingViewAll] = useState<string | null>(null);
  const [loadingPlay, setLoadingPlay] = useState<boolean>(false);

  // Data fetching with SWR
  const {
    movies: trendingMovies,
    isLoading: trendingLoading,
    error: trendingError,
  } = useTrendingMovies();
  const {
    movies: highRatedMovies,
    isLoading: highRatedLoading,
    error: highRatedError,
  } = useHighRatedMovies();
  const {
    movies: recentMovies,
    isLoading: recentLoading,
    error: recentError,
  } = useRecentMovies();

  // Get featured movies for slideshow (random 5 from trending movies)
  const featuredMovies = useMemo(() => {
    if (!trendingMovies || trendingMovies.length === 0) return [];

    // Shuffle trending movies and take first 5
    const shuffled = [...trendingMovies].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, [trendingMovies]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setInitialSearchQuery(query.trim());
      setShowSearchOverlay(true);
    }
  };

  const handleMovieClick = (movie: YTSMovie) => {
    // Set loading state for this movie
    setLoadingMovieId(movie.id);

    // Navigate to movie detail page with proper router
    const movieSlug = movie.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    // Use timeout to show loading state briefly before navigation
    setTimeout(() => {
      router.push(`/movie/${movie.id}/${movieSlug}`);
    }, 150);
  };

  const handlePlayMovie = async (movie: YTSMovie, torrent: Torrent) => {
    try {
      setLoadingPlay(true);
      setSelectedMovie(movie);
      setSelectedTorrent(torrent);

      // Generate magnet link
      const magnet = await generateMagnetLink(movie, torrent);
      setMagnetLink(magnet);
      setShowVideoPlayer(true);
    } catch (error) {
      console.error("Error generating magnet link:", error);
    } finally {
      setLoadingPlay(false);
    }
  };

  const handleViewAll = (genre: string) => {
    setLoadingViewAll(genre);

    // Use timeout to show loading state briefly before navigation
    setTimeout(() => {
      router.push(`/genre/${genre}`);
    }, 150);
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedMovie(null);
    setSelectedTorrent(null);
    setMagnetLink(null);
  };

  return (
    <>
      <Head>
        <title>Shoowflix - Stream Movies Online in HD Quality</title>
        {/* Open Graph Meta Tags */}
        <meta
          property="og:title"
          content="Shoowflix - Stream Movies in High Quality"
        />
        <meta
          property="og:description"
          content="Discover and stream your favorite movies in high quality with Shoowflix. Browse trending, action, comedy, and more genres with a Netflix-like experience."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Shoowflix" />
        <meta
          property="og:image"
          content="https://shoowflix.com/og-image.jpg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Shoowflix - Movie Streaming Platform"
        />
        <meta property="og:locale" content="en_US" />
        <meta property="fb:app_id" content="" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@shoowflix" />
        <meta name="twitter:creator" content="@shoowflix" />
        <meta
          name="twitter:title"
          content="Shoowflix - Stream Movies in High Quality"
        />
        <meta
          name="twitter:description"
          content="Discover and stream your favorite movies in high quality with Shoowflix. Browse trending, action, comedy, and more genres."
        />
        <meta
          name="twitter:image"
          content="https://shoowflix.com/og-image.jpg"
        />
        <meta
          name="twitter:image:alt"
          content="Shoowflix - Movie Streaming Platform"
        />

        <link rel="canonical" href="https://shoowflix.com" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Shoowflix",
              description:
                "Premium movie streaming platform offering HD quality films across all genres",
              url: "https://shoowflix.com",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://shoowflix.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
              publisher: {
                "@type": "Organization",
                name: "Shoowflix",
                logo: {
                  "@type": "ImageObject",
                  url: "https://shoowflix.com/og-image.jpg",
                },
              },
            }),
          }}
        />
      </Head>

      <div
        className="min-h-screen bg-background text-foreground"
        style={{ contain: "layout style paint" }}
      >
        <AppHeader
          session={session}
          onSearch={handleSearch}
          onAiClick={() => setShowAiOverlay(true)}
          onSignIn={() => router.push("/auth/signin")}
        />

        {/* Hero Section */}
        {trendingLoading || !featuredMovies || featuredMovies.length === 0 ? (
          <section className="relative overflow-hidden mt-16 mb-4 sm:mb-12 h-[50vh] sm:h-screen min-h-[360px] sm:min-h-[600px]">
            <div
              className="absolute inset-0"
              style={{ aspectRatio: "16/9", backgroundColor: "#1a1a1a" }}
            >
              <div className="w-full h-full bg-gray-800 animate-pulse"></div>
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
        ) : (
          <HeroSection
            movies={featuredMovies}
            onPlayMovie={handlePlayMovie}
            isLoadingPlay={loadingPlay}
            isAuthenticated={!!session}
          />
        )}

        {/* Movie Sections */}
        <main
          className="z-10 space-y-12 pb-20 pt-16"
          style={{
            contain: "layout style paint",
            transform: "translateZ(0)",
            willChange: "auto",
          }}
        >
          <MovieSection
            title="Recently Added"
            movies={recentMovies}
            isLoading={recentLoading}
            onMovieClick={handleMovieClick}
            onViewAll={() => handleViewAll("recent")}
            loadingMovieId={loadingMovieId}
            loadingViewAll={loadingViewAll === "recent"}
          />
          <MovieSection
            title="Trending Now"
            movies={trendingMovies}
            isLoading={trendingLoading}
            onMovieClick={handleMovieClick}
            loadingMovieId={loadingMovieId}
          />

          <MovieSection
            title="High Rated Movies"
            movies={highRatedMovies}
            isLoading={highRatedLoading}
            onMovieClick={handleMovieClick}
            onViewAll={() => handleViewAll("high-rated")}
            loadingMovieId={loadingMovieId}
            loadingViewAll={loadingViewAll === "high-rated"}
          />

          {genres.map((genre) => {
            return (
              <MovieSection
                key={genre}
                genre={genre}
                onMovieClick={handleMovieClick}
                onViewAll={() => handleViewAll(genre)}
                loadingMovieId={loadingMovieId}
                loadingViewAll={loadingViewAll === genre}
              />
            );
          })}
        </main>

        {/* Overlays and Modals */}
        {showSearchOverlay && (
          <SearchOverlay
            isOpen={showSearchOverlay}
            onClose={() => {
              setShowSearchOverlay(false);
              setInitialSearchQuery("");
            }}
            onMovieClick={handleMovieClick}
            initialQuery={initialSearchQuery}
            loadingMovieId={loadingMovieId}
          />
        )}

        {showVideoPlayer && selectedMovie && magnetLink && (
          <VideoPlayer
            isOpen={showVideoPlayer}
            movie={selectedMovie}
            selectedTorrent={selectedTorrent}
            magnetLink={magnetLink}
            onClose={handleCloseVideoPlayer}
          />
        )}

        {showAiOverlay && (
          <AISuggestOverlay
            isOpen={showAiOverlay}
            onClose={() => setShowAiOverlay(false)}
            onMovieClick={handleMovieClick}
          />
        )}
      </div>
      {/* Floating AI Picks button for mobile (mid-right viewport, outside contained wrapper) */}
      <Button
        onClick={() => setShowAiOverlay(true)}
        aria-label="AI Picks"
        data-testid="fab-ai-picks"
        className="fixed right-4 z-[1000] sm:hidden rounded-full h-12 w-12 p-0 shadow-lg"
        style={{ bottom: "max(env(safe-area-inset-bottom), 1rem)" }}
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    </>
  );
}
