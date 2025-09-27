import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const userId = session.user.id

  if (req.method === 'GET') {
    try {
      const featuredMovies = await prisma.userFeaturedMovies.findUnique({
        where: { userId },
      })

      if (!featuredMovies) {
        return res.json({ favorites: [] })
      }

      return res.json({ favorites: featuredMovies.movieIds })
    } catch (error) {
      console.error('Failed to get favorites:', error)
      return res.status(500).json({ message: 'Failed to get favorites' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { movieId, action } = req.body

      if (!movieId || !action) {
        return res.status(400).json({ message: 'Movie ID and action required' })
      }

      const featuredMovies = await prisma.userFeaturedMovies.findUnique({
        where: { userId },
      })

      if (action === 'add') {
        if (!featuredMovies) {
          // Create if not exists
          await prisma.userFeaturedMovies.create({
            data: {
              userId,
              movieIds: [movieId],
            },
          })
        } else if (!featuredMovies.movieIds.includes(movieId)) {
          // Append if not already present
          await prisma.userFeaturedMovies.update({
            where: { userId },
            data: {
              movieIds: [...featuredMovies.movieIds, movieId],
            },
          })
        }
        return res.status(201).json({ message: 'Movie added to favorites' })
      }

      if (action === 'remove') {
        if (featuredMovies) {
          await prisma.userFeaturedMovies.update({
            where: { userId },
            data: {
              movieIds: featuredMovies.movieIds.filter((id) => id !== movieId),
            },
          })
        }
        return res.status(200).json({ message: 'Movie removed from favorites' })
      }

      return res.status(400).json({ message: 'Invalid action' })
    } catch (error) {
      console.error('Failed to update favorites:', error)
      return res.status(500).json({ message: 'Failed to update favorites' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
