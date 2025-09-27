import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeft, User, Heart, LogOut, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import VideoPlayer from '@/components/video-player'
import type { YTSMovie, Torrent } from '@/types/movie'
import FavoriteCard from '@/components/favorite-card'
import { useFavorites } from '@/hooks/use-favorites'


export default function Profile() {
  const { data: session, status } = useSession()
  const { favorites, loading: loadingFavorites } = useFavorites()

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      signIn()
      return
    }

  }, [session, status])




  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Head>
          <title>Profile - Shoowflix</title>
        </Head>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="flex items-center space-x-4 mb-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign in
  }


  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Profile - Shoowflix</title>
        <meta name="description" content="Your Shoowflix profile and favorite movies" />
      </Head>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Movies
              </Button>
            </Link>
          </div>

          <Button
            variant="outline"
            onClick={() => signOut()}
            data-testid="button-signout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* User Profile Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={session.user?.image || ''}
                alt={session.user?.name || 'User'}
              />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2" data-testid="text-username">
                {session.user?.name || 'Movie Fan'}
              </h1>
              <p className="text-muted-foreground mb-4" data-testid="text-email">
                {session.user?.email}
              </p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span data-testid="text-favorites-count">
                  <Heart className="h-4 w-4 inline mr-1" />
                  {favorites.length} Favorites
                </span>
                <span>
                  Member since {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Favorites Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold" data-testid="section-title-favorites">
              My Favorite Movies
            </h2>
          </div>

          {loadingFavorites ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3]">
                  <Skeleton className="h-full w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {favorites.map((id) => (
                <FavoriteCard
                  key={id}
                  movieId={+id}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding movies to your favorites to see them here
              </p>
              <Link href="/">
                <Button data-testid="button-browse-movies">
                  Browse Movies
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </main>


    </div>
  )
}