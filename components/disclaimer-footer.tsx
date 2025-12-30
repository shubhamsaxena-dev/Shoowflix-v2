import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeen = sessionStorage.getItem("shoowflix_disclaimer_seen");
    if (!hasSeen) setOpen(true);
  }, []);

  const handleAccept = () => {
    sessionStorage.setItem("shoowflix_disclaimer_seen", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg border-red-900/50 bg-zinc-950 [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-red-500 text-xl font-bold">
            Legal Disclaimer
          </DialogTitle>
          <DialogDescription className="text-white/70 pt-2">
            Please read and acknowledge the following before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-white/80 space-y-3 py-4">
          <p>
            Shoowflix does not host, store, or distribute any media files.
            Content is accessed via publicly available peer-to-peer networks and
            third-party sources.
          </p>
          <p>
            Shoowflix is an experimental, non-commercial project intended for
            educational and demonstration purposes only.
          </p>
          <p>
            Users are responsible for complying with applicable copyright and
            internet regulations.
          </p>
          <p>
            Any issues regarding content legality or internet regulations should
            be addressed directly to the respective source websites. The
            developer assumes no legal responsibility for third-party content.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            I Understand & Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DisclaimerFooter() {
  return (
    <footer className="disclaimer text-xs text-center p-6 mt-8 border-t border-red-900/30 bg-red-950/20 text-red-200/70">
      <p className="mb-3 last:mb-0">
        Shoowflix does not host, store, or distribute any media files. Content
        is accessed via publicly available peer-to-peer networks and third-party
        sources.
      </p>
      <p className="mb-3 last:mb-0">
        Shoowflix is an experimental, non-commercial project intended for
        educational and demonstration purposes only.
      </p>
      <p className="mb-3 last:mb-0">
        Users are responsible for complying with applicable copyright and
        internet regulations.
      </p>
      <p className="last:mb-0">
        Any issues regarding content legality or internet regulations should be
        addressed directly to the respective source websites. The developer
        assumes no legal responsibility for third-party content.
      </p>
    </footer>
  );
}
