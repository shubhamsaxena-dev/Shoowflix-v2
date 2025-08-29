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
    webtor: any;
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

    // Clear any existing player content first
    if (playerRef.current) {
      playerRef.current.innerHTML = '';
    }

    // Initialize WebTor player with proper configuration
    const initializePlayer = () => {
      try {
        console.log('Initializing WebTor player with:', { movieTitle: movie.title, magnetLink });
        
        if (!playerRef.current) {
          console.error('Player container not found');
          setError('Player container not available');
          return;
        }

        // Clear existing content
        playerRef.current.innerHTML = '';
        
        // Ensure webtor global array exists
        window.webtor = window.webtor || [];
        
        const config = {
          id: 'webtor-player',
          className: 'player',
          magnet: magnetLink,
          imdbId: movie.imdb_code || '',
          poster: movie.large_cover_image || movie.medium_cover_image,
          features: {
            download: true,
            fullscreen: true,
            settings: false,
            chromecast: true
          },
          on: function (e: any) {
            console.log('WebTor event:', e.name);
            if (e.name === window.webtor.INITED) {
              console.log('Player initialized, starting playback');
              e.player.play();
              setIsLoading(false);
            }
            if (e.name === window.webtor.TORRENT_FETCHED) {
              console.log('Torrent fetched!', e.data);
              setIsLoading(false);
            }
            if (e.name === window.webtor.TORRENT_ERROR) {
              console.error('Torrent error!');
              setError('Failed to load movie stream. Please try a different quality.');
              setIsLoading(false);
            }
          },
          lang: 'en',
          i18n: {
            en: {
              common: {
                'prepare to play': 'Preparing Video Stream... Please Wait..'
              },
              stat: {
                seeding: 'Seeding',
                waiting: 'Client initialization',
                'waiting for peers': 'Waiting for peers',
                from: 'from'
              }
            }
          }
        };
        
        // Add configuration to webtor queue
        window.webtor.push(config);
        
        console.log('WebTor config added:', config);
        
      } catch (err) {
        console.error('Error initializing WebTor player:', err);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    // Load WebTor SDK and initialize player
    const timeoutId = setTimeout(() => {
      const existingScript = document.querySelector('script[src*="webtor"]');
      
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js';
        script.async = true;
        script.charset = 'utf-8';
        
        script.onload = () => {
          console.log('WebTor SDK loaded successfully');
          // Wait a bit more for SDK to fully initialize
          setTimeout(initializePlayer, 500);
        };
        
        script.onerror = () => {
          console.error('Failed to load WebTor SDK');
          setError('Failed to load video player');
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
      } else {
        console.log('WebTor SDK already loaded, initializing...');
        initializePlayer();
      }
    }, 200);

    return () => {
      // Cleanup on unmount
      clearTimeout(timeoutId);
      if (playerRef.current) {
        playerRef.current.innerHTML = '';
      }
      // Reset webtor array to prevent conflicts
      if (window.webtor) {
        window.webtor = [];
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
    <div className="fixed inset-0 z-50 bg-black w-screen h-screen flex items-center justify-center" data-testid="video-player">
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
          onClick={handleClose}
          data-testid="video-player-close"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        
        {movie && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 bg-black/70 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg max-w-xs sm:max-w-none">
            <h3 className="font-medium text-sm sm:text-base truncate" data-testid="video-player-title">{movie.title}</h3>
            {selectedTorrent && (
              <p className="text-xs sm:text-sm text-gray-300" data-testid="video-player-quality">
                {selectedTorrent.quality} • {selectedTorrent.size}
              </p>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center px-4">
              <Loader2 className="animate-spin h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4" />
              <p className="text-sm sm:text-base" data-testid="video-player-loading">Loading stream...</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">Connecting to WebTor...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center px-4">
              <p className="text-red-400 mb-4 text-sm sm:text-base" data-testid="video-player-error">{error}</p>
              <Button 
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="sm:size-default"
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
          className="max-w-6xl w-full h-auto aspect-video mx-auto"
          style={{ 
            display: isLoading || error ? 'none' : 'block',
            maxHeight: '80vh'
          }}
        />
        
      </div>
    </div>
  );
}
