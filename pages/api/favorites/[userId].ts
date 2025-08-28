import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from "@/lib/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    try {
      const favorites = await storage.getUserFavorites(userId as string);
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}