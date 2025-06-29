import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bug, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  Send, 
  Trash2,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { errorHandler } from '@/lib/errorHandler';
import { toast } from '@/hooks/use-toast';

interface ErrorReportingProps {
  onClose?: () => void;
}

export const ErrorReporting: React.FC<ErrorReportingProps> = ({ onClose }) => {
  const [errorLogs, setErrorLogs] = useState(errorHandler.getErrorLogs());
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [userDescription, setUserDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Refresh error logs periodically
    const interval = setInterval(() => {
      setErrorLogs(errorHandler.getErrorLogs());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCopyError = (errorId: string) => {
    const error = errorLogs.find(e => e.id === errorId);
    if (!error) return;

    const errorDetails = {
      id: error.id,
      timestamp: error.timestamp,
      message: error.message,
      stack: error.stack,
      context: error.context,
      url: error.url,
      userAgent: error.userAgent
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2)).then(() => {
      toast({
        title: "Error details copied",
        description: "Error information has been copied to your clipboard.",
        variant: "default"
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Please manually copy the error information.",
        variant: "destructive"
      });
    });
  };

  const handleSubmitReport = async () => {
    if (!selectedError || !userDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please select an error and provide a description.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const error = errorLogs.find(e => e.id === selectedError);
      if (!error) throw new Error('Error not found');

      const report = {
        errorId: selectedError,
        userDescription: userDescription.trim(),
        userEmail: userEmail.trim() || 'anonymous',
        timestamp: new Date().toISOString(),
        errorDetails: {
          message: error.message,
          stack: error.stack,
          context: error.context,
          url: error.url,
          userAgent: error.userAgent
        }
      };

      // In a real application, you would send this to your error reporting service
      console.log('Error report:', report);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Report submitted",
        description: "Thank you for helping us improve the application!",
        variant: "default"
      });

      setUserDescription('');
      setSelectedError(null);
      
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again or copy the error details manually.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportLogs = () => {
    const logs = errorHandler.getErrorLogs();
    const exportData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: logs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Logs exported",
      description: "Error logs have been downloaded as a JSON file.",
      variant: "default"
    });
  };

  const handleClearLogs = () => {
    errorHandler.clearErrorLogs();
    setErrorLogs([]);
    setSelectedError(null);
    
    toast({
      title: "Logs cleared",
      description: "All error logs have been cleared.",
      variant: "default"
    });
  };

  const toggleDetails = (errorId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [errorId]: !prev[errorId]
    }));
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bug className="w-6 h-6 text-red-600" />
              <div>
                <CardTitle>Error Reporting</CardTitle>
                <CardDescription>
                  View and report application errors to help us improve your experience
                </CardDescription>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleExportLogs} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleClearLogs} variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="ghost" size="sm">
                  ✕
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorLogs.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                No errors logged. Your application is running smoothly!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="font-medium">Recent Errors ({errorLogs.length})</h3>
                
                {errorLogs.slice(-10).reverse().map((error) => (
                  <Card 
                    key={error.id}
                    className={`cursor-pointer transition-colors ${
                      selectedError === error.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedError(error.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(error.type)}>
                              {error.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(error.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className="font-medium text-sm mb-1">{error.message}</p>
                          
                          {error.context && (
                            <p className="text-xs text-muted-foreground">
                              {error.context.component} → {error.context.action}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDetails(error.id);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            {showDetails[error.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyError(error.id);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {showDetails[error.id] && (
                        <div className="mt-3 pt-3 border-t">
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                            {error.stack || 'No stack trace available'}
                          </pre>
                          
                          {error.context && (
                            <div className="mt-2 text-xs">
                              <strong>Context:</strong>
                              <pre className="mt-1 bg-gray-50 p-2 rounded">
                                {JSON.stringify(error.context, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Error Report Form */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">Report an Error</CardTitle>
                  <CardDescription className="text-blue-700">
                    Help us fix this issue by providing additional context
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="error-select">Selected Error</Label>
                    <Input
                      id="error-select"
                      value={selectedError ? 
                        errorLogs.find(e => e.id === selectedError)?.message || 'Error not found' :
                        'Please select an error above'
                      }
                      readOnly
                      className="bg-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">What were you trying to do?</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what you were doing when this error occurred..."
                      value={userDescription}
                      onChange={(e) => setUserDescription(e.target.value)}
                      className="bg-white"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSubmitReport}
                    disabled={!selectedError || !userDescription.trim() || submitting}
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Hook for accessing error reporting
export function useErrorReporting() {
  const [isVisible, setIsVisible] = useState(false);
  
  const showReporting = () => setIsVisible(true);
  const hideReporting = () => setIsVisible(false);
  
  const reportError = (error: Error, context?: unknown) => {
    errorHandler.logError(error, context);
    showReporting();
  };
  
  return {
    isVisible,
    showReporting,
    hideReporting,
    reportError
  };
}