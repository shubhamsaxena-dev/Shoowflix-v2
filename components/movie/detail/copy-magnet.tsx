"use client";

import { Magnet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { buildMagnet } from "@/lib/movie-utils";

export function CopyMagnet({ hash, title, quality }: { hash: string; title: string; quality: string }) {
  const { toast } = useToast();

  const copy = async () => {
    const magnet = buildMagnet(hash, `${title} [${quality}]`);
    try {
      await navigator.clipboard.writeText(magnet);
      toast({ title: "Magnet link copied", description: `${title} · ${quality}`, tone: "success" });
    } catch {
      // Clipboard blocked (insecure context / permissions): hand it to the OS instead.
      window.location.href = magnet;
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={copy} aria-label={`Copy magnet link for ${quality}`}>
      <Magnet aria-hidden />
      Magnet
    </Button>
  );
}
