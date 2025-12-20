import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { User, Heart, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { YTSMovie } from "@/types/movie";
import { useFavorites } from "@/hooks/use-favorites";
import { useMovieDetails } from "@/hooks/use-movies";
import { useRouter } from "next/router";
const FavList = ({ movieId, handleMovieClick }: any) => {
  const { data: movieData, isLoading: movieLoading } = useMovieDetails(movieId);
  const movie = movieData?.data?.movie as YTSMovie;
  if (movieLoading) return null;
  return (
    <div
      key={movieId}
      className="flex items-center space-x-3 p-2 hover:bg-accent rounded cursor-pointer transition-colors"
      onClick={() => handleMovieClick(movie)}
      data-testid={`dropdown-favorite-${movieId}`}
    >
      <div className="relative h-12 w-8 flex-shrink-0">
        <Image
          src={movie.small_cover_image || "/placeholder-movie.jpg"}
          alt={movie.title}
          fill
          className="object-cover rounded"
          sizes="32px"
          quality={75}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder-movie.jpg";
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{movie.title}</div>
        <div className="text-xs text-muted-foreground">
          {movie.year} • {movie.rating}⭐
        </div>
      </div>
    </div>
  );
};
export default function UserProfileDropdown() {
  const { data: session } = useSession();
  const { favorites, loading: loadingFavorites } = useFavorites();
  const router = useRouter();
  const handleMovieClick = (movie: YTSMovie) => {
    const movieSlug = movie.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    router.push(`/movie/${movie.id}/${movieSlug}`);
  };

  if (!session) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 hover:bg-accent"
          data-testid="user-profile-dropdown-trigger"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={session.user?.image || ""}
              alt={session.user?.name || "User"}
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium">
              {session.user?.name || "User"}
            </span>
            <span className="text-xs text-muted-foreground">
              {session.user?.email}
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 p-0"
        align="end"
        data-testid="user-profile-dropdown-content"
      >
        {/* User Info Header */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={session.user?.image || ""}
                alt={session.user?.name || "User"}
              />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold" data-testid="dropdown-user-name">
                {session.user?.name || "User"}
              </div>
              <div
                className="text-sm text-muted-foreground"
                data-testid="dropdown-user-email"
              >
                {session.user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Movies Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              <span className="font-medium text-sm">Favorite Movies</span>
            </div>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                data-testid="dropdown-view-all-favorites"
              >
                View All
              </Button>
            </Link>
          </div>

          {loadingFavorites ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-8 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {favorites.slice(0, 5).map((favorite) => (
                <FavList
                  movieId={favorite}
                  handleMovieClick={handleMovieClick}
                />
              ))}
              {favorites.length > 5 && (
                <div className="text-center pt-2">
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      data-testid="dropdown-see-more-favorites"
                    >
                      +{favorites.length - 5} more
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No favorite movies yet
              </p>
              <p className="text-xs text-muted-foreground">
                Add movies to your favorites to see them here
              </p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        <div className="p-2">
          <DropdownMenuItem asChild>
            <Link href="/profile" className="w-full">
              <User className="h-4 w-4 mr-2" />
              View Full Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut()}
            className="text-red-600 focus:text-red-600"
            data-testid="dropdown-sign-out"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
