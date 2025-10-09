import type { NextApiRequest, NextApiResponse } from 'next';
import sitemapIndex from './sitemap-index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  const file = req.query.file as string;
  if (!file) return res.status(400).send('Missing file param');

  const cache = (sitemapIndex as any).sitemapCache;
  if (!cache || !cache.chunks[file]) return res.status(404).send('Not found');

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(cache.chunks[file]);
}
