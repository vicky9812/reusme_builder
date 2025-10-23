/**
 * TypeScript Type Definitions
 * @fileoverview Type definitions for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

// ==================== API Response Types ====================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

// ==================== Authentication Types ====================

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_image_url?: string;
  contact_number?: string;
}

// ==================== CV Types ====================

export interface CV {
  id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  layout: 'modern' | 'classic' | 'creative';
  is_public: boolean;
  download_count: number;
  share_count: number;
  last_modified: string;
  created_at: string;
  updated_at: string;
}

export interface CVContent {
  personal_info: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
}

export interface PersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  linkedin?: string;
  github?: string;
  website?: string;
  profile_image?: string;
}

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

export interface Skill {
  id: string;
  cv_id: string;
  skill_name: string;
  proficiency_percentage: number;
  category: 'technical' | 'interpersonal' | 'language';
}

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

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Professional' | 'Native';
}

// ==================== Request Types ====================

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

export interface BasicDetails {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  introduction?: string;
  profile_image_url?: string;
}

export interface SocialProfile {
  id: string;
  cv_id: string;
  platform_name: string;
  profile_url: string;
  is_public: boolean;
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

// ==================== CV Data Types ====================

export interface CVData {
  cv: CV;
  basic_details: BasicDetails;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
  social_profiles: SocialProfile[];
}

// ==================== Dashboard Types ====================

export interface DashboardStats {
  total_cvs: number;
  published_cvs: number;
  draft_cvs: number;
  archived_cvs: number;
  total_downloads: number;
  total_shares: number;
  total_views: number;
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'published' | 'downloaded' | 'shared';
  cv_id: string;
  cv_title: string;
  timestamp: string;
  description: string;
}

// ==================== Form Types ====================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  contact_number?: string;
}

export interface ForgotPasswordFormData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

// ==================== Layout Types ====================

export interface Layout {
  id: string;
  name: string;
  description: string;
  preview_url: string;
}

// ==================== Error Types ====================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
