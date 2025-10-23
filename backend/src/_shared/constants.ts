/**
 * Shared Constants
 * 
 * This file contains all application constants used across the CV Builder API.
 * It includes HTTP status codes, API messages, user roles, CV statuses, and more.
 * 
 * Business Logic Constants:
 * - HTTP status codes for consistent API responses
 * - Standardized API messages for user feedback
 * - User roles and permissions for access control
 * - CV statuses and layouts for content management
 * - OAuth providers for social authentication
 * - File types and validation rules
 * 
 * @fileoverview Shared constants for CV Builder API
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

/**
 * HTTP Status Codes
 * 
 * Business Logic:
 * - Standard HTTP status codes for API responses
 * - Ensures consistent error handling across the application
 * - Provides clear communication of request outcomes
 * 
 * @constant HTTP_STATUS
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  PAYMENT_REQUIRED: 402,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * API Response Messages
 * 
 * Business Logic:
 * - Standardized messages for consistent user experience
 * - Provides clear feedback for all API operations
 * - Supports internationalization and localization
 * 
 * @constant API_MESSAGES
 */
export const API_MESSAGES = {
  SUCCESS: 'Success',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  BAD_REQUEST: 'Bad request',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource already exists',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  PAYMENT_REQUIRED: 'Payment required for this action',
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  PREMIUM: 'premium',
} as const;

// CV Status
export const CV_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// CV Layout Types
export const CV_LAYOUTS = {
  MODERN: 'modern',
  CLASSIC: 'classic',
  CREATIVE: 'creative',
} as const;

// File Upload Types
export const FILE_TYPES = {
  IMAGE: 'image',
  PDF: 'pdf',
  DOCUMENT: 'document',
} as const;

// Allowed File Extensions
export const ALLOWED_EXTENSIONS = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  PDF: ['.pdf'],
  DOCUMENT: ['.doc', '.docx'],
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false,
} as const;

// JWT Token Types
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

// OAuth Providers
export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
} as const;

// CV Sections
export const CV_SECTIONS = {
  BASIC_DETAILS: 'basic_details',
  EDUCATION: 'education',
  EXPERIENCE: 'experience',
  PROJECTS: 'projects',
  SKILLS: 'skills',
  SOCIAL_PROFILES: 'social_profiles',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^\+?[\d\s\-\(\)]+$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
  },
  SKILL_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  PROJECT_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  ORGANIZATION_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
} as const;

// Business Rules
export const BUSINESS_RULES = {
  MAX_CVS_PER_USER: 10,
  MAX_EDUCATION_ENTRIES: 10,
  MAX_EXPERIENCE_ENTRIES: 20,
  MAX_PROJECT_ENTRIES: 15,
  MAX_SKILL_ENTRIES: 50,
  MAX_SOCIAL_PROFILE_ENTRIES: 10,
  FREE_DOWNLOADS_PER_MONTH: 3,
  FREE_SHARES_PER_MONTH: 5,
  PREMIUM_DOWNLOADS_PER_MONTH: 50,
  PREMIUM_SHARES_PER_MONTH: 100,
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_CVS: (userId: string) => `user:cvs:${userId}`,
  CV_DATA: (cvId: string) => `cv:data:${cvId}`,
  CV_LAYOUTS: 'cv:layouts',
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  USER_PROFILE: 3600, // 1 hour
  USER_CVS: 1800, // 30 minutes
  CV_DATA: 1800, // 30 minutes
  CV_LAYOUTS: 86400, // 24 hours
} as const;
