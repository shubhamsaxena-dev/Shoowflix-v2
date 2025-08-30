import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'

// Simple in-memory storage for favorites (for demo purposes)
// In production, this would be stored in a database
const userFavorites: Record<string, string[]> = {}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, {})
  
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const userId = session.user.id

  if (req.method === 'GET') {
    try {
      const movieIds = userFavorites[userId] || []
      
      if (!movieIds.length) {
        return res.json({ favorites: [] })
      }

      // Fetch movie details for each favorite
      const favorites = []
      for (const movieId of movieIds) {
        try {
          const movieResponse = await fetch(`http://localhost:5000/api/movies/${movieId}`)
          if (movieResponse.ok) {
            const movieData = await movieResponse.json()
            favorites.push({
              id: `fav-${movieId}`,
              movieId,
              movieData: movieData.data.movie,
              createdAt: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error(`Failed to fetch movie ${movieId}:`, error)
        }
      }

      res.json({ favorites })
    } catch (error) {
      console.error('Failed to get favorites:', error)
      res.status(500).json({ message: 'Failed to get favorites' })
    }
  } else if (req.method === 'POST') {
    try {
      const { movieId, action } = req.body

      if (!movieId || !action) {
        return res.status(400).json({ message: 'Movie ID and action required' })
      }

      // Get current favorites for user
      const currentFavorites = userFavorites[userId] || []

      if (action === 'add') {
        // Add to favorites if not already there
        if (!currentFavorites.includes(movieId.toString())) {
          userFavorites[userId] = [...currentFavorites, movieId.toString()]
        }
      } else if (action === 'remove') {
        // Remove from favorites
        userFavorites[userId] = currentFavorites.filter(id => id !== movieId.toString())
      }

      res.json({ success: true, favorites: userFavorites[userId] || [] })
    } catch (error) {
      console.error('Failed to update favorites:', error)
      res.status(500).json({ message: 'Failed to update favorites' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}