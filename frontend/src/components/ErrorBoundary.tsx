import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="w-12 h-12 text-orange-500" />
                </div>
                <CardTitle className="text-xl mb-2">
                  Something went wrong
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-center">
                  We encountered an unexpected error. Don't worry, your progress is saved locally.
                </p>
                {this.state.error && (
                  <details className="text-xs bg-gray-100 p-2 rounded">
                    <summary className="cursor-pointer font-medium">
                      Error details
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={this.handleReset}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1"
                  >
                    Restart App
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;