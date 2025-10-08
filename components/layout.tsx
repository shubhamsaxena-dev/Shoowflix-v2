// components/Layout.tsx
import { ReactNode } from 'react';
import VPNNotice from './vpn-notice';
import NetworkErrorHandler from './network-error-handler';
import { Toaster } from './ui/toaster';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      {children}
      <VPNNotice />
      <NetworkErrorHandler />
      <Toaster />
      <SpeedInsights />
      <Analytics />
    </>
  );
}
