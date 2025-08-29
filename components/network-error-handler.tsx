import { useEffect, useState } from 'react';
import VPNNotice from '@/components/vpn-notice';

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
    <VPNNotice 
      forceShow={true} 
      onClose={() => setShowVPNNotice(false)} 
    />
  );
}