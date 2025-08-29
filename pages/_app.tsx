import { SWRConfig } from 'swr'
import type { AppProps } from 'next/app'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
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
    <SWRConfig value={swrConfig}>
      <Component {...pageProps} />
      <SpeedInsights />
      <Analytics />
    </SWRConfig>
  )
}