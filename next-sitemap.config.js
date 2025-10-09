import { userAgent } from 'next/server';

/** @type {import('next-sitemap').IConfig} */
const SITE_URL = 'https://shoowflix.com'
const config = {

  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  sitemapSize: 5000, // maximum URLs per sitemap file
  changefreq: 'daily',
  priority: 0.7,

  // Point robots.txt to our dynamic sitemap index
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', allow: '/genre' },
      {
        userAgent: '*', allow: '/movie'
      },
      { userAgent: '*', disallow: '/api/generate-sitemap' },
      { userAgent: '*', disallow: '/api/admin' },
      { userAgent: '*', disallow: '/api/auth' },
    ],
    additionalSitemaps: [`${SITE_URL}/api/sitemap-index`],
  },

};

export default config;
