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

    // Clear any existing player content first
    if (playerRef.current) {
      playerRef.current.innerHTML = '';
    }

    // Initialize WebTor player
    const initializePlayer = () => {
      try {
        console.log('Initializing WebTor player with:', { movieTitle: movie.title, magnetLink });
        
        // Ensure webtor global array exists
        window.webtor = window.webtor || [];

        const config = {
          id: 'webtor-player',
          magnet: magnetLink,
          poster: movie.large_cover_image || movie.medium_cover_image,
          lang: 'en',
          on: function(e: any) {
            if (e.name === 'torrent-fetched') {
              console.log('Torrent fetched successfully!', e.data);
              setIsLoading(false);
            }
            if (e.name === 'torrent-error') {
              console.error('Torrent error:', e.data);
              setError('Failed to load movie stream');
              setIsLoading(false);
            }
            if (e.name === 'player-ready') {
              console.log('WebTor player ready');
              setIsLoading(false);
            }
          }
        };

        // Add configuration to webtor queue
        window.webtor.push(config);
        
        console.log('WebTor config added:', config);
        
        // Set a timeout to hide loading after WebTor should have initialized
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
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
    <div className="fixed inset-0 z-50 bg-black w-screen h-screen" data-testid="video-player">
      <div className="relative w-full h-full overflow-hidden">
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
          style={{ 
            display: isLoading || error ? 'none' : 'block',
            width: '100%',
            height: '100%',
            minHeight: '100vh'
          }}
        />
        
        {/* Alternative WebTor video element approach */}
        {!isLoading && !error && (
          <video
            controls
            autoPlay
            src={magnetLink || ''}
            poster={movie?.large_cover_image || movie?.medium_cover_image}
            width="100%"
            height="100%"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            data-testid="webtor-video"
            onLoadStart={() => console.log('Video load started')}
            onCanPlay={() => console.log('Video can play')}
            onError={(e) => {
              console.error('Video error:', e);
              setError('Failed to load video stream');
            }}
          />
        )}
      </div>
    </div>
  );
}
