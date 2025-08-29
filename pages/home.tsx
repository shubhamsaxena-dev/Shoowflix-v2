import { useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/search-bar";
import HeroSection from "@/components/hero-section";
import MovieSection from "@/components/movie-section";
import VideoPlayer from "@/components/video-player";
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

  const handleMovieClick = (movie: YTSMovie) => {
    // Navigate to movie detail page
    const movieSlug = movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    window.location.href = `/movie/${movie.id}/${movieSlug}`;
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
            </div>
            
            <div className="flex items-center space-x-4">
              <SearchBar onSearch={handleSearch} />
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
          movies={trendingMovies}
          isLoading={trendingLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/trending"}
        />

        <MovieSection
          title="Action Movies"
          movies={actionMovies}
          isLoading={actionLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/action"}
        />

        <MovieSection
          title="High Rated Movies"
          movies={highRatedMovies}
          isLoading={highRatedLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/high-rated"}
        />

        <MovieSection
          title="Recently Added"
          movies={recentMovies}
          isLoading={recentLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/recent"}
        />

        <MovieSection
          title="Sci-Fi Movies"
          movies={sciFiMovies}
          isLoading={sciFiLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/sci-fi"}
        />

        <MovieSection
          title="Comedy Movies"
          movies={comedyMovies}
          isLoading={comedyLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/comedy"}
        />

        <MovieSection
          title="Adventure Movies"
          movies={adventureMovies}
          isLoading={adventureLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/adventure"}
        />

        <MovieSection
          title="Crime Movies"
          movies={crimeMovies}
          isLoading={crimeLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/crime"}
        />

        <MovieSection
          title="Fantasy Movies"
          movies={fantasyMovies}
          isLoading={fantasyLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/fantasy"}
        />

        <MovieSection
          title="Mystery Movies"
          movies={mysteryMovies}
          isLoading={mysteryLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/mystery"}
        />

        <MovieSection
          title="Drama Movies"
          movies={dramaMovies}
          isLoading={dramaLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/drama"}
        />

        <MovieSection
          title="Horror Movies"
          movies={horrorMovies}
          isLoading={horrorLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/horror"}
        />

        <MovieSection
          title="Romance Movies"
          movies={romanceMovies}
          isLoading={romanceLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/romance"}
        />

        <MovieSection
          title="War Movies"
          movies={warMovies}
          isLoading={warLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/war"}
        />

        <MovieSection
          title="Thriller Movies"
          movies={thrillerMovies}
          isLoading={thrillerLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/thriller"}
        />

        <MovieSection
          title="Animation Movies"
          movies={animationMovies}
          isLoading={animationLoading}
          onMovieClick={handleMovieClick}
          onViewAll={() => window.location.href = "/genre/animation"}
        />
      </main>

      {/* Overlays and Modals */}
      {showSearchOverlay && (
        <SearchOverlay
          isOpen={showSearchOverlay}
          onClose={() => setShowSearchOverlay(false)}
          onMovieClick={handleMovieClick}
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
    </div>
  );
}