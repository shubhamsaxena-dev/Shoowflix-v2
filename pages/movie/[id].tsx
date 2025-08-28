import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Play, Download, Star, Clock, Calendar, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/video-player";
import MovieSection from "@/components/movie-section";
import { useMovieDetails, useMovieSuggestions, generateMagnetLink } from "@/hooks/use-movies";
import type { YTSMovie, Torrent } from "@shared/schema";

export default function MovieDetail() {
  const router = useRouter();
  const { id } = router.query;
  const movieId = parseInt(id as string || '0');
  const { toast } = useToast();

  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedTorrent, setSelectedTorrent] = useState<Torrent | null>(null);
  const [magnetLink, setMagnetLink] = useState<string | null>(null);

  const { data: movieData, isLoading: movieLoading, error: movieError } = useMovieDetails(movieId);
  const { data: suggestionsData, isLoading: suggestionsLoading } = useMovieSuggestions(movieId);

  const movie = movieData?.data?.movie;
  const suggestions = suggestionsData?.data?.movies;

  const handlePlayMovie = async (torrent: Torrent) => {
    if (!movie) return;

    try {
      setSelectedTorrent(torrent);

      // Generate magnet link
      const magnet = await generateMagnetLink(torrent.hash, movie.title);
      setMagnetLink(magnet);
      setShowVideoPlayer(true);

      toast({
        title: "Starting stream",
        description: `Loading ${movie.title} in ${torrent.quality}`,
      });

    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: "Stream failed",
        description: "Unable to start streaming. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (torrent: Torrent) => {
    if (!movie) return;

    try {
      const magnet = await generateMagnetLink(torrent.hash, movie.title);
      window.open(magnet, '_blank');
      
      toast({
        title: "Download started",
        description: "Magnet link opened in your torrent client.",
      });
    } catch (error) {
      console.error('Error generating download link:', error);
      toast({
        title: "Download failed",
        description: "Unable to generate download link.",
        variant: "destructive"
      });
    }
  };

  const handleMovieClick = (movie: YTSMovie) => {
    router.push(`/movie/${movie.id}`);
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedTorrent(null);
    setMagnetLink(null);
  };

  if (movieError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="movie-error-title">Movie Not Found</h1>
          <p className="text-muted-foreground mb-6" data-testid="movie-error-message">
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

  if (movieLoading || !movie) {
    return (
      <div className="min-h-screen bg-background">
        {/* Loading skeleton */}
        <div className="relative">
          <Skeleton className="h-64 w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-6">
            <Skeleton className="w-48 h-72 flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
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
            <h1 className="text-xl font-semibold truncate" data-testid="movie-detail-header-title">
              {movie.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Movie backdrop */}
      <div className="relative h-64 overflow-hidden mt-16">
        <img 
          src={movie.background_image_original || movie.large_cover_image || movie.medium_cover_image}
          alt={`${movie.title} backdrop`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-backdrop.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent"></div>
      </div>

      {/* Movie details */}
      <div className="container mx-auto px-4 py-8 -mt-16 relative z-10">
        <div className="flex gap-6 mb-8">
          <div className="flex-shrink-0">
            <img 
              src={movie.medium_cover_image}
              alt={`${movie.title} poster`}
              className="w-48 h-72 object-cover rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-movie.jpg';
              }}
              data-testid="movie-detail-poster"
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4" data-testid="movie-detail-title">
              {movie.title}
            </h1>
            
            <div className="flex items-center space-x-6 mb-6 text-muted-foreground">
              <div className="flex items-center space-x-1" data-testid="movie-detail-year">
                <Calendar className="h-4 w-4" />
                <span>{movie.year}</span>
              </div>
              {movie.runtime && (
                <div className="flex items-center space-x-1" data-testid="movie-detail-runtime">
                  <Clock className="h-4 w-4" />
                  <span>{movie.runtime} min</span>
                </div>
              )}
              <div className="flex items-center space-x-1" data-testid="movie-detail-rating">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span>{movie.rating}</span>
              </div>
            </div>
            
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
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
              <p className="text-muted-foreground mb-8 leading-relaxed" data-testid="movie-detail-description">
                {movie.description_full}
              </p>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-4 mb-8">
              <Button 
                variant="outline"
                data-testid="movie-detail-favorite"
              >
                <Heart className="mr-2 h-4 w-4" />
                Add to Favorites
              </Button>
              <Button 
                variant="outline"
                data-testid="movie-detail-share"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
            
            {/* Available qualities */}
            {movie.torrents && movie.torrents.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4" data-testid="movie-detail-qualities-title">
                  Available Qualities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movie.torrents.map((torrent, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium" data-testid={`torrent-quality-${index}`}>
                            {torrent.quality}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`torrent-size-${index}`}>
                            {torrent.size}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm" data-testid={`torrent-seeds-${index}`}>
                            {torrent.seeds} seeds
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`torrent-peers-${index}`}>
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cast section */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6" data-testid="movie-detail-cast-title">Cast</h3>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hidden pb-4">
              {movie.cast.map((actor, index) => (
                <div key={index} className="flex-shrink-0 text-center w-32">
                  <img 
                    src={actor.url_small_image || '/placeholder-actor.jpg'}
                    alt={actor.name}
                    className="w-20 h-20 object-cover rounded-full mb-2 mx-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-actor.jpg';
                    }}
                    data-testid={`cast-image-${index}`}
                  />
                  <p className="text-sm font-medium" data-testid={`cast-name-${index}`}>
                    {actor.name}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`cast-character-${index}`}>
                    {actor.character_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar movies */}
        {suggestions && suggestions.length > 0 && (
          <MovieSection
            title="You might also like"
            movies={suggestions}
            isLoading={suggestionsLoading}
            onMovieClick={handleMovieClick}
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
  );
}