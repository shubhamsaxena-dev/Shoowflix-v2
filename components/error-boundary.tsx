import React, { Component, ReactNode } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  showVPNNotice: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, showVPNNotice: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true, showVPNNotice: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, showVPNNotice: false });
    window.location.reload();
  };

  handleDismissVPN = () => {
    this.setState({ showVPNNotice: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              The application encountered an error. Please try refreshing the page.
            </p>
            
            <Button onClick={this.handleRetry} className="mb-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>

            {/* VPN Notice Popup */}
            {this.state.showVPNNotice && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="bg-card border-border p-6 max-w-md w-full mx-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="h-6 w-6 text-blue-500" />
                    <h3 className="text-lg font-semibold">
                      Connection Issue Detected
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      Having trouble loading Shoowflix? This might be due to network restrictions. 
                      Using a VPN can help resolve connectivity issues and ensure reliable access to our platform.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={this.handleDismissVPN}
                        className="flex-1"
                      >
                        Got It
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={this.handleRetry}
                        className="flex-1"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;