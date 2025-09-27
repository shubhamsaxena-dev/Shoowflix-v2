import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' })

    const userId = session.user.id

    if (req.method === 'GET') {
      // Get user's favorite movies
      const featured = await prisma.userFeaturedMovies.findUnique({ where: { userId } })
      return res.status(200).json({ favorites: featured ?? [] })
    }

    if (req.method === 'POST') {
      const { movieId, action } = req.body
      if (!movieId || !action) return res.status(400).json({ message: 'Movie ID and action required' })

      // Convert to string (MongoDB schema expects String[])
      const movieIdStr = movieId.toString()

      if (action === 'add') {
        // Upsert: create if not exists, otherwise update
        const existing = await prisma.userFeaturedMovies.findUnique({ where: { userId } })

        if (!existing) {
          await prisma.userFeaturedMovies.create({
            data: { userId, movieIds: [movieIdStr] },
          })
        } else {
          // Prevent duplicates
          const updatedMovieIds = Array.from(new Set([...existing.movieIds, movieIdStr]))
          await prisma.userFeaturedMovies.update({
            where: { userId },
            data: { movieIds: updatedMovieIds },
          })
        }

        return res.status(201).json({ message: 'Movie added to favorites' })
      }

      if (action === 'remove') {
        const existing = await prisma.userFeaturedMovies.findUnique({ where: { userId } })
        if (existing && existing.movieIds.includes(movieIdStr)) {
          await prisma.userFeaturedMovies.update({
            where: { userId },
            data: {
              movieIds: existing.movieIds.filter((id) => id !== movieIdStr),
            },
          })
        }
        return res.status(200).json({ message: 'Movie removed from favorites' })
      }

      return res.status(400).json({ message: 'Invalid action' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Favorites API error:', error)
    return res.status(500).json({ message: 'Failed to update favorites', error: error.message })
  }
}
