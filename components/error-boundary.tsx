import React, { Component, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VPNNotice from '@/components/vpn-notice';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
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
            
            <VPNNotice forceShow={true} onClose={() => {}} />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;