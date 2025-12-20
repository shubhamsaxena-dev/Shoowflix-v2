import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Play,
  Download,
  Star,
  Clock,
  Calendar,
  Heart,
  Share2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/video-player";
import MovieSection from "@/components/movie-section";
import { useMovieSuggestions, generateMagnetLink } from "@/hooks/use-movies";
import { useFavorites } from "@/hooks/use-favorites";
import type { YTSMovie, Torrent } from "@/types/movie";

// Helper function to create URL-friendly slug from movie title
function createSlug(title: string | null | undefined): string {
  if (!title) {
    return "untitled";
  }
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface MovieDetailProps {
  initialMovieData: { data: { movie: YTSMovie } } | null;
  movieId: number;
}

export default function MovieDetail({
  initialMovieData,
  movieId,
}: MovieDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { slug } = router.query;
  const { toast } = useToast();
  const { isFavorite, addToFavorites, removeFromFavorites, favorites } =
    useFavorites();
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedTorrent, setSelectedTorrent] = useState<Torrent | null>(null);
  const [magnetLink, setMagnetLink] = useState<string | null>(null);
  const [loadingMovieId, setLoadingMovieId] = useState<number | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Use SSR data as initial state
  const movie = initialMovieData?.data?.movie || null;
  const { data: suggestionsData, isLoading: suggestionsLoading } =
    useMovieSuggestions(movieId);
  const suggestions = suggestionsData?.data?.movies;

  // Redirect to proper URL with movie name slug if missing
  useEffect(() => {
    if (movie && movie.title && !slug) {
      const movieSlug = createSlug(movie.title);
      router.replace(`/movie/${movie.id}/${movieSlug}`, undefined, {
        shallow: true,
      });
    }
  }, [movie, slug, router]);

  // Auto-select 720p torrent by default
  useEffect(() => {
    if (
      movie &&
      movie.torrents &&
      movie.torrents.length > 0 &&
      !selectedTorrent
    ) {
      // Find 720p torrent first
      {
        /*@ts-ignore*/
      }
      const torrent720p = movie.torrents.find((t) => t.quality === "720p");

      if (torrent720p) {
        setSelectedTorrent(torrent720p);
      } else {
        // Fallback to highest quality available
        const sortedTorrents = [...movie.torrents].sort((a, b) => {
          const qualityOrder = { "2160p": 4, "1080p": 3, "720p": 2, "480p": 1 };
          const aValue =
            qualityOrder[a.quality as keyof typeof qualityOrder] || 0;
          const bValue =
            qualityOrder[b.quality as keyof typeof qualityOrder] || 0;
          return bValue - aValue;
        });
        setSelectedTorrent(sortedTorrents[0]);
      }
    }
  }, [movie, selectedTorrent]);

  const handlePlayMovie = async (torrent: Torrent) => {
    if (!movie) return;

    try {
      setSelectedTorrent(torrent);

      // Generate magnet link
      const magnet = await generateMagnetLink(movie, torrent);
      setMagnetLink(magnet);
      setShowVideoPlayer(true);

      toast({
        title: "Starting stream",
        description: `Loading ${movie.title} in ${torrent.quality}`,
      });
    } catch (error) {
      console.error("Error starting stream:", error);
      toast({
        title: "Stream failed",
        description: "Unable to start streaming. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!movie) return;

    const movieUrl = `${window.location.origin}/movie/${movie.id}/${createSlug(
      movie.title
    )}`;
    const shareData = {
      title: `${movie.title} (${movie.year})`,
      text: `Watch ${movie.title} on Shoowflix - ${
        movie.description_full?.substring(0, 100) ||
        movie.synopsis?.substring(0, 100) ||
        "Stream in HD quality"
      }...`,
      url: movieUrl,
    };

    try {
      // Check if Web Share API is supported (mobile devices)
      if (
        navigator.share &&
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Movie shared via native sharing.",
        });
      } else {
        // Desktop: Copy to clipboard
        await navigator.clipboard.writeText(movieUrl);
        toast({
          title: "Link copied",
          description: "Movie link copied to clipboard.",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(movieUrl);
        toast({
          title: "Link copied",
          description: "Movie link copied to clipboard.",
        });
      } catch (clipboardError) {
        toast({
          title: "Share failed",
          description: "Unable to share or copy link.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFavoriteToggle = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (!movie) return;

    setFavoriteLoading(true);

    try {
      if (isFavorite(movie.id)) {
        const success = await removeFromFavorites(movie.id);
        if (success) {
          toast({
            title: "Removed from favorites",
            description: `${movie.title} has been removed from your favorites`,
          });
        }
      } else {
        const success = await addToFavorites(movie.id);
        if (success) {
          toast({
            title: "Added to favorites",
            description: `${movie.title} has been added to your favorites`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleDownload = async (torrent: Torrent) => {
    if (!movie) return;

    try {
      const magnet = await generateMagnetLink(movie, torrent);

      // Create a downloadable .magnet file
      const blob = new Blob([magnet], { type: "application/x-magnet" });
      const url = URL.createObjectURL(blob);

      // Create temporary download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `${movie.title} (${torrent.quality}).magnet`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `${movie.title} magnet file downloaded successfully.`,
      });
    } catch (error) {
      console.error("Error generating download link:", error);
      toast({
        title: "Download failed",
        description: "Unable to generate download link.",
        variant: "destructive",
      });
    }
  };

  const handleMovieClick = (movie: YTSMovie) => {
    // Set loading state for this movie
    setLoadingMovieId(movie.id);

    const movieSlug = createSlug(movie.title);

    // Use timeout to show loading state briefly before navigation
    setTimeout(() => {
      router.push(`/movie/${movie.id}/${movieSlug}`);
    }, 150);
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedTorrent(null);
    setMagnetLink(null);
  };

  // Handle case when movie is not found (shouldn't happen with SSR, but for safety)
  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1
            className="text-2xl font-bold mb-4"
            data-testid="movie-error-title"
          >
            Movie Not Found
          </h1>
          <p
            className="text-muted-foreground mb-6"
            data-testid="movie-error-message"
          >
            The movie you're looking for could not be found.
          </p>
          <Link href="/">
            <Button data-testid="movie-error-home-link">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Movie data is available from SSR, render the page
  return (
    <>
      <Head>
        <title>
          {`${movie.title} (${movie.year}) - Stream Online | Shoowflix`}
        </title>
        <meta
          name="description"
          content={
            movie.description_full?.substring(0, 160) ||
            movie.synopsis?.substring(0, 160) ||
            `${movie.title} - Stream in HD quality on Shoowflix.`
          }
        />

        {/* Open Graph */}
        <meta
          property="og:title"
          content={`${movie.title} (${movie.year}) - Stream Online | Shoowflix`}
        />
        <meta
          property="og:description"
          content={
            movie.description_full?.substring(0, 150) ||
            movie.synopsis?.substring(0, 150) ||
            "Watch movies online in HD quality on Shoowflix."
          }
        />
        <meta
          property="og:image"
          content={movie.large_cover_image || "/og-image.jpg"}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content={`${movie.title} (${movie.year}) Poster`}
        />
        <meta property="og:type" content="video.movie" />
        <meta property="og:site_name" content="Shoowflix" />
        <meta property="og:locale" content="en_US" />
        <meta
          property="og:url"
          content={
            movie
              ? `${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/movie/${movie.id}/${createSlug(movie.title)}`
              : typeof window !== "undefined"
              ? window.location.origin
              : ""
          }
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@shoowflix" />
        <meta name="twitter:creator" content="@shoowflix" />
        <meta
          name="twitter:title"
          content={
            movie
              ? `${movie.title} (${movie.year}) - Stream Online`
              : "Movie Details"
          }
        />
        <meta
          name="twitter:description"
          content={
            movie
              ? movie.description_full?.substring(0, 150) ||
                movie.synopsis?.substring(0, 150)
              : "Watch movies online in HD quality on Shoowflix."
          }
        />
        <meta
          name="twitter:image"
          content={movie?.large_cover_image || "/og-image.jpg"}
        />
        <meta
          name="twitter:image:alt"
          content={
            movie
              ? `${movie.title} (${movie.year}) Poster`
              : "Shoowflix Movie Poster"
          }
        />

        {/* Canonical URL */}
        {movie && (
          <link
            rel="canonical"
            href={`${
              typeof window !== "undefined" ? window.location.origin : ""
            }/movie/${movie.id}/${createSlug(movie.title)}`}
          />
        )}

        {/* JSON-LD Structured Data */}
        {movie && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Movie",
                name: movie.title,
                description: movie.description_full || movie.synopsis,
                image: movie.large_cover_image || movie.medium_cover_image,
                datePublished: movie.year?.toString(),
                duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
                genre: movie.genres,
                aggregateRating: movie.rating
                  ? {
                      "@type": "AggregateRating",
                      ratingValue: movie.rating,
                      ratingCount: 100,
                      bestRating: 10,
                      worstRating: 1,
                    }
                  : undefined,
                url: `https://shoowflix.com/movie/${movie.id}/${createSlug(
                  movie.title
                )}`,
                potentialAction: {
                  "@type": "WatchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `https://shoowflix.com/movie/${
                      movie.id
                    }/${createSlug(movie.title)}`,
                  },
                },
              }),
            }}
          />
        )}
      </Head>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-0 w-full z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="back-to-home">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <h1
                className="text-lg sm:text-xl font-semibold truncate"
                data-testid="movie-detail-header-title"
              >
                {movie.title || "Untitled Movie"}
              </h1>
            </div>
          </div>
        </header>

        {/* Movie backdrop */}
        <div className="relative h-64 overflow-hidden mt-16">
          {movie.background_image_original ||
          movie.large_cover_image ||
          movie.medium_cover_image ? (
            <Image
              src={
                movie.background_image_original ||
                movie.large_cover_image ||
                movie.medium_cover_image
              }
              alt={`${movie.title || "Movie"} backdrop`}
              fill
              className="object-cover"
              priority
              quality={85}
              sizes="100vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center"
            style={{
              display:
                movie.background_image_original ||
                movie.large_cover_image ||
                movie.medium_cover_image
                  ? "none"
                  : "flex",
            }}
          >
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-lg font-medium">
                {movie.title || "Untitled Movie"}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent"></div>
        </div>

        {/* Movie details */}
        <div className="container mx-auto px-4 py-8 -mt-16 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              {movie.medium_cover_image || movie.large_cover_image ? (
                <div className="relative w-32 h-48 sm:w-40 sm:h-60 lg:w-48 lg:h-72">
                  <Image
                    src={movie.medium_cover_image || movie.large_cover_image}
                    alt={`${movie.title || "Movie"} poster`}
                    fill
                    className="object-cover rounded-lg shadow-lg"
                    sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 192px"
                    priority
                    quality={85}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                    data-testid="movie-detail-poster"
                  />
                </div>
              ) : null}
              <div
                className="w-32 h-48 sm:w-40 sm:h-60 lg:w-48 lg:h-72 bg-gradient-to-br from-muted/50 to-muted/80 rounded-lg shadow-lg flex flex-col items-center justify-center text-center"
                style={{
                  display:
                    movie.medium_cover_image || movie.large_cover_image
                      ? "none"
                      : "flex",
                }}
                data-testid="movie-detail-poster-fallback"
              >
                <div className="text-3xl sm:text-4xl mb-2">🎬</div>
                <p className="text-sm font-medium text-muted-foreground px-2">
                  {movie.title || "Untitled Movie"}
                </p>
                {movie.year && (
                  <p className="text-xs text-muted-foreground">
                    ({movie.year})
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
                data-testid="movie-detail-title"
              >
                {movie.title || "Untitled Movie"}
              </h1>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 lg:gap-6 mb-6 text-muted-foreground">
                <div
                  className="flex items-center space-x-1"
                  data-testid="movie-detail-year"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{movie.year}</span>
                </div>
                {movie.runtime && (
                  <div
                    className="flex items-center space-x-1"
                    data-testid="movie-detail-runtime"
                  >
                    <Clock className="h-4 w-4" />
                    <span>{movie.runtime} min</span>
                  </div>
                )}
                <div
                  className="flex items-center space-x-1"
                  data-testid="movie-detail-rating"
                >
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span>{movie.rating}</span>
                </div>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {/*@ts-ignore*/}
                  {movie.genres.map((genre, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      data-testid={`movie-detail-genre-${index}`}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {movie.description_full && (
                <p
                  className="text-muted-foreground mb-8 leading-relaxed"
                  data-testid="movie-detail-description"
                >
                  {movie.description_full}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  variant="outline"
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  data-testid="movie-detail-favorite"
                >
                  {favoriteLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`mr-2 h-4 w-4 ${
                        session && isFavorite(movie.id)
                          ? "fill-red-500 text-red-500"
                          : ""
                      }`}
                    />
                  )}
                  {session
                    ? isFavorite(movie.id)
                      ? "Remove from Favorites"
                      : "Add to Favorites"
                    : "Favourite"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  data-testid="movie-detail-share"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Quick Play - Default 720p - Only show for authenticated users */}
              {session &&
                selectedTorrent &&
                movie.torrents &&
                movie.torrents.length > 0 && (
                  <div className="mb-8">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg py-3 px-8"
                      onClick={() => handlePlayMovie(selectedTorrent)}
                      data-testid="movie-detail-play-now"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Play Now ({selectedTorrent.quality})
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Default quality: {selectedTorrent.quality} •{" "}
                      {selectedTorrent.size}
                    </p>
                  </div>
                )}

              {/* Sign in prompt for non-authenticated users */}
              {!session && (
                <div className="mb-8 p-6 bg-muted rounded-lg text-center">
                  <h3 className="font-semibold mb-2">
                    Sign in to watch movies
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create an account or sign in to stream movies and save your
                    favorites
                  </p>
                  <Button
                    onClick={() => router.push("/auth/signin")}
                    data-testid="movie-detail-signin-prompt"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Sign In to Continue
                  </Button>
                </div>
              )}

              {/* No torrents available message */}
              {(!movie.torrents || movie.torrents.length === 0) && (
                <div className="mb-8 p-4 bg-muted rounded-lg">
                  <p
                    className="text-muted-foreground text-center"
                    data-testid="movie-detail-no-torrents"
                  >
                    No streaming links available for this movie at the moment.
                  </p>
                </div>
              )}

              {/* Available qualities - Only show for authenticated users */}
              {session && movie.torrents && movie.torrents.length > 0 && (
                <div>
                  <h3
                    className="font-semibold mb-4"
                    data-testid="movie-detail-qualities-title"
                  >
                    All Available Qualities
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/*@ts-ignore*/}
                    {movie.torrents.map((torrent, index) => {
                      const isSelected =
                        selectedTorrent?.quality === torrent.quality;
                      return (
                        <Card
                          key={index}
                          className={`p-4 ${
                            isSelected ? "ring-2 ring-primary" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4
                                className="font-medium flex items-center gap-2"
                                data-testid={`torrent-quality-${index}`}
                              >
                                {torrent.quality}
                                {isSelected && (
                                  <Badge variant="default">Default</Badge>
                                )}
                              </h4>
                              <p
                                className="text-sm text-muted-foreground"
                                data-testid={`torrent-size-${index}`}
                              >
                                {torrent.size}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className="text-sm"
                                data-testid={`torrent-seeds-${index}`}
                              >
                                {torrent.seeds} seeds
                              </p>
                              <p
                                className="text-sm text-muted-foreground"
                                data-testid={`torrent-peers-${index}`}
                              >
                                {torrent.peers} peers
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-primary hover:bg-primary/90"
                              onClick={() => handlePlayMovie(torrent)}
                              data-testid={`torrent-stream-${index}`}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Stream
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleDownload(torrent)}
                              data-testid={`torrent-download-${index}`}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cast information not available from YTS API */}

          {/* Similar movies */}
          {(suggestionsLoading || (suggestions && suggestions.length > 0)) && (
            <MovieSection
              title="You might also like"
              movies={suggestions}
              isLoading={suggestionsLoading}
              onMovieClick={handleMovieClick}
              loadingMovieId={loadingMovieId}
            />
          )}
        </div>

        {/* Video Player */}
        <VideoPlayer
          isOpen={showVideoPlayer}
          movie={movie}
          selectedTorrent={selectedTorrent}
          magnetLink={magnetLink}
          onClose={handleCloseVideoPlayer}
        />
      </div>
    </>
  );
}
