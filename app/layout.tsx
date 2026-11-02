import type { Metadata, Viewport } from "next";
import { Archivo, Big_Shoulders } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";
import { MobileTabBar } from "@/components/shell/mobile-tab-bar";
import { WebVitals } from "@/components/perf/web-vitals";
import { SwRegister } from "@/components/perf/sw-register";
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
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  verification: { yandex: "36b96e1f46430665" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#12152b" },
    { media: "(prefers-color-scheme: light)", color: "#f2f3f9" },
  ],
};

/** Runs before paint so the stored theme never flashes. Kept tiny and inline on purpose. */
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const apiOrigin = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_API_ROOT ?? "").origin;
    } catch {
      return null;
    }
  })();

  return (
    <html
      lang="en"
      className={`${archivo.variable} ${bigShoulders.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Resource hints: poster CDN is on the critical path for LCP */}
        {apiOrigin && <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />}
        <link rel="preconnect" href="https://img.yts.gg" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <MobileTabBar />
        </Providers>
        <WebVitals />
        <SwRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
