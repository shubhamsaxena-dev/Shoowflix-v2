import { useState } from "react";
import { Filter, User } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  useSearchMoviesInfinite,
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
  const [searchFilters, setSearchFilters] = useState<MovieFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<YTSMovie | null>(null);
  const [selectedTorrent, setSelectedTorrent] = useState<Torrent | null>(null);
  const [magnetLink, setMagnetLink] = useState<string | null>(null);

  // Data fetching with SWR
  const { movies: trendingMovies, isLoading: trendingLoading, error: trendingError } = useTrendingMovies();
  const { movies: actionMovies, isLoading: actionLoading, error: actionError } = useActionMovies();
  const { movies: highRatedMovies, isLoading: highRatedLoading, error: highRatedError } = useHighRatedMovies();
  const { movies: recentMovies, isLoading: recentLoading, error: recentError } = useRecentMovies();

  // Get featured movies for slideshow (first 5 trending movies)
  const featuredMovies = trendingMovies?.slice(0, 5);

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
    // Navigate to movie detail page or show movie info
    console.log('Movie clicked:', movie.title);
  };

  const handlePlayMovie = async (movie: YTSMovie, torrent: Torrent) => {
    try {
      setSelectedMovie(movie);
      setSelectedTorrent(torrent);
      
      // Generate magnet link
      const magnet = await generateMagnetLink(movie, torrent);
      setMagnetLink(magnet);
      setShowVideoPlayer(true);
    } catch (error) {
      console.error('Error generating magnet link:', error);
    }
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedMovie(null);
    setSelectedTorrent(null);
    setMagnetLink(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-all duration-300">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary">Shoowflix</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#home" className="text-foreground hover:text-primary transition-colors">Home</a>
                <a href="#movies" className="text-muted-foreground hover:text-primary transition-colors">Movies</a>
                <a href="#genres" className="text-muted-foreground hover:text-primary transition-colors">Genres</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <SearchBar onSearch={handleSearch} onSearchClick={handleSearchClick} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-filters"
              >
                <Filter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-profile">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {featuredMovies && featuredMovies.length > 0 && (
        <HeroSection movies={featuredMovies} onPlayMovie={handlePlayMovie} />
      )}

      {/* Movie Sections */}
      <main className="relative z-10 -mt-32 space-y-12 pb-20">
        <MovieSection
          title="Trending Now"
          movies={trendingMovies || []}
          isLoading={trendingLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/trending"
        />

        <MovieSection
          title="Action Movies"
          movies={actionMovies || []}
          isLoading={actionLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/action"
          genre="action"
        />

        <MovieSection
          title="High Rated Movies"
          movies={highRatedMovies || []}
          isLoading={highRatedLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/high-rated"
        />

        <MovieSection
          title="Recently Added"
          movies={recentMovies || []}
          isLoading={recentLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/recent"
        />
      </main>

      {/* Overlays and Modals */}
      {showFilters && (
        <FilterPanel
          onApplyFilters={handleApplyFilters}
          onClose={() => setShowFilters(false)}
          genres={genres}
        />
      )}

      {showSearchOverlay && (
        <SearchOverlay
          onClose={() => setShowSearchOverlay(false)}
          onMovieClick={handleMovieClick}
          onPlayMovie={handlePlayMovie}
        />
      )}

      {showVideoPlayer && selectedMovie && magnetLink && (
        <VideoPlayer
          movie={selectedMovie}
          magnetLink={magnetLink}
          onClose={handleCloseVideoPlayer}
        />
      )}
    </div>
  );
}