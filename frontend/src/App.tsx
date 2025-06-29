import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { errorHandler } from "@/lib/errorHandler";

// Enhanced QueryClient with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        // Don't retry mutations on client errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 2; // Only retry mutations twice
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Global query error handler
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'queryError') {
    errorHandler.logError(event.error as Error, {
      component: 'ReactQuery',
      action: 'query_error',
      metadata: {
        queryKey: event.query?.queryKey,
        queryHash: event.query?.queryHash,
      }
    });
  }
});

const App = () => (
  <ErrorBoundary 
    onError={(error, errorInfo) => {
      errorHandler.logError(error, {
        component: 'App',
        action: 'app_crash',
        metadata: {
          componentStack: errorInfo.componentStack
        }
      });
    }}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Global network status indicator */}
        <div className="fixed top-4 right-4 z-50">
          <NetworkStatus compact />
        </div>
        
        <ErrorBoundary
          onError={(error, errorInfo) => {
            errorHandler.logError(error, {
              component: 'Router',
              action: 'route_error',
              metadata: {
                pathname: window.location.pathname,
                componentStack: errorInfo.componentStack
              }
            });
          }}
        >
          <BrowserRouter>
            <Routes>
              <Route 
                path="/" 
                element={
                  <ErrorBoundary
                    onError={(error, errorInfo) => {
                      errorHandler.logError(error, {
                        component: 'Index',
                        action: 'page_error',
                        metadata: {
                          componentStack: errorInfo.componentStack
                        }
                      });
                    }}
                  >
                    <Index />
                  </ErrorBoundary>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
