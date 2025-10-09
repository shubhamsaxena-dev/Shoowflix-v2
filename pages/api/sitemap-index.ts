import type { NextApiRequest, NextApiResponse } from 'next';
import { sitemapCache, generateSitemap } from '../../lib/sitemap';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!sitemapCache) await generateSitemap();

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(sitemapCache?.index || '');
}
