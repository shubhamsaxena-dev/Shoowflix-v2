import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useFavorites() {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Load favorites on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadFavorites()
    }
  }, [session])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        const movieIds = data.favorites.map((fav: any) => fav.movieId)
        setFavorites(movieIds)
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToFavorites = async (movieId: number) => {
    if (!session?.user?.id) return false

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, action: 'add' })
      })

      if (response.ok) {
        setFavorites(prev => [...prev, movieId.toString()])
        return true
      }
    } catch (error) {
      console.error('Failed to add favorite:', error)
    }
    return false
  }

  const removeFromFavorites = async (movieId: number) => {
    if (!session?.user?.id) return false

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, action: 'remove' })
      })

      if (response.ok) {
        setFavorites(prev => prev.filter(id => id !== movieId.toString()))
        return true
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
    return false
  }

  const isFavorite = (movieId: number) => {
    return favorites.includes(movieId.toString())
  }

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    loadFavorites
  }
}