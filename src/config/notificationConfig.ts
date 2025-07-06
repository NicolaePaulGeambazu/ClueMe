/**
 * Notification Service Configuration
 * 
 * This file contains configuration for the notification service endpoints and API keys.
 * Update these values based on your backend setup and environment.
 */

export interface NotificationConfig {
  // Backend URLs for different environments
  devBackendUrl: string;
  prodBackendUrl: string;
  
  // API Keys for authentication
  apiKey: string;
  
  // Firebase Cloud Functions URLs (alternative to custom backend)
  devCloudFunctionUrl: string;
  prodCloudFunctionUrl: string;
  
  // Notification service endpoints
  sendNotificationEndpoint: string;
  
  // Retry configuration
  maxRetries: number;
  retryDelayMs: number;
  
  // Timeout configuration
  requestTimeoutMs: number;
}

// Default configuration - UPDATE THESE VALUES FOR YOUR SETUP
const defaultConfig: NotificationConfig = {
  // Replace with your actual backend URLs
  devBackendUrl: 'https://your-dev-backend.com',
  prodBackendUrl: 'https://your-prod-backend.com',
  
  // Replace with your actual API key
  apiKey: 'your-api-key-here',
  
  // Firebase Cloud Functions URLs (if using Firebase Cloud Functions)
  devCloudFunctionUrl: 'https://us-central1-clearcue-dev.cloudfunctions.net',
  prodCloudFunctionUrl: 'https://us-central1-clearcue-prod.cloudfunctions.net',
  
  // Notification endpoint
  sendNotificationEndpoint: '/sendNotification',
  
  // Retry configuration
  maxRetries: 3,
  retryDelayMs: 1000,
  
  // Timeout configuration
  requestTimeoutMs: 10000, // 10 seconds
};

/**
 * Get the notification service URL based on environment
 */
export function getNotificationServiceUrl(): string {
  const baseUrl = __DEV__ 
    ? defaultConfig.devBackendUrl 
    : defaultConfig.prodBackendUrl;
  
  return `${baseUrl}${defaultConfig.sendNotificationEndpoint}`;
}

/**
 * Get the Firebase Cloud Function URL based on environment
 */
export function getCloudFunctionUrl(): string {
  return __DEV__ 
    ? defaultConfig.devCloudFunctionUrl 
    : defaultConfig.prodCloudFunctionUrl;
}

/**
 * Get the API key for authentication
 */
export function getApiKey(): string {
  return defaultConfig.apiKey;
}

/**
 * Get retry configuration
 */
export function getRetryConfig() {
  return {
    maxRetries: defaultConfig.maxRetries,
    retryDelayMs: defaultConfig.retryDelayMs,
  };
}

/**
 * Get timeout configuration
 */
export function getTimeoutConfig() {
  return {
    requestTimeoutMs: defaultConfig.requestTimeoutMs,
  };
}

/**
 * Validate configuration
 */
export function validateNotificationConfig(): boolean {
  const requiredFields = [
    'devBackendUrl',
    'prodBackendUrl',
    'apiKey',
  ];
  
  for (const field of requiredFields) {
    if (!defaultConfig[field as keyof NotificationConfig] || 
        defaultConfig[field as keyof NotificationConfig] === `your-${field.replace(/([A-Z])/g, '-$1').toLowerCase()}-here`) {
      console.warn(`⚠️ Notification config: ${field} is not configured properly`);
      return false;
    }
  }
  
  return true;
}

/**
 * Get configuration for debugging
 */
export function getDebugConfig() {
  return {
    ...defaultConfig,
    apiKey: defaultConfig.apiKey.substring(0, 8) + '...', // Hide full API key
  };
}

export default defaultConfig; 