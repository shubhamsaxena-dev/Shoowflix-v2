"use client";

import { useEffect } from "react";
import { House, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusScreen } from "@/components/shell/status-screen";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      code={error.digest ? `Error ref ${error.digest}` : "Something went wrong"}
      numeral="!"
      title="The projector jammed"
      description="This page hit a problem while loading. Try again, and if it keeps happening, head back home and pick another film."
      actions={
        <>
          <Button size="lg" onClick={reset}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
          <ButtonLink href="/" variant="outline" size="lg">
            <House aria-hidden />
            Back to home
          </ButtonLink>
        </>
      }
    />
  );
}
