import { useState } from "react";
import Link from "next/link";
import { Filter, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SearchBar from "@/components/search-bar";
import HeroSection from "@/components/hero-section";
import MovieSection from "@/components/movie-section";
import FilterPanel from "@/components/filter-panel";
import VideoPlayer from "@/components/video-player";
import MoviesList from "@/components/movies-list";
import SearchOverlay from "@/components/search-overlay";
import { 
  useTrendingMovies, 
  useActionMovies, 
  useHighRatedMovies, 
  useRecentMovies,
  useMovies,
  generateMagnetLink
} from "@/hooks/use-movies";
import type { YTSMovie, Torrent } from "@shared/schema";
import type { MovieFilters } from "@/lib/types";

const genres = [
  'Sci-Fi',
  'Comedy', 
  'Adventure',
  'Crime',
  'Fantasy',
  'Mystery',
  'Drama',
  'Horror',
  'Romance',
  'War',
  'Thriller',
  'Animation'
];

export default function Home() {
  const { toast } = useToast();
  const [searchFilters, setSearchFilters] = useState<MovieFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<YTSMovie | null>(null);
  const [selectedTorrent, setSelectedTorrent] = useState<Torrent | null>(null);
  const [magnetLink, setMagnetLink] = useState<string | null>(null);

  // Data fetching
  const { data: trendingData, isLoading: trendingLoading, error: trendingError } = useTrendingMovies();
  const { data: actionData, isLoading: actionLoading, error: actionError } = useActionMovies();
  const { data: highRatedData, isLoading: highRatedLoading, error: highRatedError } = useHighRatedMovies();
  const { data: recentData, isLoading: recentLoading, error: recentError } = useRecentMovies();
  const { data: searchData, isLoading: searchLoading, error: searchError } = useMovies(searchFilters);

  // Get featured movies for slideshow (first 5 trending movies)
  const featuredMovies = trendingData?.data?.movies?.slice(0, 5);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setShowSearchOverlay(true);
    }
  };
  
  const handleSearchClick = () => {
    setShowSearchOverlay(true);
  };

  const handleApplyFilters = (filters: MovieFilters) => {
    setSearchFilters(filters);
    setShowFilters(false);
  };

  const handleMovieClick = (movie: YTSMovie) => {
    // Navigate to movie detail page - Next.js will handle this
    window.location.href = `/movie/${movie.id}`;
  };

  const handlePlayMovie = async (movie: YTSMovie, torrent: Torrent) => {
    try {
      const magnet = await generateMagnetLink(movie, torrent);
      setSelectedMovie(movie);
      setSelectedTorrent(torrent);
      setMagnetLink(magnet);
      setShowVideoPlayer(true);
      
      toast({
        title: "Loading movie...",
        description: `Starting ${movie.title}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating magnet link:', error);
      toast({
        title: "Error",
        description: "Failed to load movie",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedMovie(null);
    setSelectedTorrent(null);
    setMagnetLink(null);
  };

  if (trendingError || actionError || highRatedError || recentError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error loading movies</h1>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="relative z-50 px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-red-500 font-bold text-2xl sm:text-3xl tracking-wider">
              SHOOWFLIX
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block">
                <div onClick={handleSearchClick} className="cursor-pointer">
                  <SearchBar onSearch={handleSearch} />
                </div>
              </div>
              <div className="sm:hidden">
                <div onClick={handleSearchClick} className="cursor-pointer">
                  <SearchBar onSearch={handleSearch} placeholder="Search..." className="w-32" />
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-red-500"
              data-testid="profile-button"
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        {featuredMovies && featuredMovies.length > 0 && (
          <HeroSection 
            movies={featuredMovies} 
            onPlayMovie={handlePlayMovie}
          />
        )}

        {/* Movie Sections */}
        <div className="relative z-10 -mt-32 px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
          {/* Trending Movies */}
          <MovieSection
            title="Trending Now"
            movies={trendingData?.data?.movies || []}
            isLoading={trendingLoading}
            onPlayMovie={handlePlayMovie}
            showViewAll={true}
            viewAllLink="/genre/trending"
          />

          {/* Action Movies */}
          <MovieSection
            title="Action Movies" 
            movies={actionData?.data?.movies || []}
            isLoading={actionLoading}
            onPlayMovie={handlePlayMovie}
            showViewAll={true}
            viewAllLink="/genre/action"
          />

          {/* High Rated Movies */}
          <MovieSection
            title="Top Rated"
            movies={highRatedData?.data?.movies || []}
            isLoading={highRatedLoading}
            onPlayMovie={handlePlayMovie}
            showViewAll={true}
            viewAllLink="/genre/top-rated"
          />

          {/* Recent Movies */}
          <MovieSection
            title="Recently Added"
            movies={recentData?.data?.movies || []}
            isLoading={recentLoading}
            onPlayMovie={handlePlayMovie}
            showViewAll={true}
            viewAllLink="/genre/recent"
          />

          {/* Genre Sections */}
          {genres.map((genre) => (
            <MovieSection
              key={genre}
              title={`${genre} Movies`}
              movies={[]} // Will be loaded individually per genre
              isLoading={false}
              onPlayMovie={handlePlayMovie}
              showViewAll={true}
              viewAllLink={`/genre/${genre.toLowerCase().replace(/\s+/g, '-')}`}
              genre={genre}
            />
          ))}
        </div>
      </main>

      {/* Filter Toggle Button */}
      <Button 
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-primary hover:bg-primary/90 text-primary-foreground p-3 sm:p-4 rounded-full shadow-lg z-40"
        onClick={() => setShowFilters(true)}
        data-testid="filter-toggle-button"
      >
        <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {/* Search Overlay */}
      <SearchOverlay 
        isOpen={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        onMovieClick={handleMovieClick}
      />
      
      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={searchFilters}
      />

      {/* Video Player */}
      <VideoPlayer
        isOpen={showVideoPlayer}
        movie={selectedMovie}
        selectedTorrent={selectedTorrent}
        magnetLink={magnetLink}
        onClose={handleCloseVideoPlayer}
      />
    </div>
  );
}