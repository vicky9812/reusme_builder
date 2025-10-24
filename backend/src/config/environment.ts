/**
 * Environment Configuration
 *
 * Business Logic:
 * - Loads and validates environment variables for the app
 * - Exposes typed config used throughout the server
 *
 * Code Conventions:
 * - Do not read process.env outside this module
 *
 * @fileoverview Centralized env config
 * @author vicky neosoft test builder app
 */
/**
 * Environment Configuration
 * 
 * This file handles all environment variable configuration and validation.
 * It provides type-safe access to configuration values throughout the application.
 * 
 * Business Logic:
 * - Loads and validates environment variables
 * - Provides type-safe configuration interface
 * - Handles different environments (development, production, test)
 * - Validates required configuration values
 * - Provides default values where appropriate
 * 
 * @fileoverview Environment configuration for CV Builder API
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
// Look for .env file in the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment configuration interface
 * 
 * Business Logic:
 * - Defines structure for all application configuration
 * - Ensures type safety for configuration access
 * - Groups related configuration values logically
 * 
 * @interface EnvironmentConfig
 */
export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
    };
    facebook: {
      appId: string;
      appSecret: string;
    };
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
  };
  upload: {
    maxFileSize: number;
    uploadPath: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string;
  };
  payment: {
    stripeSecretKey: string;
    stripePublishableKey: string;
  };
}

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

// Validate required environment variables
const validateEnvironment = (): void => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Validate environment on module load
validateEnvironment();

export const config: EnvironmentConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID!,
      appSecret: process.env.FACEBOOK_APP_SECRET!,
    },
  },
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  payment: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },
};

export default config;
