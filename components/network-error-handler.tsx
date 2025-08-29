import { useEffect, useState } from 'react';
import { Shield, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NetworkErrorHandler() {
  const [showVPNNotice, setShowVPNNotice] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasNetworkError, setHasNetworkError] = useState(false);

  useEffect(() => {
    // Check if we're online
    setIsOnline(navigator.onLine);

    // Listen for network status changes
    const handleOnline = () => {
      setIsOnline(true);
      setHasNetworkError(false);
      setShowVPNNotice(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasNetworkError(true);
      setShowVPNNotice(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for failed fetch requests (API errors)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && (response.status >= 500 || response.status === 0)) {
          setHasNetworkError(true);
          setShowVPNNotice(true);
        }
        return response;
      } catch (error) {
        setHasNetworkError(true);
        setShowVPNNotice(true);
        throw error;
      }
    };

    // Check for failed resource loading
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG')) {
        setHasNetworkError(true);
        setShowVPNNotice(true);
      }
    };

    window.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleResourceError, true);
      window.fetch = originalFetch;
    };
  }, []);

  const handleRetry = () => {
    setShowVPNNotice(false);
    setHasNetworkError(false);
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowVPNNotice(false);
  };

  if (!showVPNNotice) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" data-testid="network-error-vpn-notice">
      <Card className="bg-card border-border p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-6 w-6 text-blue-500" />
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <h3 className="text-lg font-semibold">
              {isOnline ? 'Loading Issue Detected' : 'Connection Lost'}
            </h3>
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {isOnline 
              ? 'Shoowflix is having trouble loading content. This could be due to network restrictions or geographic limitations. A VPN might help resolve these connectivity issues.'
              : 'Your internet connection appears to be offline. Please check your connection and try again. If issues persist, consider using a VPN for better connectivity.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleDismiss}
              className="flex-1"
              data-testid="network-error-dismiss"
            >
              Understood
            </Button>
            <Button 
              variant="outline"
              onClick={handleRetry}
              className="flex-1"
              data-testid="network-error-retry"
            >
              Retry
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}