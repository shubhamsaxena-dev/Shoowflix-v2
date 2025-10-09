import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const SITE_URL = 'https://shoowflix.com';
const MOVIES_API = `${SITE_URL}/api/movies`;
const LIMIT = 500; // number of movies per API call
const SITEMAP_CHUNK_SIZE = 45000; // max URLs per sitemap

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Protect with CRON_SECRET
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const urls: string[] = [];
    let page = 1;
    let hasMore = true;

    // Fetch all movies paginated
    while (hasMore) {
      const response = await fetch(`${MOVIES_API}?page=${page}&limit=${LIMIT}`);
      const data = await response.json();
      const movies = data.data?.movies || [];

      if (!movies.length) break;

      movies.forEach((m: any) => urls.push(`${SITE_URL}/movie/${m.id}`));

      // Stop if fewer than LIMIT returned
      if (movies.length < LIMIT) hasMore = false;
      page++;
    }

    const sitemapDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(sitemapDir)) fs.mkdirSync(sitemapDir);

    // Split sitemaps if too large
    const sitemapFiles: string[] = [];
    for (let i = 0; i < urls.length; i += SITEMAP_CHUNK_SIZE) {
      const chunk = urls.slice(i, i + SITEMAP_CHUNK_SIZE);
      const fileName = `sitemap-movies-${Math.floor(i / SITEMAP_CHUNK_SIZE) + 1}.xml`;
      const filePath = path.join(sitemapDir, fileName);

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunk.map(u => `<url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`).join('')}
</urlset>`;

      fs.writeFileSync(filePath, xml);
      sitemapFiles.push(`${SITE_URL}/${fileName}`);
    }

    // Generate sitemap index
    const indexXML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(f => `<sitemap><loc>${f}</loc></sitemap>`).join('')}
</sitemapindex>`;

    fs.writeFileSync(path.join(sitemapDir, 'sitemap-index.xml'), indexXML);

    console.log(`✅ Generated ${sitemapFiles.length} sitemap files with ${urls.length} movie URLs`);

    res.status(200).json({ success: true, totalMovies: urls.length, sitemaps: sitemapFiles });
  } catch (err) {
    console.error('❌ Error generating sitemap:', err);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
