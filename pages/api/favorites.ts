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

  // ---------------- GET Favorites ----------------
  if (req.method === 'GET') {
    try {
      const featuredMovies = await prisma.userFeaturedMovies.findUnique({
        where: { userId },
      })

      return res.status(200).json({ favorites: featuredMovies?.movieIds ?? [] })
    } catch (error: any) {
      console.error('Failed to get favorites:', error)
      return res.status(500).json({ message: 'Failed to get favorites' })
    }
  }

  // ---------------- POST Add/Remove Favorites ----------------
  if (req.method === 'POST') {
    const { movieId, action } = req.body

    if (!movieId || !action) {
      return res.status(400).json({ message: 'Movie ID and action required' })
    }

    try {
      if (action === 'add') {
        // Upsert: create if missing, push movieId if exists
        await prisma.userFeaturedMovies.upsert({
          where: { userId },
          update: { movieIds: { push: movieId } },
          create: { userId, movieIds: [movieId] },
        })

        return res.status(201).json({ message: 'Movie added to favorites' })
      }

      if (action === 'remove') {
        // Find existing movies
        const featured = await prisma.userFeaturedMovies.findUnique({ where: { userId } })
        if (featured) {
          await prisma.userFeaturedMovies.update({
            where: { userId },
            data: {
              movieIds: featured.movieIds.filter((id) => id !== movieId),
            },
          })
        }

        return res.status(200).json({ message: 'Movie removed from favorites' })
      }

      return res.status(400).json({ message: 'Invalid action' })
    } catch (error: any) {
      console.error('Failed to update favorites:', error.code, error.message)
      return res.status(500).json({ message: 'Failed to update favorites' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
