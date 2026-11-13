import type { Metadata, Viewport } from "next";
import { Archivo, Big_Shoulders } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";
import { MobileTabBar } from "@/components/shell/mobile-tab-bar";
import { SwRegister } from "@/components/perf/sw-register";
import { PlayerWarmup } from "@/components/perf/player-warmup";
import { SITE_NAME, SITE_URL } from "@/lib/movie-utils";
import "@/styles/globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  variable: "--font-big-shoulders",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Stream films instantly`, template: `%s · ${SITE_NAME}` },
  description:
    "Stream films in HD with Shoowflix. Discover new releases, trending picks and timeless classics across every genre.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  icons: {
    icon: [
      { url: "/brand/icon.svg", type: "image/svg+xml" },
      { url: "/brand/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180" },
  },
  verification: { yandex: "36b96e1f46430665" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#12152b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${bigShoulders.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Resource hints: poster CDN is on the critical path for LCP */}
        <link rel="preconnect" href="https://img.yts.gg" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      {/* Extensions (ColorZilla, Grammarly…) inject attributes on <body> before hydration. */}
      <body suppressHydrationWarning>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <MobileTabBar />
          <PlayerWarmup />
        </Providers>
        <SwRegister />
        <Analytics />
      </body>
    </html>
  );
}
