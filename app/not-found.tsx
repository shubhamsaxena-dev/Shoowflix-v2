import type { Metadata } from "next";
import { Compass, House } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusScreen } from "@/components/shell/status-screen";

export const metadata: Metadata = {
  title: "Reel not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <StatusScreen
      code="Error 404"
      numeral="4"
      title="Reel not found"
      description="This reel isn’t in our archive. The link may be mistyped, or the film was pulled from the catalogue."
      actions={
        <>
          <ButtonLink href="/" size="lg">
            <House aria-hidden />
            Back to home
          </ButtonLink>
          <ButtonLink href="/browse" variant="outline" size="lg">
            <Compass aria-hidden />
            Browse films
          </ButtonLink>
        </>
      }
    />
  );
}
