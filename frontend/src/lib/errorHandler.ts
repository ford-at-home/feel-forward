import { toast } from '@/hooks/use-toast';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  context?: ErrorContext;
  type: 'error' | 'warning' | 'info';
  handled: boolean;
  userAgent: string;
  url: string;
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorQueue: ErrorLogEntry[] = [];
  private maxQueueSize = 50;
  private isOnline = navigator.onLine;

  private constructor() {
    this.setupGlobalHandlers();
    this.setupNetworkDetection();
  }

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      this.logError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          component: 'Global',
          action: 'unhandled_promise_rejection',
          metadata: { reason: event.reason }
        }
      );

      // Show user-friendly message
      toast({
        title: "Something went wrong",
        description: "We encountered an unexpected error. The issue has been logged.",
        variant: "destructive",
      });
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      
      this.logError(
        event.error || new Error(event.message),
        {
          component: 'Global',
          action: 'javascript_error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      );
    });

    // Handle fetch errors globally
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Log failed HTTP responses
        if (!response.ok) {
          this.logError(
            new Error(`HTTP ${response.status}: ${response.statusText}`),
            {
              component: 'Network',
              action: 'http_error',
              metadata: {
                url: args[0]?.toString(),
                status: response.status,
                statusText: response.statusText
              }
            }
          );
        }
        
        return response;
      } catch (error) {
        this.logError(
          error as Error,
          {
            component: 'Network',
            action: 'fetch_error',
            metadata: { url: args[0]?.toString() }
          }
        );
        throw error;
      }
    };
  }

  private setupNetworkDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      toast({
        title: "Connection restored",
        description: "Your internet connection has been restored.",
        variant: "default",
      });
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast({
        title: "Connection lost",
        description: "You're currently offline. Some features may not work.",
        variant: "destructive",
      });
    });
  }

  public logError(error: Error, context?: ErrorContext): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      type: 'error',
      handled: true,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Add to queue
    this.errorQueue.push(logEntry);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Store in localStorage
    this.storeErrorLocally(logEntry);

    // Try to send to server if online
    if (this.isOnline) {
      this.sendErrorToServer(logEntry);
    }

    console.error(`[${errorId}]`, error, context);
    
    return errorId;
  }

  public logWarning(message: string, context?: ErrorContext): string {
    return this.logError(new Error(message), { ...context, type: 'warning' } as any);
  }

  public logInfo(message: string, context?: ErrorContext): string {
    return this.logError(new Error(message), { ...context, type: 'info' } as any);
  }

  private storeErrorLocally(logEntry: ErrorLogEntry): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 20 errors
      if (existingLogs.length > 20) {
        existingLogs.shift();
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch (e) {
      console.warn('Could not store error log locally:', e);
    }
  }

  private async sendErrorToServer(logEntry: ErrorLogEntry): Promise<void> {
    try {
      // In a real application, replace this with your actual error reporting endpoint
      const errorReportingEndpoint = '/api/errors';
      
      await fetch(errorReportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.warn('Could not send error to server:', error);
    }
  }

  private flushErrorQueue(): void {
    const unsent = this.errorQueue.filter(entry => entry.type === 'error');
    unsent.forEach(entry => this.sendErrorToServer(entry));
  }

  public getErrorLogs(): ErrorLogEntry[] {
    return [...this.errorQueue];
  }

  public clearErrorLogs(): void {
    this.errorQueue = [];
    localStorage.removeItem('errorLogs');
  }

  public isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // Helper method for handling async operations with error logging
  public async handleAsync<T>(
    operation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.logError(error as Error, context);
      return null;
    }
  }

  // Helper method for retrying operations with exponential backoff
  public async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
    context?: ErrorContext
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          this.logError(lastError, {
            ...context,
            action: `${context?.action || 'operation'}_failed_after_retries`,
            metadata: {
              ...context?.metadata,
              maxRetries,
              finalAttempt: attempt
            }
          });
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        this.logWarning(`Retry attempt ${attempt + 1}/${maxRetries} for operation`, {
          ...context,
          metadata: {
            ...context?.metadata,
            attempt: attempt + 1,
            delay,
            error: lastError.message
          }
        });
      }
    }
    
    throw lastError!;
  }
}

// Export singleton instance
export const errorHandler = GlobalErrorHandler.getInstance();

// Utility functions for easier usage
export const logError = (error: Error, context?: ErrorContext) => 
  errorHandler.logError(error, context);

export const logWarning = (message: string, context?: ErrorContext) => 
  errorHandler.logWarning(message, context);

export const logInfo = (message: string, context?: ErrorContext) => 
  errorHandler.logInfo(message, context);

export const handleAsync = <T>(operation: () => Promise<T>, context?: ErrorContext) => 
  errorHandler.handleAsync(operation, context);

export const retryOperation = <T>(
  operation: () => Promise<T>,
  maxRetries?: number,
  baseDelay?: number,
  context?: ErrorContext
) => errorHandler.retryOperation(operation, maxRetries, baseDelay, context);