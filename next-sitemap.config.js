/** @type {import('next-sitemap').IConfig} */
const fetch = require('node-fetch');

module.exports = {
  siteUrl: 'https://shoowflix.com', // your domain
  generateRobotsTxt: true,          // creates robots.txt automatically
  sitemapSize: 5000,                // split sitemap if >5000 URLs
  changefreq: 'daily',
  priority: 0.7,

  // Customize sitemap entries
  transform: async (config, path) => {
    if (path.startsWith('/movie/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.9,
      };
    }
    return {
      loc: path,
      changefreq: 'daily',
      priority: 0.7,
    };
  },

  // Fetch dynamic movie pages
  additionalPaths: async (config) => {
    try {
      const allMovies = [];
      const limit = 100; // fetch 100 movies per request
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(`https://shoowflix.com/api/movies?page=${page}&limit=${limit}`);
        const data = await res.json();
        const movies = data.data?.movies || [];

        if (movies.length === 0) {
          hasMore = false;
          break;
        }

        allMovies.push(...movies);
        page++;
      }

      return allMovies.map((movie) => ({
        loc: `/movie/${movie.id}`, // or movie.slug
        changefreq: 'weekly',
        priority: 0.9,
      }));
    } catch (err) {
      console.error('Error generating sitemap:', err);
      return [];
    }
  },
};
