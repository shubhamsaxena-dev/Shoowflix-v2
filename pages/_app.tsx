import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import ErrorBoundary from "@/components/error-boundary";
import Layout from "@/components/layout";
import { useRouter } from "next/router";
import Head from "next/head";
// @ts-ignore
import "../index.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  // Use a layout wrapper to prevent unmount
  const getLayout = (Component as any).getLayout || ((page: any) => page);
  const router = useRouter();
  const SITE_URL = "https://www.shoowflix.com";
  return (
    <>
      <Head>
        <link rel="canonical" href={`${SITE_URL}${router.asPath}`} />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_ROOT} />
        <link rel="preconnect" href="https://img.yts.mx" />
        <link rel="preconnect" href="https://yts.lt" />
        <link rel="preconnect" href="https://yts.mx" />
        <link rel="dns-prefetch" href="https://img.yts.mx" />
        <link rel="dns-prefetch" href="https://yts.lt" />
        <link rel="dns-prefetch" href="https://yts.mx" />

        {/* Additional Meta Tags */}
        <meta
          name="description"
          content="Stream movies in high quality with Shoowflix. Browse the latest releases, trending films, and classic movies across all genres with our Netflix-style interface."
        />
        <meta
          name="keywords"
          content="movies, streaming, film, cinema, watch online, HD movies, movie streaming, Shoowflix, 720p, 1080p, torrents, WebTor"
        />
        <meta name="author" content="Shoowflix" />
        <meta
          name="copyright"
          content="© 2025 Shoowflix. All rights reserved."
        />
        <meta name="theme-color" content="#dc2626" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
        <meta name="language" content="EN" />
        <meta name="revisit-after" content="7 days" />
        <meta name="rating" content="general" />
        <meta name="distribution" content="global" />

        {/* Additional Social Media Meta Tags */}
        <meta
          property="article:publisher"
          content="https://facebook.com/shoowflix"
        />
        <meta name="pinterest-rich-pin" content="true" />
      </Head>
      <ErrorBoundary>
        <SessionProvider session={session}>
          <Layout>{getLayout(<Component {...pageProps} />)}</Layout>
        </SessionProvider>
      </ErrorBoundary>
    </>
  );
}
