import MovieSection from "./movie-section";
import { useMoviesByGenre } from "@/hooks/use-movies";
import type { YTSMovie } from "@shared/schema";

interface MoviesListProps {
  genre: string;
  onMovieClick: (movie: YTSMovie) => void;
}

export default function MoviesList({ genre, onMovieClick }: MoviesListProps) {
  const { data, isLoading, error } = useMoviesByGenre(genre);

  return (
    <MovieSection
      title={`${genre} Movies`}
      movies={data?.data?.movies}
      isLoading={isLoading}
      onMovieClick={onMovieClick}
      error={error?.message}
    />
  );
}