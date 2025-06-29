import React, { useState, useEffect, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  CloudOff, 
  Database,
  Zap,
  Clock,
  Info
} from 'lucide-react';
import { useNetworkStatus } from '@/components/NetworkStatus';
import { errorHandler } from '@/lib/errorHandler';

interface GracefulDegradationProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  offlineComponent?: ReactNode;
  errorComponent?: ReactNode;
  requiresNetwork?: boolean;
  requiresApi?: boolean;
  featureName?: string;
  description?: string;
  onFallback?: (reason: 'offline' | 'api_error' | 'error') => void;
}

export const GracefulDegradation: React.FC<GracefulDegradationProps> = ({
  children,
  fallbackComponent,
  offlineComponent,
  errorComponent,
  requiresNetwork = false,
  requiresApi = false,
  featureName = "This feature",
  description,
  onFallback
}) => {
  const { isOnline, apiHealthy } = useNetworkStatus();
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Reset error state when network/API status improves
    if (hasError && isOnline && (!requiresApi || apiHealthy)) {
      setHasError(false);
      setRetryCount(0);
    }
  }, [isOnline, apiHealthy, hasError, requiresApi]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setHasError(false);
      
      errorHandler.logInfo(`User retry attempt ${retryCount + 1} for ${featureName}`, {
        component: 'GracefulDegradation',
        action: 'user_retry',
        metadata: {
          featureName,
          retryCount: retryCount + 1,
          maxRetries
        }
      });
    }
  };

  // Check if we should show degraded experience
  const shouldDegrade = () => {
    if (hasError) return 'error';
    if (requiresNetwork && !isOnline) return 'offline';
    if (requiresApi && !apiHealthy) return 'api_error';
    return null;
  };

  const degradationReason = shouldDegrade();

  useEffect(() => {
    if (degradationReason && onFallback) {
      onFallback(degradationReason as 'offline' | 'api_error' | 'error');
    }
  }, [degradationReason, onFallback]);

  // Render offline fallback
  if (degradationReason === 'offline') {
    if (offlineComponent) return <>{offlineComponent}</>;
    
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <WifiOff className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-orange-800">Offline Mode</CardTitle>
              <CardDescription className="text-orange-700">
                {featureName} requires an internet connection
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-orange-200 bg-orange-100/50">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {description || `${featureName} will be available when your connection is restored.`}
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center justify-between mt-4">
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              <CloudOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
            
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              size="sm"
              disabled={!isOnline}
            >
              <Wifi className="w-4 h-4 mr-2" />
              Check Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render API error fallback
  if (degradationReason === 'api_error') {
    if (fallbackComponent) return <>{fallbackComponent}</>;
    
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Database className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-800">Service Unavailable</CardTitle>
              <CardDescription className="text-red-700">
                {featureName} is temporarily unavailable
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-red-200 bg-red-100/50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {description || `Our servers are experiencing issues. ${featureName} will work normally once service is restored.`}
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center justify-between mt-4">
            <Badge variant="destructive">
              <CloudOff className="w-3 h-3 mr-1" />
              Service Down
            </Badge>
            
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              size="sm"
              disabled={retryCount >= maxRetries}
            >
              <Zap className="w-4 h-4 mr-2" />
              Retry {retryCount > 0 && `(${maxRetries - retryCount} left)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error fallback
  if (degradationReason === 'error') {
    if (errorComponent) return <>{errorComponent}</>;
    
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-800">Feature Error</CardTitle>
              <CardDescription className="text-red-700">
                {featureName} encountered an error
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-red-200 bg-red-100/50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {description || `${featureName} isn't working correctly right now. Please try again.`}
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center justify-between mt-4">
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Error
            </Badge>
            
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              size="sm"
              disabled={retryCount >= maxRetries}
            >
              <Clock className="w-4 h-4 mr-2" />
              Try Again {retryCount > 0 && `(${maxRetries - retryCount} left)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Wrap children in error boundary
  return (
    <ErrorBoundaryWrapper
      onError={() => setHasError(true)}
      featureName={featureName}
    >
      {children}
    </ErrorBoundaryWrapper>
  );
};

// Internal error boundary wrapper
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  onError: () => void;
  featureName: string;
}

class ErrorBoundaryWrapper extends React.Component<
  ErrorBoundaryWrapperProps,
  { hasError: boolean }
> {
  constructor(props: ErrorBoundaryWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorHandler.logError(error, {
      component: 'GracefulDegradation',
      action: 'feature_error',
      metadata: {
        featureName: this.props.featureName,
        componentStack: errorInfo.componentStack
      }
    });
    
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Let parent component handle the error display
    }

    return this.props.children;
  }
}

// Hook for using graceful degradation
export function useGracefulDegradation(options: {
  requiresNetwork?: boolean;
  requiresApi?: boolean;
  featureName?: string;
}) {
  const { isOnline, apiHealthy } = useNetworkStatus();
  const [hasError, setHasError] = useState(false);

  const isAvailable = 
    (!options.requiresNetwork || isOnline) &&
    (!options.requiresApi || apiHealthy) &&
    !hasError;

  const degradationReason = hasError 
    ? 'error' 
    : (!isOnline && options.requiresNetwork) 
      ? 'offline'
      : (!apiHealthy && options.requiresApi)
        ? 'api_error'
        : null;

  const reportError = (error: Error) => {
    setHasError(true);
    errorHandler.logError(error, {
      component: 'useGracefulDegradation',
      action: 'hook_error',
      metadata: {
        featureName: options.featureName || 'unknown'
      }
    });
  };

  const retry = () => {
    setHasError(false);
  };

  return {
    isAvailable,
    degradationReason,
    reportError,
    retry,
    isOnline,
    apiHealthy
  };
}