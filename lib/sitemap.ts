const SITE_URL = 'https://shoowflix.com';
const MOVIES_API = `${SITE_URL}/api/movies`;
const LIMIT = 500;
const SITEMAP_CHUNK_SIZE = 45000;

// In-memory cache
export let sitemapCache: { index: string; chunks: Record<string, string> } | null = null;

export async function generateSitemap() {
  const urls: string[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const r = await fetch(`${MOVIES_API}?page=${page}&limit=${LIMIT}`);
    const data = await r.json();
    const movies = data.data?.movies || [];
    if (!movies.length) break;

    movies.forEach((m: any) => {
      const movieSlug = m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim();
      urls.push(`${SITE_URL}/movie/${m.id}/${movieSlug}`)
    });

    if (movies.length < LIMIT) hasMore = false;
    page++;
  }

  const chunks: Record<string, string> = {};
  const sitemapFiles: string[] = [];

  for (let i = 0; i < urls.length; i += SITEMAP_CHUNK_SIZE) {
    const chunkUrls = urls.slice(i, i + SITEMAP_CHUNK_SIZE);
    const fileName = `sitemap-movies-${Math.floor(i / SITEMAP_CHUNK_SIZE) + 1}.xml`;
    chunks[fileName] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunkUrls.map(u => `<url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`).join('')}
</urlset>`;
    sitemapFiles.push(fileName);
  }

  const indexXML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(f => `<sitemap><loc>${SITE_URL}/api/sitemap?file=${f}</loc></sitemap>`).join('')}
</sitemapindex>`;

  sitemapCache = { index: indexXML, chunks };
  return sitemapCache;
}
