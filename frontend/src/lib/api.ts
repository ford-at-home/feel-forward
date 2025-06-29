
import { getApiUrl, config } from './config';
import { errorHandler, logError, retryOperation } from './errorHandler';

const API_BASE_URL = getApiUrl();

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

interface Factor {
  category: string;
  items: string[];
}

interface Scenario {
  id: string;
  title: string;
  text: string;
}

interface Preference {
  factor: string;
  importance: number;
  hasLimit: boolean;
  limit: string;
  tradeoff: string;
}

interface Reaction {
  scenario_id: string;
  excitement: number;
  anxiety: number;
  body: string;
  freeform: string;
}

// API Request/Response Types
interface Phase0Request {
  topic: string;
}

interface Phase0Response {
  factors: Factor[];
}

interface Phase1Request {
  preferences: Preference[];
  topic: string;
}

interface Phase1Response {
  success: boolean;
  message?: string;
}

interface Phase2Request {
  preferences: Preference[];
  topic: string;
}

interface Phase2Response {
  scenarios: Scenario[];
}

interface Phase3Request extends Reaction {}

interface Phase3Response {
  success: boolean;
  message?: string;
}

interface Phase4Request {
  reactions: Reaction[];
  preferences: Preference[];
}

interface Phase4Response {
  summary: string;
}

interface HealthResponse {
  status: string;
  healthy: boolean;
}

class ApiClient {
  private isHealthy = false;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY = 1000; // 1 second

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    return this.makeRequestWithRetry('POST', endpoint, data);
  }

  private async makeRequestWithRetry<T = any>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any,
    retryCount = 0
  ): Promise<T> {
    const context = {
      component: 'ApiClient',
      action: `${method.toLowerCase()}_request`,
      metadata: { endpoint, retryCount, data: data ? 'present' : 'none' }
    };

    if (config.enableLogging) {
      console.log(`API ${method} request to ${endpoint}:`, data);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      };

      if (method === 'POST' && data) {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMessage = await response.text().catch(() => 'Unknown error');
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).status = response.status;
        (enhancedError as any).statusText = response.statusText;

        if (response.status === 429) {
          // Rate limit - retry with exponential backoff
          if (retryCount < this.MAX_RETRIES) {
            const delay = this.calculateRetryDelay(retryCount);
            logError(enhancedError, {
              ...context,
              action: 'rate_limit_retry',
              metadata: { ...context.metadata, delay, nextAttempt: retryCount + 1 }
            });
            
            if (config.enableLogging) {
              console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
            }
            await this.sleep(delay);
            return this.makeRequestWithRetry(method, endpoint, data, retryCount + 1);
          }
          
          logError(enhancedError, {
            ...context,
            action: 'rate_limit_exceeded',
            metadata: { ...context.metadata, finalAttempt: true }
          });
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        
        if (response.status >= 500) {
          // Server error - retry
          if (retryCount < this.MAX_RETRIES) {
            const delay = this.calculateRetryDelay(retryCount);
            logError(enhancedError, {
              ...context,
              action: 'server_error_retry',
              metadata: { ...context.metadata, delay, nextAttempt: retryCount + 1 }
            });
            
            if (config.enableLogging) {
              console.log(`Server error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
            }
            await this.sleep(delay);
            return this.makeRequestWithRetry(method, endpoint, data, retryCount + 1);
          }
          
          logError(enhancedError, {
            ...context,
            action: 'server_error_final',
            metadata: { ...context.metadata, finalAttempt: true }
          });
          throw new Error('Server error. Please try again later.');
        }
        
        // Client errors (4xx) - don't retry
        logError(enhancedError, {
          ...context,
          action: 'client_error',
          metadata: { ...context.metadata, noRetry: true }
        });
        
        if (response.status === 400) {
          throw new Error('Invalid request. Please check your input and try again.');
        }
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in and try again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. You don\'t have permission to perform this action.');
        }
        if (response.status === 404) {
          throw new Error('Resource not found. The requested item may have been moved or deleted.');
        }
        
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (config.enableLogging) {
        console.log(`API response from ${endpoint}:`, result);
      }
      this.isHealthy = true;
      return result;
    } catch (error) {
      if (config.enableLogging) {
        console.error(`API error for ${endpoint}:`, error);
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const timeoutError = new Error('Request timed out. Please check your connection and try again.');
          logError(timeoutError, {
            ...context,
            action: 'request_timeout',
            metadata: { ...context.metadata, timeout: '10s' }
          });
          throw timeoutError;
        }
        
        if (error.message === 'Failed to fetch') {
          this.isHealthy = false;
          const networkError = new Error('Unable to connect to server. Please check your internet connection.');
          
          // Network error - retry
          if (retryCount < this.MAX_RETRIES) {
            const delay = this.calculateRetryDelay(retryCount);
            logError(error, {
              ...context,
              action: 'network_error_retry',
              metadata: { ...context.metadata, delay, nextAttempt: retryCount + 1 }
            });
            
            if (config.enableLogging) {
              console.log(`Network error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
            }
            await this.sleep(delay);
            return this.makeRequestWithRetry(method, endpoint, data, retryCount + 1);
          }
          
          logError(networkError, {
            ...context,
            action: 'network_error_final',
            metadata: { ...context.metadata, finalAttempt: true }
          });
          throw networkError;
        }
      }
      
      // Log any other unexpected errors
      logError(error as Error, {
        ...context,
        action: 'unexpected_error',
        metadata: { ...context.metadata, errorName: (error as Error).name }
      });
      
      throw error;
    }
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter: base_delay * (2^retry_count) + random(0, 1000)
    const exponentialDelay = this.BASE_RETRY_DELAY * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.makeRequestWithRetry('GET', endpoint);
  }

  async healthCheck(): Promise<HealthResponse> {
    const now = Date.now();
    
    // Don't check health too frequently
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL && this.isHealthy) {
      return { status: 'online', healthy: true };
    }

    try {
      if (config.enableLogging) {
        console.log('Performing health check...');
      }
      const result = await this.get<HealthResponse>('/health');
      this.lastHealthCheck = now;
      this.isHealthy = true;
      if (config.enableLogging) {
        console.log('Health check successful:', result);
      }
      return { status: 'online', healthy: true };
    } catch (error) {
      if (config.enableLogging) {
        console.log('Health check failed:', error);
      }
      this.lastHealthCheck = now;
      this.isHealthy = false;
      return { status: 'offline', healthy: false };
    }
  }

  // Typed API methods for each endpoint
  async getFactors(request: Phase0Request): Promise<Phase0Response> {
    return this.post<Phase0Response>('/phase0/factors', request);
  }

  async savePreferences(request: Phase1Request): Promise<Phase1Response> {
    return this.post<Phase1Response>('/phase1/preferences', request);
  }

  async generateScenarios(request: Phase2Request): Promise<Phase2Response> {
    return this.post<Phase2Response>('/phase2/scenarios', request);
  }

  async saveReaction(request: Phase3Request): Promise<Phase3Response> {
    return this.post<Phase3Response>('/phase3/reactions', request);
  }

  async generateSummary(request: Phase4Request): Promise<Phase4Response> {
    return this.post<Phase4Response>('/phase4/summary', request);
  }

  isApiHealthy(): boolean {
    return this.isHealthy;
  }
}

export const apiClient = new ApiClient();
