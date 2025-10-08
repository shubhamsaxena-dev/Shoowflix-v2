import MovieSection from "./movie-section";
import { useMoviesByGenre } from "@/hooks/use-movies";
import type { YTSMovie } from "@/types/movie";
import { useRouter } from "next/router";

interface MoviesListProps {
  genre: string;
  onMovieClick: (movie: YTSMovie) => void;
}

export default function MoviesList({ genre, onMovieClick }: MoviesListProps) {
  const router=useRouter()
  const { data, isLoading, error } = useMoviesByGenre(genre);

  const handleViewAll = () => {
    router.push(`/genre/${genre.toLowerCase().replace(/\s+/g, '-')}`)

  };

  return (
    <MovieSection
      title={`${genre} Movies`}
      movies={data?.data?.movies}
      isLoading={isLoading}
      onMovieClick={onMovieClick}
      onViewAll={handleViewAll}
      error={error?.message}
    />
  );
}