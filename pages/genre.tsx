import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Filter, Search } from "lucide-react";
import { InfiniteScrollMovies } from "@/components/infinite-scroll-movies";
import type { MovieFilters } from "@/lib/types";
import Head from "next/head";

const qualityOptions = [
  { value: "all", label: "All Quality" },
  { value: "2160p", label: "4K (2160p)" },
  { value: "1080p", label: "HD (1080p)" },
  { value: "720p", label: "HD (720p)" },
  { value: "480p", label: "SD (480p)" },
];

const sortOptions = [
  { value: "date_added", label: "Latest" },
  { value: "rating", label: "Rating" },
  { value: "year", label: "Year" },
  { value: "title", label: "Title" },
  { value: "download_count", label: "Downloads" },
];

const ratingOptions = [
  { value: "0", label: "All Ratings" },
  { value: "9", label: "9+ Stars" },
  { value: "8", label: "8+ Stars" },
  { value: "7", label: "7+ Stars" },
  { value: "6", label: "6+ Stars" },
];

export default function GenrePage() {
  const router = useRouter();
  const { genre = "" } = router.query as { genre?: string };

  // Filters
  const [quality, setQuality] = useState("all");
  const [sortBy, setSortBy] = useState("date_added");
  const [minRating, setMinRating] = useState("0");
  const [searchQuery, setSearchQuery] = useState("");

  const genreTitle = genre;

  const goBack = () => {
    router.back();
  };

  // Build filters object for InfiniteScrollMovies
  let filters: MovieFilters = {
    genre: genreTitle,
    quality: quality !== "all" ? quality : undefined,
    sort_by: sortBy,
    minimum_rating: minRating !== "0" ? minRating : undefined,
    query_term: searchQuery || undefined,
  } as any;

  if (genreTitle.includes("rated")) {
    filters = { limit: 20, order_by: "desc", sort_by: "rating" };
  } else if (genreTitle.includes("recent")) {
    filters = { limit: 20, order_by: "desc", sort_by: "year" };
  }

  return (
    <>
      <Head>
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
      </Head>
      <div className="min-h-screen bg-background pt-20">
        {/* Header */}
        <div className="container mx-auto px-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="flex items-center gap-2 self-start"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {genreTitle} Movies
            </h1>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:mb-8">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search ${genreTitle} movies...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                data-testid="genre-search-input"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  {qualityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {(quality !== "all" ||
                sortBy !== "date_added" ||
                minRating !== "0" ||
                searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuality("all");
                    setSortBy("date_added");
                    setMinRating("0");
                    setSearchQuery("");
                  }}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Movies Grid with Infinite Scroll */}
        <div className="container mx-auto px-4">
          <InfiniteScrollMovies filters={filters} />
        </div>
      </div>
    </>
  );
}
