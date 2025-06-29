import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Wifi, 
  RefreshCw, 
  Clock, 
  ShieldAlert, 
  Server,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';

export type ErrorType = 
  | 'network'
  | 'server'
  | 'timeout'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'rate_limit'
  | 'not_found'
  | 'generic';

export interface ErrorMessageProps {
  type: ErrorType;
  title?: string;
  message?: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryCount?: number;
  maxRetries?: number;
  variant?: 'alert' | 'card' | 'inline';
  showIcon?: boolean;
}

const errorConfig: Record<ErrorType, {
  icon: React.ComponentType<any>;
  title: string;
  message: string;
  actionable: boolean;
  severity: 'error' | 'warning' | 'info';
}> = {
  network: {
    icon: Wifi,
    title: "Connection Problem",
    message: "Unable to connect to our servers. Please check your internet connection and try again.",
    actionable: true,
    severity: 'error'
  },
  server: {
    icon: Server,
    title: "Server Error",
    message: "Our servers are experiencing issues. We're working to fix this as quickly as possible.",
    actionable: true,
    severity: 'error'
  },
  timeout: {
    icon: Clock,
    title: "Request Timeout",
    message: "The request took too long to complete. This might be due to a slow connection or server load.",
    actionable: true,
    severity: 'warning'
  },
  validation: {
    icon: AlertCircle,
    title: "Input Error",
    message: "Please check your input and try again.",
    actionable: false,
    severity: 'warning'
  },
  authentication: {
    icon: ShieldAlert,
    title: "Authentication Required",
    message: "You need to sign in to access this feature.",
    actionable: false,
    severity: 'warning'
  },
  authorization: {
    icon: ShieldAlert,
    title: "Access Denied",
    message: "You don't have permission to perform this action.",
    actionable: false,
    severity: 'error'
  },
  rate_limit: {
    icon: Clock,
    title: "Too Many Requests",
    message: "You're sending requests too quickly. Please wait a moment and try again.",
    actionable: true,
    severity: 'warning'
  },
  not_found: {
    icon: AlertCircle,
    title: "Not Found",
    message: "The requested resource could not be found.",
    actionable: false,
    severity: 'info'
  },
  generic: {
    icon: AlertTriangle,
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    actionable: true,
    severity: 'error'
  }
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type,
  title,
  message,
  details,
  onRetry,
  onDismiss,
  retryCount = 0,
  maxRetries = 3,
  variant = 'alert',
  showIcon = true
}) => {
  const config = errorConfig[type];
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;
  const canRetry = config.actionable && onRetry && retryCount < maxRetries;

  const getAlertVariant = () => {
    switch (config.severity) {
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getSeverityColor = () => {
    switch (config.severity) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getBorderColor = () => {
    switch (config.severity) {
      case 'error': return 'border-red-200';
      case 'warning': return 'border-orange-200';
      case 'info': return 'border-blue-200';
      default: return 'border-gray-200';
    }
  };

  if (variant === 'card') {
    return (
      <Card className={`${getBorderColor()} bg-white`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {showIcon && <Icon className={`w-5 h-5 ${getSeverityColor()}`} />}
            <div>
              <CardTitle className="text-lg">{displayTitle}</CardTitle>
              <CardDescription>{displayMessage}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {(details || canRetry || onDismiss) && (
          <CardContent className="pt-0">
            {details && (
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-gray-50 rounded">
                {details}
              </div>
            )}
            
            <div className="flex gap-2">
              {canRetry && (
                <Button 
                  onClick={onRetry} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again {retryCount > 0 && `(${maxRetries - retryCount} left)`}
                </Button>
              )}
              
              {onDismiss && (
                <Button 
                  onClick={onDismiss} 
                  variant="ghost" 
                  size="sm"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border">
        {showIcon && <Icon className={`w-5 h-5 mt-0.5 ${getSeverityColor()}`} />}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{displayTitle}</h4>
          <p className="text-sm text-muted-foreground mt-1">{displayMessage}</p>
          {details && (
            <p className="text-xs text-muted-foreground mt-2">{details}</p>
          )}
          
          {(canRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {canRetry && (
                <Button 
                  onClick={onRetry} 
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
              
              {onDismiss && (
                <Button 
                  onClick={onDismiss} 
                  variant="ghost" 
                  size="sm"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default alert variant
  return (
    <Alert variant={getAlertVariant()} className={getBorderColor()}>
      {showIcon && <Icon className="h-4 w-4" />}
      <AlertTitle>{displayTitle}</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>{displayMessage}</p>
          
          {details && (
            <div className="text-xs p-2 bg-black/5 rounded">
              {details}
            </div>
          )}
          
          {(canRetry || onDismiss) && (
            <div className="flex gap-2 pt-2">
              {canRetry && (
                <Button 
                  onClick={onRetry} 
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again {retryCount > 0 && `(${maxRetries - retryCount} left)`}
                </Button>
              )}
              
              {onDismiss && (
                <Button 
                  onClick={onDismiss} 
                  variant="ghost" 
                  size="sm"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Success message component for consistency
export interface SuccessMessageProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  variant?: 'alert' | 'card' | 'inline';
  showIcon?: boolean;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title = "Success",
  message,
  onDismiss,
  variant = 'alert',
  showIcon = true
}) => {
  if (variant === 'card') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            {showIcon && <CheckCircle className="w-5 h-5 text-green-600" />}
            <div>
              <CardTitle className="text-lg text-green-800">{title}</CardTitle>
              <CardDescription className="text-green-700">{message}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {onDismiss && (
          <CardContent className="pt-0">
            <Button 
              onClick={onDismiss} 
              variant="ghost" 
              size="sm"
            >
              Dismiss
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
        {showIcon && <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-green-800">{title}</h4>
          <p className="text-sm text-green-700 mt-1">{message}</p>
          
          {onDismiss && (
            <div className="mt-3">
              <Button 
                onClick={onDismiss} 
                variant="ghost" 
                size="sm"
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Alert className="border-green-200 bg-green-50">
      {showIcon && <CheckCircle className="h-4 w-4 text-green-600" />}
      <AlertTitle className="text-green-800">{title}</AlertTitle>
      <AlertDescription className="text-green-700">
        <div className="space-y-2">
          <p>{message}</p>
          
          {onDismiss && (
            <div className="pt-2">
              <Button 
                onClick={onDismiss} 
                variant="ghost" 
                size="sm"
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Utility function to determine error type from error object
interface ErrorWithStatus {
  status?: number;
  response?: { status?: number };
  message?: string;
}

export function getErrorType(error: unknown): ErrorType {
  if (!error) return 'generic';
  
  const errorObj = error as ErrorWithStatus & Error;
  const message = errorObj.message?.toLowerCase() || '';
  const status = errorObj.status || errorObj.response?.status;

  // Check by HTTP status
  if (status) {
    if (status === 401) return 'authentication';
    if (status === 403) return 'authorization';
    if (status === 404) return 'not_found';
    if (status === 429) return 'rate_limit';
    if (status >= 500) return 'server';
    if (status >= 400) return 'validation';
  }

  // Check by error message
  if (message.includes('network') || message.includes('fetch')) return 'network';
  if (message.includes('timeout') || message.includes('abort')) return 'timeout';
  if (message.includes('validation') || message.includes('invalid')) return 'validation';
  if (message.includes('rate limit') || message.includes('too many')) return 'rate_limit';
  if (message.includes('not found')) return 'not_found';
  if (message.includes('server') || message.includes('internal')) return 'server';

  return 'generic';
}