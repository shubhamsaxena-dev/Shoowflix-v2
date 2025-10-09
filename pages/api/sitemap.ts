import type { NextApiRequest, NextApiResponse } from 'next';
import { sitemapCache, generateSitemap } from '../../lib/sitemap';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const file = req.query.file as string;
  if (!file) return res.status(400).send('Missing file param');

  if (!sitemapCache) await generateSitemap();

  if (!sitemapCache?.chunks[file]) return res.status(404).send('Not found');

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(sitemapCache.chunks[file]);
}
