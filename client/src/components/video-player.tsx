import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { YTSMovie, Torrent } from "@shared/schema";
import type { WebTorConfig } from "@/lib/types";

interface VideoPlayerProps {
  isOpen: boolean;
  movie: YTSMovie | null;
  selectedTorrent: Torrent | null;
  magnetLink: string | null;
  onClose: () => void;
}

declare global {
  interface Window {
    webtor: any[];
  }
}

export default function VideoPlayer({ isOpen, movie, selectedTorrent, magnetLink, onClose }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const webtorInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || !movie || !magnetLink || !playerRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Initialize WebTor player
    const initializePlayer = () => {
      try {
        // Ensure webtor global array exists
        if (!window.webtor) {
          window.webtor = [];
        }

        const config: WebTorConfig = {
          id: 'webtor-player',
          magnet: magnetLink,
          poster: movie.large_cover_image || movie.medium_cover_image,
          lang: 'en',
        };

        // Add configuration to webtor queue
        window.webtor.push(config);

        // Set up event handlers if webtor API is available
        if (typeof window.webtor === 'object' && window.webtor.push !== Array.prototype.push) {
          webtorInstanceRef.current = config;
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing WebTor player:', err);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    // Load WebTor SDK if not already loaded
    if (!document.querySelector('script[src*="webtor"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js';
      script.async = true;
      script.onload = initializePlayer;
      script.onerror = () => {
        setError('Failed to load video player');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initializePlayer();
    }

    return () => {
      // Cleanup on unmount
      if (webtorInstanceRef.current) {
        try {
          // Clear the player div
          if (playerRef.current) {
            playerRef.current.innerHTML = '';
          }
        } catch (err) {
          console.error('Error cleaning up WebTor player:', err);
        }
      }
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
    // Re-trigger the effect by updating a state or calling initialization again
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black" data-testid="video-player">
      <div className="relative w-full h-full">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
          onClick={handleClose}
          data-testid="video-player-close"
        >
          <X className="h-5 w-5" />
        </Button>
        
        {movie && (
          <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-4 py-2 rounded-lg">
            <h3 className="font-medium" data-testid="video-player-title">{movie.title}</h3>
            {selectedTorrent && (
              <p className="text-sm text-gray-300" data-testid="video-player-quality">
                {selectedTorrent.quality} • {selectedTorrent.size}
              </p>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" />
              <p data-testid="video-player-loading">Loading stream...</p>
              <p className="text-sm text-gray-400 mt-2">Connecting to WebTor...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <p className="text-red-400 mb-4" data-testid="video-player-error">{error}</p>
              <Button 
                onClick={handleRetry}
                variant="outline"
                data-testid="video-player-retry"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <div 
          id="webtor-player" 
          ref={playerRef}
          className="w-full h-full"
          style={{ display: isLoading || error ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}
