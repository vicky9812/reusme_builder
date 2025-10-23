/**
 * API Service
 * 
 * This service handles all HTTP communication with the CV Builder backend API.
 * It provides methods for authentication, CV management, and user operations
 * with proper error handling, request/response interceptors, and token management.
 * 
 * Business Logic:
 * - Manages JWT token storage and automatic inclusion in requests
 * - Handles token refresh and automatic logout on expiration
 * - Provides centralized error handling for API responses
 * - Implements request/response interceptors for logging and debugging
 * - Manages API base URL and endpoint configuration
 * - Handles different HTTP methods with proper typing
 * 
 * @fileoverview API service for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { config } from '../config/environment';
import { 
  User, 
  CV, 
  CVData,
  CreateCVRequest, 
  UpdateCVRequest, 
  DashboardStats,
  AuthResponse,
  Layout
} from '../types';

/**
 * API Response interface for consistent response handling
 * 
 * Business Logic:
 * - Standardizes API response format across all endpoints
 * - Provides type safety for success and error responses
 * - Includes metadata for pagination and additional information
 * 
 * @interface ApiResponse
 * @author Vicky
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/**
 * User registration request interface
 * 
 * Business Logic:
 * - Defines required fields for user registration
 * - Ensures type safety for form validation
 * - Matches backend API expectations
 * 
 * @interface RegisterRequest
 * @author Vicky
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  contact_number?: string;
}

/**
 * User login request interface
 * 
 * Business Logic:
 * - Supports both username and email login
 * - Ensures type safety for authentication
 * - Matches backend API expectations
 * 
 * @interface LoginRequest
 * @author Vicky
 */
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

/**
 * API Service class
 * 
 * Handles all HTTP communication with the backend API
 * 
 * @class ApiService
 * @author Vicky
 */
