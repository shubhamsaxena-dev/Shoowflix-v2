import { SWRConfig } from 'swr'
import type { AppProps } from 'next/app'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import VPNNotice from '@/components/vpn-notice'
import ErrorBoundary from '@/components/error-boundary'
import NetworkErrorHandler from '@/components/network-error-handler'
import { Toaster } from '@/components/ui/toaster'
import '../index.css'

// SWR configuration
const swrConfig = {
  fetcher: (resource: string, init?: RequestInit) => 
    fetch(resource, init).then(res => res.json()),
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5 * 60 * 1000, // 5 minutes
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <SWRConfig value={swrConfig}>
        <Component {...pageProps} />
        <VPNNotice />
        <NetworkErrorHandler />
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </SWRConfig>
    </ErrorBoundary>
  )
}