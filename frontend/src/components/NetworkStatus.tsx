import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { errorHandler } from '@/lib/errorHandler';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface NetworkStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  showDetails = false, 
  compact = false 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkApiStatus = React.useCallback(async () => {
    if (!isOnline) {
      setApiStatus('offline');
      return;
    }

    setApiStatus('checking');
    setLastChecked(new Date());

    try {
      const health = await apiClient.healthCheck();
      setApiStatus(health.healthy ? 'online' : 'error');
      setRetryCount(0);
    } catch (error) {
      setApiStatus('error');
      errorHandler.logError(error as Error, {
        component: 'NetworkStatus',
        action: 'api_health_check_failed'
      });
    }
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkApiStatus();
      toast({
        title: "Connection restored",
        description: "Your internet connection has been restored.",
        variant: "default",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setApiStatus('offline');
      toast({
        title: "Connection lost",
        description: "You're currently offline. Some features may not work.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial API status check
    checkApiStatus();

    // Periodic API health checks
    const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkApiStatus]);


  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await checkApiStatus();
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    switch (apiStatus) {
      case 'online': return 'bg-green-500';
      case 'checking': return 'bg-yellow-500';
      case 'offline':
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    switch (apiStatus) {
      case 'online': return 'Online';
      case 'checking': return 'Checking...';
      case 'offline': return 'API Offline';
      case 'error': return 'API Error';
      default: return 'Unknown';
    }
  };

  const getIcon = () => {
    if (!isOnline || apiStatus === 'offline' || apiStatus === 'error') {
      return <WifiOff className="w-4 h-4" />;
    }
    if (apiStatus === 'checking') {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    return <Wifi className="w-4 h-4" />;
  };

  // Compact mode - just a small status indicator
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-xs text-muted-foreground">
          {getStatusText()}
        </span>
      </div>
    );
  }

  // Don't show anything if everything is working fine and showDetails is false
  if (!showDetails && isOnline && apiStatus === 'online') {
    return null;
  }

  return (
    <div className="space-y-2">
      <Alert className={`border-l-4 ${
        isOnline && apiStatus === 'online' 
          ? 'border-green-500 bg-green-50' 
          : 'border-red-500 bg-red-50'
      }`}>
        <div className="flex items-center gap-2">
          {getIcon()}
          <AlertDescription className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <strong>Connection Status:</strong> {getStatusText()}
                {showDetails && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Last checked: {lastChecked.toLocaleTimeString()}
                    {retryCount > 0 && ` (${retryCount} retries)`}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={isOnline && apiStatus === 'online' ? 'default' : 'destructive'}>
                  {isOnline ? 'Connected' : 'Disconnected'}
                </Badge>
                
                {(apiStatus === 'error' || apiStatus === 'offline') && (
                  <Button 
                    onClick={handleRetry}
                    size="sm" 
                    variant="outline"
                    disabled={apiStatus === 'checking'}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${
                      apiStatus === 'checking' ? 'animate-spin' : ''
                    }`} />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </div>
      </Alert>

      {/* Network troubleshooting tips */}
      {!isOnline && showDetails && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Troubleshooting tips:</strong>
            <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
              <li>Check your internet connection</li>
              <li>Try refreshing the page</li>
              <li>Check if other websites are working</li>
              <li>Contact your network administrator if the problem persists</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* API troubleshooting tips */}
      {isOnline && (apiStatus === 'error' || apiStatus === 'offline') && showDetails && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Service Status:</strong> Our backend service appears to be temporarily unavailable.
            <div className="mt-2 text-sm">
              <p>The application will continue to work in offline mode with limited functionality.</p>
              <p className="mt-1">We're working to restore full service as quickly as possible.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Hook for using network status in components
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiHealthy, setApiHealthy] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check API health
    const checkHealth = async () => {
      try {
        const health = await apiClient.healthCheck();
        setApiHealthy(health.healthy);
      } catch {
        setApiHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    apiHealthy,
    isFullyConnected: isOnline && apiHealthy,
  };
}