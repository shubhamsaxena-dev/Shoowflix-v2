import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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
  const movieId = parseInt(typeof id === 'string' ? id : '0');
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
      const magnet = await generateMagnetLink(movie, torrent);
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
      const magnet = await generateMagnetLink(movie, torrent);
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

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedTorrent(null);
    setMagnetLink(null);
  };

  const handleSuggestionClick = (suggestedMovie: YTSMovie) => {
    router.push(`/movie/${suggestedMovie.id}`);
  };

  if (movieLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-8 bg-gray-800" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="aspect-[2/3] w-full bg-gray-800" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4 bg-gray-800" />
              <Skeleton className="h-4 w-full bg-gray-800" />
              <Skeleton className="h-4 w-full bg-gray-800" />
              <Skeleton className="h-4 w-2/3 bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (movieError || !movie) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700">
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-4 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:text-red-500">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Button>
          </Link>
          
          <Link href="/" className="text-red-500 font-bold text-xl tracking-wider">
            SHOOWFLIX
          </Link>
        </div>
      </header>

      {/* Movie Details */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Movie Poster */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <img
                src={movie.large_cover_image}
                alt={movie.title}
                className="w-full rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>
          </div>

          {/* Movie Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
              <p className="text-xl text-gray-300">{movie.year}</p>
            </div>

            {/* Rating and Runtime */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="text-lg font-semibold">{movie.rating}</span>
                <span className="text-gray-400">/10</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-5 w-5 text-gray-400" />
                <span>{movie.runtime} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>{movie.year}</span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((genre) => (
                <Badge key={genre} variant="secondary" className="bg-gray-800 text-white">
                  {genre}
                </Badge>
              ))}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Synopsis</h3>
              <p className="text-gray-300 leading-relaxed">
                {movie.description_full || movie.summary || "No description available."}
              </p>
            </div>

            {/* Torrents */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Available Downloads</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {movie.torrents?.map((torrent, index) => (
                  <Card key={index} className="p-4 bg-gray-900 border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{torrent.quality}</h4>
                        <p className="text-sm text-gray-400">{torrent.size}</p>
                        <p className="text-sm text-green-400">{torrent.seeds} seeds</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handlePlayMovie(torrent)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        data-testid={`play-${torrent.quality}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Stream
                      </Button>
                      <Button 
                        onClick={() => handleDownload(torrent)}
                        variant="outline"
                        className="border-gray-600 hover:bg-gray-800"
                        data-testid={`download-${torrent.quality}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button variant="outline" className="border-gray-600 hover:bg-gray-800">
                <Heart className="h-4 w-4 mr-2" />
                Add to Favorites
              </Button>
              <Button variant="outline" className="border-gray-600 hover:bg-gray-800">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Suggested Movies */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-8">
            <MovieSection
              title="You might also like"
              movies={suggestions}
              isLoading={suggestionsLoading}
              onPlayMovie={(movie, torrent) => {
                router.push(`/movie/${movie.id}`);
              }}
              showViewAll={false}
            />
          </div>
        )}
      </main>

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