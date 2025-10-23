/**
 * Environment Configuration
 * 
 * This file defines environment variables for the CV Builder frontend application.
 * It provides configuration for API endpoints, feature flags, and other
 * environment-specific settings.
 * 
 * Business Logic:
 * - Defines API base URL for backend communication
 * - Sets up environment-specific configurations
 * - Provides fallback values for development
 * - Enables feature flags and debugging options
 * - Manages different environments (dev, staging, production)
 * 
 * @fileoverview Environment configuration for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

/**
 * Environment configuration object
 * 
 * Business Logic:
 * - Centralizes all environment variables
 * - Provides type safety for configuration
 * - Enables easy switching between environments
 * - Includes fallback values for development
 * 
 * @constant config
 * @author Vicky
 */
export const config = {
  // API Configuration
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
  },
  
  // Application Configuration
  app: {
    name: 'CV Builder',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
  },
  
  // Feature Flags
  features: {
    enableOAuth: process.env.REACT_APP_ENABLE_OAUTH === 'true',
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    enablePWA: process.env.REACT_APP_ENABLE_PWA === 'true',
  },
  
  // External Services
  services: {
    googleAnalyticsId: process.env.REACT_APP_GA_ID || '',
    sentryDsn: process.env.REACT_APP_SENTRY_DSN || '',
  },
} as const;

/**
 * Validate required environment variables
 * 
 * Business Logic:
 * - Checks for required environment variables
 * - Provides helpful error messages
 * - Ensures application can start properly
 * - Helps with debugging configuration issues
 * 
 * @author Vicky
 */
export const validateEnvironment = (): void => {
  const requiredVars = [
    'REACT_APP_API_URL',
  ];
  
  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.warn(
      '⚠️ Missing environment variables:',
      missingVars.join(', ')
    );
    console.warn(
      'Using fallback values. Some features may not work correctly.'
    );
  }
  
  if (config.app.debug) {
    console.log('🔧 Environment Configuration:', config);
  }
};

// Validate environment on module load
validateEnvironment();

export default config;
