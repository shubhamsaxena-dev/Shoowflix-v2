import type { NextApiRequest, NextApiResponse } from 'next';
import { generateSitemap } from '../../lib/sitemap';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const cache = await generateSitemap();
    res.status(200).json({ success: true, totalSitemaps: Object.keys(cache.chunks).length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
