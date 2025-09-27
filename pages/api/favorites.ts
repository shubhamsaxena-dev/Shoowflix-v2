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
  const { movieId, action } = req.body

  try {
    // ---------------- GET ----------------
    if (req.method === 'GET') {
      const featured = await prisma.userFeaturedMovies.findFirst({ where: { userId } })
      return res.status(200).json({ favorites: featured?.movieIds ?? [] })
    }

    // ---------------- POST ----------------
    if (req.method === 'POST') {
      if (!movieId || !action) {
        return res.status(400).json({ message: 'Movie ID and action required' })
      }

      // Get the existing document (if any)
      const featured = await prisma.userFeaturedMovies.findFirst({ where: { userId } })

      if (action === 'add') {
        if (!featured) {
          // Create new document
          await prisma.userFeaturedMovies.create({
            data: { userId, movieIds: [movieId] },
          })
        } else if (!featured.movieIds.includes(movieId)) {
          // Update existing document using Mongo $push via Prisma
          await prisma.userFeaturedMovies.update({
            where: { id: featured.id },
            data: { movieIds: { push: movieId } },
          })
        }

        return res.status(201).json({ message: 'Movie added to favorites' })
      }

      if (action === 'remove') {
        if (featured && featured.movieIds.includes(movieId)) {
          await prisma.userFeaturedMovies.update({
            where: { id: featured.id },
            data: {
              movieIds: featured.movieIds.filter((id) => id !== movieId),
            },
          })
        }

        return res.status(200).json({ message: 'Movie removed from favorites' })
      }

      return res.status(400).json({ message: 'Invalid action' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Favorites API error:', error.code, error.message, error)
    return res.status(500).json({ message: 'Failed to update favorites' })
  }
}
