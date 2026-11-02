"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/shell/status-screen";
import "@/styles/globals.css";

/** Replaces the root layout when it fails, so it renders its own <html>/<body>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main>
          <StatusScreen
            code={error.digest ? `Error ref ${error.digest}` : "Something went wrong"}
            numeral="!"
            title="The house lights came up"
            description="Shoowflix couldn’t load. Reload to try again."
            actions={
              <Button size="lg" onClick={reset}>
                <RotateCcw aria-hidden />
                Reload
              </Button>
            }
          />
        </main>
      </body>
    </html>
  );
}
