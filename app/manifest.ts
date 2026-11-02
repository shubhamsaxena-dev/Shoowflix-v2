import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Shoowflix",
    short_name: "Shoowflix",
    description: "Stream films in HD. Discover new releases, trending picks and timeless classics across every genre.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "any",
    theme_color: "#12152b",
    background_color: "#12152b",
    categories: ["entertainment", "video"],
    icons: [
      { src: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/icons/icon-512x512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      { src: "/web-app-manifest-192x192.png", type: "image/png", sizes: "192x192", purpose: "maskable" },
      { src: "/web-app-manifest-512x512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshots/desktop.png", sizes: "866x545", type: "image/png", form_factor: "wide", label: "Browse the catalog" },
      { src: "/screenshots/mobile.png", sizes: "356x760", type: "image/png", form_factor: "narrow", label: "Shoowflix on mobile" },
    ],
    shortcuts: [
      { name: "Browse", url: "/browse" },
      { name: "My List", url: "/my-list" },
    ],
  };
}
