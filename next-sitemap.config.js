import fetch from 'node-fetch';

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: 'https://shoowflix.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,

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
   robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
    ],
    additionalSitemaps: [
      'https://shoowflix.com/sitemap-index.xml',  // point robots.txt to your generated sitemap
    ],
  },
};

export default config;
