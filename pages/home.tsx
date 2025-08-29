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
  useAnimationMovies,
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
  
  // Genre-specific movie data
  const { movies: sciFiMovies, isLoading: sciFiLoading } = useSciFiMovies();
  const { movies: comedyMovies, isLoading: comedyLoading } = useComedyMovies();
  const { movies: adventureMovies, isLoading: adventureLoading } = useAdventureMovies();
  const { movies: crimeMovies, isLoading: crimeLoading } = useCrimeMovies();
  const { movies: fantasyMovies, isLoading: fantasyLoading } = useFantasyMovies();
  const { movies: mysteryMovies, isLoading: mysteryLoading } = useMysteryMovies();
  const { movies: dramaMovies, isLoading: dramaLoading } = useDramaMovies();
  const { movies: horrorMovies, isLoading: horrorLoading } = useHorrorMovies();
  const { movies: romanceMovies, isLoading: romanceLoading } = useRomanceMovies();
  const { movies: warMovies, isLoading: warLoading } = useWarMovies();
  const { movies: thrillerMovies, isLoading: thrillerLoading } = useThrillerMovies();
  const { movies: animationMovies, isLoading: animationLoading } = useAnimationMovies();

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
    // This is handled by the MovieCard component now
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

        <MovieSection
          title="Sci-Fi Movies"
          movies={sciFiMovies || []}
          isLoading={sciFiLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/sci-fi"
          genre="sci-fi"
        />

        <MovieSection
          title="Comedy Movies"
          movies={comedyMovies || []}
          isLoading={comedyLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/comedy"
          genre="comedy"
        />

        <MovieSection
          title="Adventure Movies"
          movies={adventureMovies || []}
          isLoading={adventureLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/adventure"
          genre="adventure"
        />

        <MovieSection
          title="Crime Movies"
          movies={crimeMovies || []}
          isLoading={crimeLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/crime"
          genre="crime"
        />

        <MovieSection
          title="Fantasy Movies"
          movies={fantasyMovies || []}
          isLoading={fantasyLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/fantasy"
          genre="fantasy"
        />

        <MovieSection
          title="Mystery Movies"
          movies={mysteryMovies || []}
          isLoading={mysteryLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/mystery"
          genre="mystery"
        />

        <MovieSection
          title="Drama Movies"
          movies={dramaMovies || []}
          isLoading={dramaLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/drama"
          genre="drama"
        />

        <MovieSection
          title="Horror Movies"
          movies={horrorMovies || []}
          isLoading={horrorLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/horror"
          genre="horror"
        />

        <MovieSection
          title="Romance Movies"
          movies={romanceMovies || []}
          isLoading={romanceLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/romance"
          genre="romance"
        />

        <MovieSection
          title="War Movies"
          movies={warMovies || []}
          isLoading={warLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/war"
          genre="war"
        />

        <MovieSection
          title="Thriller Movies"
          movies={thrillerMovies || []}
          isLoading={thrillerLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/thriller"
          genre="thriller"
        />

        <MovieSection
          title="Animation Movies"
          movies={animationMovies || []}
          isLoading={animationLoading}
          onPlayMovie={handlePlayMovie}
          showViewAll={true}
          viewAllLink="/genre/animation"
          genre="animation"
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