class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  /**
   * Constructor initializes the Axios instance with configuration
   * 
   * Business Logic:
   * - Sets up base URL for API requests
   * - Configures request/response interceptors
   * - Sets up default headers and timeout
   * - Handles token management automatically
   * 
   * @constructor
   * @author Vicky
   */
  constructor() {
    this.baseURL = config.api.baseURL;
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   * 
   * Business Logic:
   * - Adds JWT token to all authenticated requests
   * - Handles token refresh automatically
   * - Provides global error handling
   * - Logs requests and responses in development
   * 
   * @private
   * @author Vicky
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log requests in development
        if (process.env.NODE_ENV === 'development') {
          console.log('API Request:', config.method?.toUpperCase(), config.url);
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and token refresh
    this.api.interceptors.response.use(
      (response) => {
        // Log responses in development
        if (process.env.NODE_ENV === 'development') {
          console.log('API Response:', response.status, response.config.url);
        }
        
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Try to refresh token
          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              if (response.data?.access_token) {
                this.setToken(response.data.access_token);
                return this.api(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        // Handle other errors
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle API errors globally
   * 
   * Business Logic:
   * - Shows appropriate error messages to users
   * - Logs errors for debugging
   * - Handles different error types appropriately
   * - Provides fallback error messages
   * 
   * @private
   * @param {any} error - The error object from Axios
   * @author Vicky
   */
  private handleError(error: any): void {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Don't show toast for 401 errors (handled by interceptor)
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    console.error('API Error:', error);
  }

  /**
   * Get stored JWT token
   * 
   * Business Logic:
   * - Retrieves token from localStorage
   * - Handles cases where token might not exist
   * - Returns null if token is invalid or expired
   * 
   * @private
   * @returns {string | null} The JWT token or null
   * @author Vicky
   */
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get stored refresh token
   * 
   * Business Logic:
   * - Retrieves refresh token from localStorage
   * - Used for automatic token refresh
   * - Returns null if refresh token doesn't exist
   * 
   * @private
   * @returns {string | null} The refresh token or null
   * @author Vicky
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Store JWT token in localStorage
   * 
   * Business Logic:
   * - Saves access token for authenticated requests
   * - Updates token in localStorage
   * - Used after successful login or token refresh
   * 
   * @private
   * @param {string} token - The JWT token to store
   * @author Vicky
   */
  private setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  /**
   * Store refresh token in localStorage
   * 
   * Business Logic:
   * - Saves refresh token for token renewal
   * - Used for automatic token refresh
   * - Stored separately from access token
   * 
   * @private
   * @param {string} token - The refresh token to store
   * @author Vicky
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  /**
   * Clear all stored tokens
   * 
   * Business Logic:
   * - Removes all authentication tokens
   * - Used for logout functionality
   * - Clears user session data
   * 
   * @private
   * @author Vicky
   */
  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Generic HTTP request method
   * 
   * Business Logic:
   * - Provides unified interface for all HTTP requests
   * - Handles different HTTP methods (GET, POST, PUT, DELETE)
   * - Ensures consistent error handling and response format
   * - Supports custom headers and configuration
   * 
   * @private
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint URL
   * @param {any} data - Request data
   * @param {AxiosRequestConfig} config - Additional Axios configuration
   * @returns {Promise<ApiResponse<T>>} Promise resolving to API response
   * @author Vicky
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.request({
        method,
        url,
        data,
        ...config,
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Authentication Methods

  /**
   * Register a new user
   * 
   * Business Logic:
   * - Sends user registration data to backend
   * - Stores authentication tokens on success
   * - Returns user data and access token
   * - Handles validation errors appropriately
   * 
   * @param {RegisterRequest} userData - User registration data
   * @returns {Promise<{access_token: string, user: User}>} Promise resolving to authentication response
   * @author Vicky
   */
  async register(userData: RegisterRequest): Promise<{access_token: string, user: User}> {
    const response = await this.request<AuthResponse>('POST', '/auth/register', userData);
    
    if (response.success && response.data) {
      this.setToken(response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return {
        access_token: response.data.access_token,
        user: response.data.user
      };
    }
    
    throw new Error('Registration failed');
  }

  /**
   * Login user with credentials
   * 
   * Business Logic:
   * - Authenticates user with username/email and password
   * - Stores authentication tokens on success
   * - Returns user data and access token
   * - Handles invalid credentials appropriately
   * 
   * @param {LoginRequest} credentials - User login credentials
   * @returns {Promise<{access_token: string, user: User}>} Promise resolving to authentication response
   * @author Vicky
   */
  async login(credentials: LoginRequest): Promise<{access_token: string, user: User}> {
    const response = await this.request<AuthResponse>('POST', '/auth/login', credentials);
    
    if (response.success && response.data) {
      this.setToken(response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return {
        access_token: response.data.access_token,
        user: response.data.user
      };
    }
    
    throw new Error('Login failed');
  }

  /**
   * Refresh access token using refresh token
   * 
   * Business Logic:
   * - Uses refresh token to get new access token
   * - Updates stored tokens
   * - Handles token refresh failures
   * - Used automatically by interceptors
   * 
   * @param {string} refreshToken - The refresh token
   * @returns {Promise<ApiResponse<{access_token: string}>>} Promise resolving to new token
   * @author Vicky
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{access_token: string}>> {
    const response = await this.request<{access_token: string}>(
      'POST', 
      '/auth/refresh', 
      { refresh_token: refreshToken }
    );
    
    if (response.success && response.data) {
      this.setToken(response.data.access_token);
    }
    
    return response;
  }

  /**
   * Request password reset with OTP
   * 
   * Business Logic:
   * - Sends email to backend for OTP generation
   * - Returns OTP details for development
   * - Handles user not found scenarios
   * 
   * @param {string} email - User's email address
   * @returns {Promise<{otp: string, expires_at: string}>} Promise resolving to OTP details
   * @author Vicky
   */
  async requestPasswordReset(email: string): Promise<{otp: string, expires_at: string}> {
    const response = await this.request<{otp: string, expires_at: string}>(
      'POST', 
      '/auth/request-password-reset', 
      { email }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to request password reset');
  }

  /**
   * Verify OTP for password reset
   * 
   * Business Logic:
   * - Verifies OTP code with backend
   * - Returns reset token for password change
   * - Handles invalid/expired OTP scenarios
   * 
   * @param {string} email - User's email address
   * @param {string} otp - 4-digit OTP code
   * @returns {Promise<{reset_token: string, expires_at: string}>} Promise resolving to reset token
   * @author Vicky
   */
  async verifyOTP(email: string, otp: string): Promise<{reset_token: string, expires_at: string}> {
    const response = await this.request<{reset_token: string, expires_at: string}>(
      'POST', 
      '/auth/verify-otp', 
      { email, otp }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to verify OTP');
  }

  /**
   * Reset password using reset token
   * 
   * Business Logic:
   * - Uses reset token to change password
   * - Validates new password requirements
   * - Handles invalid/expired token scenarios
   * 
   * @param {string} resetToken - Reset token from OTP verification
   * @param {string} newPassword - New password
   * @returns {Promise<void>} Promise resolving when password is reset
   * @author Vicky
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const response = await this.request<void>(
      'POST', 
      '/auth/reset-password', 
      { reset_token: resetToken, new_password: newPassword }
    );
    
    if (!response.success) {
      throw new Error('Failed to reset password');
    }
  }

  /**
   * Logout user and clear tokens
   * 
   * Business Logic:
   * - Sends logout request to backend
   * - Clears all stored tokens and user data
   * - Redirects to login page
   * - Handles logout errors gracefully
   * 
   * @returns {Promise<void>} Promise that resolves when logout is complete
   * @author Vicky
   */
  async logout(): Promise<void> {
    try {
      await this.request('POST', '/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Check if user is authenticated
   * 
   * Business Logic:
   * - Checks if valid token exists in localStorage
   * - Validates token format
   * - Returns authentication status
   * - Used for route protection
   * 
   * @returns {boolean} True if user is authenticated
   * @author Vicky
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Get current user data from localStorage
   * 
   * Business Logic:
   * - Retrieves stored user data
   * - Returns null if no user data exists
   * - Used for displaying user information
   * - Handles JSON parsing errors
   * 
   * @returns {any | null} User data or null
   * @author Vicky
   */
  getCurrentUser(): any | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // ==================== CV Management ====================

  /**
   * Get all CVs for the authenticated user
   * 
   * Business Logic:
   * - Fetches all CVs belonging to the authenticated user
   * - Returns array of CV objects with metadata
   * - Used for displaying CV list in dashboard
   * - Handles authentication and authorization
   * 
   * @returns {Promise<ApiResponse<CV[]>>} Array of CVs
   * @author Vicky
   */
  async getCVs(): Promise<ApiResponse<CV[]>> {
    return this.request<CV[]>('GET', '/cv');
  }

  /**
   * Get dashboard statistics
   * 
   * Business Logic:
   * - Calculates aggregate statistics for user's CVs
   * - Includes total counts, published counts, download/share metrics
   * - Used for displaying dashboard metrics
   * - Provides insights into user activity
   * 
   * @returns {Promise<ApiResponse<DashboardStats>>} Dashboard statistics
   * @author Vicky
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('GET', '/cv/dashboard-stats');
  }

  /**
   * Create a new CV
   * 
   * Business Logic:
   * - Creates a new CV with default template structure
   * - Sets initial status to DRAFT
   * - Assigns CV to authenticated user
   * - Returns created CV with generated ID
   * 
   * @param {CreateCVRequest} cvData - CV creation data
   * @returns {Promise<ApiResponse<CV>>} Created CV
   * @author Vicky
   */
  async createCV(cvData: CreateCVRequest): Promise<ApiResponse<CVData>> {
    return this.request<CVData>('POST', '/cv', cvData);
  }

  /**
   * Update an existing CV
   * 
   * Business Logic:
   * - Updates CV content and metadata
   * - Validates user ownership before update
   * - Updates timestamp automatically
   * - Preserves version history
   * 
   * @param {string} cvId - CV identifier
   * @param {UpdateCVRequest} cvData - Updated CV data
   * @returns {Promise<ApiResponse<CV>>} Updated CV
   * @author Vicky
   */
  async updateCV(cvId: string, cvData: UpdateCVRequest): Promise<ApiResponse<CV>> {
    return this.request<CV>('PUT', `/cv/${cvId}`, cvData);
  }

  /**
   * Delete a CV
   * 
   * Business Logic:
   * - Permanently removes CV from database
   * - Validates user ownership before deletion
   * - Cascades deletion to related data
   * - Cannot be undone
   * 
   * @param {string} cvId - CV identifier
   * @returns {Promise<ApiResponse<void>>} Success response
   * @author Vicky
   */
  async deleteCV(cvId: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/cv/${cvId}`);
  }

  /**
   * Get a specific CV by ID
   * 
   * Business Logic:
   * - Retrieves single CV with full content
   * - Validates user access permissions
   * - Used for editing and previewing
   * - Includes all CV sections and metadata
   * 
   * @param {string} cvId - CV identifier
   * @returns {Promise<ApiResponse<CV>>} CV data
   * @author Vicky
   */
  async getCV(cvId: string): Promise<ApiResponse<CVData>> {
    return this.request<CVData>('GET', `/cv/${cvId}`);
  }

  /**
   * Download CV (increment download count)
   * 
   * Business Logic:
   * - Increments the download count for the CV
   * - Tracks download analytics
   * - Used for dashboard statistics
   * 
   * @param {string} cvId - CV ID
   * @returns {Promise<ApiResponse<void>>} Download response
   * @author Vicky
   */
  async downloadCV(cvId: string): Promise<ApiResponse<void>> {
    return this.request<void>('POST', `/cv/${cvId}/download`);
  }

  /**
   * Get available CV layouts/templates
   * 
   * Business Logic:
   * - Retrieves all available CV layout templates
   * - Returns template metadata including preview images
   * - Used for template selection in templates page
   * - Public endpoint (no authentication required)
   * 
   * @returns {Promise<ApiResponse<Layout[]>>} Available layouts
   * @author Vicky
   */
  async getLayouts(): Promise<ApiResponse<Layout[]>> {
    return this.request<Layout[]>('GET', '/cv/layouts');
  }

  /**
   * Share CV
   * 
   * Business Logic:
   * - Shares CV through various platforms
   * - Increments share count for analytics
   * - Tracks sharing activity
   * - Used for CV distribution and networking
   * 
   * @param {string} cvId - CV identifier
   * @param {Object} shareData - Share platform and recipient info
   * @returns {Promise<ApiResponse<void>>} Share response
   * @author Vicky
   */
  async shareCV(cvId: string, shareData: { platform: string; recipient_email?: string }): Promise<ApiResponse<void>> {
    return this.request<void>('POST', `/cv/${cvId}/share`, shareData);
  }

  /**
   * Get current user profile
   * 
   * Business Logic:
   * - Retrieves authenticated user's profile information
   * - Returns user data without sensitive information
   * - Used for displaying user info in settings
   * 
   * @returns {Promise<ApiResponse<User>>} User profile data
   * @author Vicky
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('GET', '/auth/profile');
  }

  /**
   * Update user profile
   * 
   * Business Logic:
   * - Updates user profile information
   * - Validates input data
   * - Checks for uniqueness constraints
   * - Returns updated user data
   * 
   * @param {Object} profileData - Profile update data
   * @returns {Promise<ApiResponse<User>>} Updated user profile
   * @author Vicky
   */
  async updateProfile(profileData: { username?: string; email?: string; contact_number?: string; profile_image_url?: string }): Promise<ApiResponse<User>> {
    return this.request<User>('PUT', '/auth/profile', profileData);
  }

  /**
   * Change user password
   * 
   * Business Logic:
   * - Changes user password with current password verification
   * - Validates new password requirements
   * - Invalidates all existing sessions for security
   * 
   * @param {Object} passwordData - Password change data
   * @returns {Promise<ApiResponse<void>>} Success response
   * @author Vicky
   */
  async changePassword(passwordData: { current_password: string; new_password: string }): Promise<ApiResponse<void>> {
    return this.request<void>('POST', '/auth/change-password', passwordData);
  }

  /**
   * Process payment
   * 
   * Business Logic:
   * - Processes payment transactions
   * - Creates payment records
   * - Updates user subscription status
   * - Handles payment validation
   * 
   * @param {Object} paymentData - Payment transaction data
   * @returns {Promise<ApiResponse<any>>} Payment result
   * @author Vicky
   */
  async processPayment(paymentData: {
    amount: number;
    currency: string;
    payment_method: string;
    transaction_id: string;
    status: string;
    action_type: string;
    metadata: any;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('POST', '/payment/process', paymentData);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
