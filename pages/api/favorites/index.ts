import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from "@/lib/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { userId, movieId } = req.body;
      
      if (!userId || !movieId) {
        return res.status(400).json({ error: 'userId and movieId are required' });
      }

      const favorite = await storage.addUserFavorite({ userId, movieId });
      res.json(favorite);
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ error: 'Failed to add favorite' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}