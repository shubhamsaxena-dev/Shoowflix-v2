import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/movie-utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/profile", "/my-list", "/watch"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
