import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VPNNoticeProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export default function VPNNotice({ forceShow = false, onClose }: VPNNoticeProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Show if forced (from error handlers)
    if (forceShow) {
      setIsVisible(true);
    } else {
      // Only show on first load if we're on the home page
      const isHomePage = router.pathname === '/';
      if (isHomePage) {
        setIsVisible(true);
      }
    }
  }, [forceShow, isMounted, router.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    if (!forceShow) {
      localStorage.setItem('vpn-notice-seen', 'true');
    }
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" data-testid="vpn-notice-overlay">
      <Card className="bg-card border-border p-6 max-w-md w-full mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold" data-testid="vpn-notice-title">
              {forceShow ? 'Connection Issue' : 'VPN Recommended'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-1 h-auto"
            data-testid="vpn-notice-close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed" data-testid="vpn-notice-message">
            {forceShow 
              ? 'Shoowflix is experiencing connectivity issues. Using a VPN can help resolve these problems and ensure uninterrupted streaming access. It also protects your privacy while browsing.'
              : 'For your privacy and security, we recommend using a VPN when streaming content. This helps protect your identity and ensures a safer browsing experience.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleClose}
              className="flex-1"
              data-testid="vpn-notice-understand"
            >
              {forceShow ? 'Understood' : 'I Understand'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              data-testid="vpn-notice-dismiss"
            >
              {forceShow ? 'Continue' : 'Dismiss'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}