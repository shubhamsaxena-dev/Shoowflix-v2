import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfiniteScrollMovies } from "@/components/infinite-scroll-movies";
import { 
  useTrendingMovies, 
  useActionMovies, 
  useHighRatedMovies, 
  useRecentMovies
} from "@/hooks/use-movies";
import type { YTSMovie, Torrent } from "@shared/schema";
import type { MovieFilters } from "@/lib/types";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<MovieFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("trending");

  // Data fetching with SWR
  const { movies: trendingMovies, isLoading: trendingLoading, error: trendingError } = useTrendingMovies();
  const { movies: actionMovies, isLoading: actionLoading, error: actionError } = useActionMovies();
  const { movies: highRatedMovies, isLoading: highRatedLoading, error: highRatedError } = useHighRatedMovies();
  const { movies: recentMovies, isLoading: recentLoading, error: recentError } = useRecentMovies();

  // Get featured movies for slideshow (first 5 trending movies)
  const featuredMovies = trendingMovies?.slice(0, 5);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setActiveSection("search");
    } else {
      setActiveSection("trending");
    }
  };

  const sections = [
    { id: "trending", label: "Trending", movies: trendingMovies, loading: trendingLoading },
    { id: "action", label: "Action", movies: actionMovies, loading: actionLoading },
    { id: "high-rated", label: "High Rated", movies: highRatedMovies, loading: highRatedLoading },
    { id: "recent", label: "Recent", movies: recentMovies, loading: recentLoading },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-red-600">Shoowflix</h1>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                data-testid="input-search"
              />
            </div>

            {/* Filter Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-700 text-white hover:bg-gray-800"
              data-testid="button-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Featured Movies */}
      {featuredMovies && featuredMovies.length > 0 && activeSection === "trending" && (
        <section className="relative h-96 overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${featuredMovies[0]?.large_cover_image})`,
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute bottom-8 left-8 z-10">
              <h2 className="text-4xl font-bold mb-2">{featuredMovies[0]?.title}</h2>
              <p className="text-lg text-gray-200 mb-4 max-w-2xl">
                {featuredMovies[0]?.summary?.slice(0, 200)}...
              </p>
              <div className="flex gap-4">
                <Button className="bg-red-600 hover:bg-red-700" data-testid="button-watch-now">
                  Watch Now
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10" data-testid="button-more-info">
                  More Info
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-800 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeSection === section.id
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                data-testid={`tab-${section.id}`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeSection === "search" && searchQuery ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Search Results for "{searchQuery}"</h2>
            <InfiniteScrollMovies 
              filters={{ query_term: searchQuery, ...searchFilters }}
            />
          </div>
        ) : (
          <div>
            {sections.map((section) => (
              <div
                key={section.id}
                className={activeSection === section.id ? "block" : "hidden"}
              >
                <h2 className="text-2xl font-bold mb-6 capitalize">{section.label} Movies</h2>
                <InfiniteScrollMovies 
                  filters={
                    section.id === "trending" ? { sort_by: 'download_count', order_by: 'desc' } :
                    section.id === "action" ? { genre: 'action', sort_by: 'rating', order_by: 'desc' } :
                    section.id === "high-rated" ? { minimum_rating: 8, sort_by: 'rating', order_by: 'desc' } :
                    section.id === "recent" ? { sort_by: 'date_added', order_by: 'desc' } :
                    {}
                  }
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}