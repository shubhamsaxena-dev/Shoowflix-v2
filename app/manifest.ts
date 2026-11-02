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
      { src: "/brand/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/brand/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/brand/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      { src: "/brand/maskable-192.png", type: "image/png", sizes: "192x192", purpose: "maskable" },
      { src: "/brand/maskable-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/brand/screenshot-wide.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "Browse trending films" },
      { src: "/brand/screenshot-narrow.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Shoowflix on your phone" },
    ],
    shortcuts: [
      { name: "Browse", url: "/browse", icons: [{ src: "/brand/icon-96.png", sizes: "96x96" }] },
      { name: "My List", url: "/my-list", icons: [{ src: "/brand/icon-96.png", sizes: "96x96" }] },
    ],
  };
}
