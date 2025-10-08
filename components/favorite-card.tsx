import { useMovieDetails } from "@/hooks/use-movies";
import MovieCard from "./movie-card";
import { YTSMovie } from "@/types/movie";
import { Skeleton } from "./ui/skeleton";
import { useState } from "react";
import { useRouter } from "next/router";
export interface FavoriteCardProps {
    movieId: number
}
const FavoriteCard = ({ movieId }: FavoriteCardProps) => {
  const router=useRouter()
    const [loadingMovieId,setLoadingMovieId]=useState(false)
    const { data: movieData, isLoading: movieLoading,  } = useMovieDetails(movieId);
    const movie = movieData?.data?.movie as YTSMovie;

     const handleMovieClick = (movie: YTSMovie) => {
        // Set loading state for this movie
        setLoadingMovieId(true);
        
        // Navigate to movie detail page with proper router
        const movieSlug = movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim();
        
        // Use timeout to show loading state briefly before navigation
        setTimeout(() => {
              router.push(`/movie/${movie.id}/${movieSlug}`)

        }, 150);
      };

    if(movieLoading) return <Skeleton className="h-full w-full rounded-lg" />

    return <MovieCard movie={movie} onClick={handleMovieClick} isLoading={loadingMovieId}></MovieCard>



}

export default FavoriteCard