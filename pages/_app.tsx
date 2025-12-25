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
      </Head>
      <ErrorBoundary>
        <SessionProvider session={session}>
          <Layout>{getLayout(<Component {...pageProps} />)}</Layout>
        </SessionProvider>
      </ErrorBoundary>
    </>
  );
}
