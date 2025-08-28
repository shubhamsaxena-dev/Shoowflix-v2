import { useState } from "react";
import { Link } from "wouter";
import { Filter, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SearchBar from "@/components/search-bar";
import HeroSection from "@/components/hero-section";
import MovieSection from "@/components/movie-section";
import FilterPanel from "@/components/filter-panel";
import VideoPlayer from "@/components/video-player";
import { 
  useTrendingMovies, 
  useActionMovies, 
  useHighRatedMovies, 
  useRecentMovies,
  useMovies,
  generateMagnetLink,
  useSciFiMovies,
  useComedyMovies,
  useAdventureMovies,
  useCrimeMovies,
  useFantasyMovies,
  useMysteryMovies,
  useDramaMovies,
  useHorrorMovies,
  useRomanceMovies,
  useWarMovies,
  useThrillerMovies,
  useAnimationMovies
} from "@/hooks/use-movies";
import type { YTSMovie, Torrent } from "@shared/schema";
import type { MovieFilters } from "@/lib/types";

export default function Home() {
  const { toast } = useToast();
  const [searchFilters, setSearchFilters] = useState<MovieFilters>({});
  const [showFilters, setShowFilters] = useState(false);
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
  
  // Genre-specific data fetching
  const { data: sciFiData, isLoading: sciFiLoading, error: sciFiError } = useSciFiMovies();
  const { data: comedyData, isLoading: comedyLoading, error: comedyError } = useComedyMovies();
  const { data: adventureData, isLoading: adventureLoading, error: adventureError } = useAdventureMovies();
  const { data: crimeData, isLoading: crimeLoading, error: crimeError } = useCrimeMovies();
  const { data: fantasyData, isLoading: fantasyLoading, error: fantasyError } = useFantasyMovies();
  const { data: mysteryData, isLoading: mysteryLoading, error: mysteryError } = useMysteryMovies();
  const { data: dramaData, isLoading: dramaLoading, error: dramaError } = useDramaMovies();
  const { data: horrorData, isLoading: horrorLoading, error: horrorError } = useHorrorMovies();
  const { data: romanceData, isLoading: romanceLoading, error: romanceError } = useRomanceMovies();
  const { data: warData, isLoading: warLoading, error: warError } = useWarMovies();
  const { data: thrillerData, isLoading: thrillerLoading, error: thrillerError } = useThrillerMovies();
  const { data: animationData, isLoading: animationLoading, error: animationError } = useAnimationMovies();

  // Get featured movies for slideshow (first 5 trending movies)
  const featuredMovies = trendingData?.data?.movies?.slice(0, 5);

  const handleSearch = (query: string) => {
    setSearchFilters(prev => ({
      ...prev,
      query_term: query,
      page: 1
    }));
  };

  const handleApplyFilters = (filters: MovieFilters) => {
    setSearchFilters(filters);
    setShowFilters(false);
  };

  const handleMovieClick = (movie: YTSMovie) => {
    // Navigate to movie detail page
    window.location.href = `/movie/${movie.id}`;
  };

  const handlePlayMovie = async (movie: YTSMovie) => {
    try {
      if (!movie.torrents || movie.torrents.length === 0) {
        toast({
          title: "No streams available",
          description: "This movie doesn't have any available torrents for streaming.",
          variant: "destructive"
        });
        return;
      }

      // Select the best quality torrent
      const bestTorrent = movie.torrents.find(t => t.quality === '1080p') || 
                         movie.torrents.find(t => t.quality === '720p') || 
                         movie.torrents[0];

      setSelectedMovie(movie);
      setSelectedTorrent(bestTorrent);

      // Generate magnet link
      const magnet = await generateMagnetLink(bestTorrent.hash, movie.title);
      setMagnetLink(magnet);
      setShowVideoPlayer(true);

      toast({
        title: "Starting stream",
        description: `Loading ${movie.title} in ${bestTorrent.quality}`,
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

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedMovie(null);
    setSelectedTorrent(null);
    setMagnetLink(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-8">
              <Link href="/">
                <h1 className="text-xl sm:text-2xl font-bold text-primary cursor-pointer" data-testid="app-logo">
                  Shoowflix
                </h1>
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="text-foreground hover:text-primary transition-colors" data-testid="nav-home">
                  Home
                </Link>
                <a href="#trending" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-movies">
                  Movies
                </a>
                <a href="#genres" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-genres">
                  Genres
                </a>
                <a href="#top-rated" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-top-rated">
                  Top Rated
                </a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block">
                <SearchBar onSearch={handleSearch} />
              </div>
              <div className="sm:hidden">
                <SearchBar onSearch={handleSearch} placeholder="Search..." className="w-32" />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-secondary rounded-full"
                data-testid="profile-button"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        movies={featuredMovies}
        isLoading={trendingLoading}
        onPlay={handlePlayMovie}
        onMoreInfo={handleMovieClick}
      />

      {/* Movie Sections */}
      <main className="py-8 space-y-12">
        {/* Search Results */}
        {searchFilters.query_term && (
          <MovieSection
            title={`Search Results for "${searchFilters.query_term}"`}
            movies={searchData?.data?.movies}
            isLoading={searchLoading}
            onMovieClick={handleMovieClick}
            error={searchError?.message}
          />
        )}

        {/* Trending Movies */}
        <MovieSection
          title="Trending Now"
          movies={trendingData?.data?.movies}
          isLoading={trendingLoading}
          onMovieClick={handleMovieClick}
          error={trendingError?.message}
        />

        {/* Action Movies */}
        <MovieSection
          title="Action Movies"
          movies={actionData?.data?.movies}
          isLoading={actionLoading}
          onMovieClick={handleMovieClick}
          error={actionError?.message}
        />

        {/* High Rated Movies */}
        <MovieSection
          title="Highest Rated"
          movies={highRatedData?.data?.movies}
          isLoading={highRatedLoading}
          onMovieClick={handleMovieClick}
          error={highRatedError?.message}
        />

        {/* Recent Movies */}
        <MovieSection
          title="Recently Added"
          movies={recentData?.data?.movies}
          isLoading={recentLoading}
          onMovieClick={handleMovieClick}
          error={recentError?.message}
        />

        {/* Genre Sections */}
        <MovieSection
          title="Sci-Fi Movies"
          movies={sciFiData?.data?.movies}
          isLoading={sciFiLoading}
          onMovieClick={handleMovieClick}
          error={sciFiError?.message}
        />

        <MovieSection
          title="Comedy Movies"
          movies={comedyData?.data?.movies}
          isLoading={comedyLoading}
          onMovieClick={handleMovieClick}
          error={comedyError?.message}
        />

        <MovieSection
          title="Adventure Movies"
          movies={adventureData?.data?.movies}
          isLoading={adventureLoading}
          onMovieClick={handleMovieClick}
          error={adventureError?.message}
        />

        <MovieSection
          title="Crime Movies"
          movies={crimeData?.data?.movies}
          isLoading={crimeLoading}
          onMovieClick={handleMovieClick}
          error={crimeError?.message}
        />

        <MovieSection
          title="Fantasy Movies"
          movies={fantasyData?.data?.movies}
          isLoading={fantasyLoading}
          onMovieClick={handleMovieClick}
          error={fantasyError?.message}
        />

        <MovieSection
          title="Mystery Movies"
          movies={mysteryData?.data?.movies}
          isLoading={mysteryLoading}
          onMovieClick={handleMovieClick}
          error={mysteryError?.message}
        />

        <MovieSection
          title="Drama Movies"
          movies={dramaData?.data?.movies}
          isLoading={dramaLoading}
          onMovieClick={handleMovieClick}
          error={dramaError?.message}
        />

        <MovieSection
          title="Horror Movies"
          movies={horrorData?.data?.movies}
          isLoading={horrorLoading}
          onMovieClick={handleMovieClick}
          error={horrorError?.message}
        />

        <MovieSection
          title="Romance Movies"
          movies={romanceData?.data?.movies}
          isLoading={romanceLoading}
          onMovieClick={handleMovieClick}
          error={romanceError?.message}
        />

        <MovieSection
          title="War Movies"
          movies={warData?.data?.movies}
          isLoading={warLoading}
          onMovieClick={handleMovieClick}
          error={warError?.message}
        />

        <MovieSection
          title="Thriller Movies"
          movies={thrillerData?.data?.movies}
          isLoading={thrillerLoading}
          onMovieClick={handleMovieClick}
          error={thrillerError?.message}
        />

        <MovieSection
          title="Animation Movies"
          movies={animationData?.data?.movies}
          isLoading={animationLoading}
          onMovieClick={handleMovieClick}
          error={animationError?.message}
        />
      </main>

      {/* Filter Toggle Button */}
      <Button 
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-primary hover:bg-primary/90 text-primary-foreground p-3 sm:p-4 rounded-full shadow-lg z-40"
        onClick={() => setShowFilters(true)}
        data-testid="filter-toggle-button"
      >
        <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

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
