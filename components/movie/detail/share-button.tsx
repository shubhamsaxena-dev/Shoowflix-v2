"use client";

import { Share2 } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Web Share API on supporting devices, otherwise copies the canonical link. */
export function ShareButton({
  title,
  path,
  text,
  variant = "glass",
  size = "lg",
}: {
  title: string;
  /** Canonical path, e.g. movieHref(movie). */
  path: string;
  text?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const { toast } = useToast();

  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: title, tone: "success" });
    } catch {
      toast({ title: "Couldn't copy the link", description: url, tone: "danger" });
    }
  };

  return (
    <Button variant={variant} size={size} icon onClick={share} aria-label={`Share ${title}`}>
      <Share2 aria-hidden />
    </Button>
  );
}
