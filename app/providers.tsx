"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swr";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          dedupingInterval: 10_000,
          keepPreviousData: true,
          errorRetryCount: 2,
        }}
      >
        <ToastProvider>{children}</ToastProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
