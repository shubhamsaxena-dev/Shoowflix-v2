"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { YTSMovie, Torrent } from "@/types/movie";

interface VideoPlayerProps {
  isOpen: boolean;
  movie: YTSMovie | null;
  selectedTorrent: Torrent | null;
  magnetLink: string | null;
  onClose: () => void;
}

declare global {
  interface Window {
    webtor: any;
  }
}

export default function VideoPlayer({
  isOpen,
  movie,
  selectedTorrent,
  magnetLink,
  onClose,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVPNNotice, setShowVPNNotice] = useState(false);
  const [torrentStatus, setTorrentStatus] = useState<{ downloaded: string; peers: number }>({
    downloaded: "0 MB",
    peers: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const playerIdRef = useRef<string>("");
  const initializedRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);

  // 🎯 Center the play button
  const centerPlayButton = () => {
    const container = containerRef.current?.querySelector(`#${playerIdRef.current}`);
    if (!container) return;

    const candidates = Array.from(
      container.querySelectorAll<HTMLElement>(
        "button, div[role='button'], [class*='play'], .webtor-play-button"
      )
    );

    if (candidates.length === 0) return;

    candidates.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        el.style.position = "absolute";
        el.style.top = "50%";
        el.style.left = "50%";
        el.style.transform = "translate(-50%, -50%)";
        el.style.zIndex = "9999";
      }
    });

    // Stop observing once a button is centered
    if (observerRef.current) {
      const button = container.querySelector(".webtor-play-button");
      if (button) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    }
  };

  const initializePlayer = () => {
    if (initializedRef.current || !magnetLink) return;
    initializedRef.current = true;

    const uniqueId = `webtor-player-${Date.now()}`;
    playerIdRef.current = uniqueId;

    const playerDiv = document.createElement("div");
    playerDiv.id = uniqueId;
    playerDiv.style.width = "100%";
    playerDiv.style.height = "100%";
    playerDiv.style.position = "relative";

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(playerDiv);
    }

    if (!window.webtor) window.webtor = [];

    const config = {
      id: uniqueId,
      magnet: magnetLink,
      imdbId: movie?.imdb_code || "",
      poster: movie?.large_cover_image || movie?.medium_cover_image,
      width: "100%",
      height: "100%",
      features: { download: true, fullscreen: false, chromecast: true, autoplay: true },
      on: (e: any) => {
        if (e.name === window.webtor.INITED) {
          e.player.play();
          setIsLoading(false);

          // Observe container for play button
          if (containerRef.current && !observerRef.current) {
            observerRef.current = new MutationObserver(centerPlayButton);
            observerRef.current.observe(containerRef.current, {
              childList: true,
              subtree: true,
              attributes: true,
            });
          }

          // Center immediately in case button exists
          centerPlayButton();
        }

        if (e.name === window.webtor.TORRENT_FETCHED) {
          setIsLoading(false);
          setTorrentStatus({ downloaded: e.data.downloaded, peers: e.data.peers });
        }

        if (e.name === window.webtor.TORRENT_ERROR) {
          setError("Failed to load movie stream. Please try a different quality.");
          setIsLoading(false);
          setShowVPNNotice(true);
        }

        if (e.name === window.webtor.STAT) {
          setTorrentStatus({
            downloaded: e.data.downloaded || torrentStatus.downloaded,
            peers: e.data.peers || 0,
          });
        }
      },
    };

    window.webtor.push(config);
  };

  const waitForWebtor = () => {
    if (!window.webtor || !window.webtor.INITED) {
      setTimeout(waitForWebtor, 100);
    } else {
      initializePlayer();
    }
  };

  useEffect(() => {
    if (!isOpen || !movie || !magnetLink) return;

    setIsLoading(true);
    setError(null);
    initializedRef.current = false;

    if (typeof window !== "undefined") {
      const existingScript = document.querySelector('script[src*="webtor"]');

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js";
        script.async = true;
        script.onload = () => setTimeout(initializePlayer, 300);
        script.onerror = () => {
          setError("Failed to load video player");
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        waitForWebtor();
      }
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [isOpen, movie, magnetLink]);

  const handleClose = () => {
    setIsLoading(true);
    setError(null);
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    initializedRef.current = false;
    if (containerRef.current) containerRef.current.innerHTML = "";
    initializePlayer();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[80vw] aspect-video bg-black rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white border border-white/20"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {movie && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 bg-black/70 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg max-w-xs sm:max-w-none">
            <h3 className="font-medium text-sm sm:text-base truncate">{movie.title}</h3>
            {selectedTorrent && (
              <p className="text-xs sm:text-sm text-gray-300">
                {selectedTorrent.quality} • {selectedTorrent.size}
              </p>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <Loader2 className="animate-spin h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4" />
            <p className="text-sm sm:text-base">Warming up torrent client...</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Downloaded: {torrentStatus.downloaded}, Peers: {torrentStatus.peers}
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center px-4">
              <p className="text-red-400 mb-4 text-sm sm:text-base">{error}</p>
              <Button onClick={handleRetry} variant="outline" size="sm" className="mb-4">
                Retry
              </Button>
            </div>
          </div>
        )}

        {showVPNNotice && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
            <Card className="bg-card border-border p-6 max-w-md w-full mx-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-blue-500" />
                  <h3 className="text-lg font-semibold">Streaming Issue Detected</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVPNNotice(false)}
                  className="p-1 h-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  For the best streaming experience, we recommend using a VPN.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => setShowVPNNotice(false)} className="flex-1">
                    Got It
                  </Button>
                  <Button variant="outline" onClick={handleRetry} className="flex-1">
                    Retry Stream
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div
          ref={containerRef}
          className="w-full h-full rounded-lg overflow-hidden"
          style={{
            display: isLoading || error ? "none" : "block",
            position: "relative",
          }}
        />
      </div>
    </div>
  );
}
