/**
 * Shared Type Definitions
 * 
 * This file contains all TypeScript type definitions used across the CV Builder API.
 * It includes interfaces for entities, requests, responses, and authentication.
 * 
 * Business Logic Types:
 * - User and CV entity definitions with proper typing
 * - Request/Response interfaces for API endpoints
 * - Authentication and JWT payload types
 * - OAuth and social login type definitions
 * - Validation and error handling types
 * - Database query and pagination types
 * 
 * @fileoverview Shared type definitions for CV Builder API
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import { Request } from 'express';
import { USER_ROLES, CV_STATUS, CV_LAYOUTS, OAUTH_PROVIDERS } from './constants';

/**
 * Base entity interface with common fields
 * 
 * Business Logic:
 * - Provides common fields for all database entities
 * - Ensures consistent ID and timestamp management
 * - Used as foundation for User, CV, and other entities
 * 
 * @interface BaseEntity
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * User entity interface
 * 
 * Business Logic:
 * - Defines user account structure and properties
 * - Includes authentication and profile information
 * - Supports OAuth integration and role-based access
 * - Manages user status and verification state
 * 
 * @interface User
 * @extends BaseEntity
 */
export interface User extends BaseEntity {
  username: string;
  email: string;
  password_hash?: string;
  contact_number?: string;
  role: typeof USER_ROLES[keyof typeof USER_ROLES];
  is_verified: boolean;
  profile_image_url?: string;
  oauth_provider?: keyof typeof OAUTH_PROVIDERS;
  oauth_id?: string;
  last_login?: string;
  is_active: boolean;
}

/**
 * CV (Curriculum Vitae) entity interface
 * 
 * Business Logic:
 * - Defines CV structure and content properties
 * - Manages CV status and version control
 * - Includes sharing and access control features
 * - Tracks usage statistics and analytics
 * 
 * @interface CV
 * @extends BaseEntity
 */
export interface CV extends BaseEntity {
  user_id: string;
  title: string;
  layout: 'modern' | 'classic' | 'creative';
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  download_count: number;
  share_count: number;
  last_modified: string;
}

// Basic Details Interface
export interface BasicDetails {
  id: string;
  cv_id: string;
  profile_image_url?: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  introduction?: string;
}

// Education Interface
export interface Education {
  id: string;
  cv_id: string;
  degree_name: string;
  institution: string;
  percentage?: number;
  cgpa?: number;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
}

// Experience Interface
export interface Experience {
  id: string;
  cv_id: string;
  organization_name: string;
  position: string;
  joining_location?: string;
  ctc?: string;
  joining_date: string;
  leaving_date?: string;
  is_current: boolean;
  technologies?: string[];
  description?: string;
}

// Project Interface
export interface Project {
  id: string;
  cv_id: string;
  title: string;
  team_size?: number;
  duration?: string;
  technologies?: string[];
  description?: string;
  project_url?: string;
  github_url?: string;
}

// Skill Interface
export interface Skill {
  id: string;
  cv_id: string;
  skill_name: string;
  proficiency_percentage: number;
  category: 'technical' | 'interpersonal' | 'language';
}

// Social Profile Interface
export interface SocialProfile {
  id: string;
  cv_id: string;
  platform_name: string;
  profile_url: string;
  is_public: boolean;
}

// Complete CV Data Interface
export interface CVData {
  cv: CV;
  basic_details: BasicDetails;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
  social_profiles: SocialProfile[];
}

// API Response Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Authentication Interfaces
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  contact_number?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// JWT Payload Interface
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: typeof USER_ROLES[keyof typeof USER_ROLES];
  iat: number;
  exp: number;
}

// Request with User Interface
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// File Upload Interface
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Validation Error Interface
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Database Query Options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// CV Creation/Update Interfaces
export interface CreateCVRequest {
  title: string;
  layout: 'modern' | 'classic' | 'creative';
  basic_details: Omit<BasicDetails, 'id' | 'cv_id'>;
  education?: Omit<Education, 'id' | 'cv_id'>[];
  experience?: Omit<Experience, 'id' | 'cv_id'>[];
  projects?: Omit<Project, 'id' | 'cv_id'>[];
  skills?: Omit<Skill, 'id' | 'cv_id'>[];
  social_profiles?: Omit<SocialProfile, 'id' | 'cv_id'>[];
}

export interface UpdateCVRequest {
  title?: string;
  layout?: 'modern' | 'classic' | 'creative';
  status?: 'draft' | 'published' | 'archived';
  is_public?: boolean;
  basic_details?: Partial<Omit<BasicDetails, 'id' | 'cv_id'>>;
  education?: Omit<Education, 'id' | 'cv_id'>[];
  experience?: Omit<Experience, 'id' | 'cv_id'>[];
  projects?: Omit<Project, 'id' | 'cv_id'>[];
  skills?: Omit<Skill, 'id' | 'cv_id'>[];
  social_profiles?: Omit<SocialProfile, 'id' | 'cv_id'>[];
}

// Payment Interface (for future implementation)
export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  cv_id?: string;
  action_type: 'download' | 'share' | 'premium_upgrade';
}

// Email Template Interface
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// OAuth Profile Interface
export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: keyof typeof OAUTH_PROVIDERS;
}

// Cache Interface
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  flush(): Promise<void>;
}

// Logger Interface
export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}
