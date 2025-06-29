// Configuration validation and environment variables

export interface AppConfig {
  apiUrl: string;
  appName: string;
  appVersion: string;
  environment: 'development' | 'production';
  domain: string;
  baseUrl: string;
  enableDevtools: boolean;
  enableLogging: boolean;
}

// Get configuration from environment variables
export const getConfig = (): AppConfig => {
  const config: AppConfig = {
    apiUrl: import.meta.env.VITE_API_URL || 'https://api.felfwd.app',
    appName: import.meta.env.VITE_APP_NAME || 'Feel Forward Flow',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: (import.meta.env.VITE_APP_ENVIRONMENT as 'development' | 'production') || 'production',
    domain: import.meta.env.VITE_DOMAIN || 'felfwd.app',
    baseUrl: import.meta.env.VITE_BASE_URL || 'https://felfwd.app',
    enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
  };

  // Validate required configuration
  if (!config.apiUrl) {
    throw new Error('VITE_API_URL is required');
  }

  // Log configuration in development
  if (config.enableLogging) {
    console.log('App Configuration:', {
      ...config,
      // Don't log sensitive information
    });
  }

  return config;
};

// Export singleton configuration
export const config = getConfig();

// Utility functions
export const isDevelopment = () => config.environment === 'development';
export const isProduction = () => config.environment === 'production';
export const getApiUrl = () => config.apiUrl;
export const getBaseUrl = () => config.baseUrl;