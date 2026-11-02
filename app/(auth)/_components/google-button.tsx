"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95S8.78 6.5 12 6.5c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.94 14.55 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.64-3.65 8.64-8.8 0-.59-.06-1.04-.14-1.49z" />
    </svg>
  );
}

export function GoogleButton({ callbackUrl, label }: { callbackUrl: string; label: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      size="lg"
      block
      loading={loading}
      onClick={() => {
        setLoading(true);
        void signIn("google", { callbackUrl });
      }}
    >
      {loading ? null : <GoogleMark />}
      {label}
    </Button>
  );
}
