import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import ErrorBoundary from '@/components/error-boundary';
import Layout from '@/components/layout';
import '../index.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Use a layout wrapper to prevent unmount
  const getLayout = (Component as any).getLayout || ((page: any) => page);

  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <Layout>
          {getLayout(<Component {...pageProps} />)}
        </Layout>
      </SessionProvider>
    </ErrorBoundary>
  );
}
