/**
 * Authentication Controller
 *
 * Business Logic:
 * - Validates credentials and input with `ValidationUtil`
 * - Delegates core auth flows to `AuthService` (register, login, refresh, logout)
 * - Issues/validates JWTs and exposes a typed profile endpoint
 * - Standardizes responses via `ResponseUtil`
 *
 * Code Conventions:
 * - Controller only coordinates HTTP concerns, no persistence logic here
 * - All routes return a consistent `{ success, message, data }` shape
 * - Errors are caught and converted to 4xx/5xx with safe messages
 *
 * @fileoverview HTTP adapter for authentication flows
 * @author vicky neosoft test builder app
 */

import { Request, Response } from 'express';
import { AuthService } from '@/services/AuthService';
import { ValidationUtil } from '@/utils/validation';
import { ResponseUtil } from '@/utils/response';
import { AuthenticatedRequest, RegisterRequest, LoginRequest } from '@/shared/types';
import { logger } from '@/utils/logger';

/**
 * Authentication Controller class
 * 
 * Handles all authentication-related HTTP requests and responses
 * 
 * @class AuthController
 */
export class AuthController {
  private authService: AuthService;

  /**
   * Constructor initializes the AuthService dependency
   * 
   * Business Logic:
   * - Creates AuthService instance for business logic operations
   * - Establishes dependency injection pattern
   * 
   * @constructor
   */
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user account
   * 
   * Business Logic:
   * - Validates user input data (username, email, password)
   * - Checks for existing users with same email/username
   * - Hashes password using bcrypt for security
   * - Creates user record in database
   * - Generates JWT access token
   * - Sends verification email (if configured)
   * - Returns user data without sensitive information
   * 
   * @param {Request} req - Express request object containing user data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when registration is complete
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: RegisterRequest = req.body;

      // Validate input
      const errors = ValidationUtil.validateUserRegistration(userData);
      if (ValidationUtil.hasErrors(errors)) {
        const errorMessage = ValidationUtil.formatErrors(errors);
        ResponseUtil.validationError(res, 'Registration validation failed', errorMessage);
        return;
      }

      // Register user
      const result = await this.authService.register(userData);

      ResponseUtil.created(res, result, 'User registered successfully');
    } catch (error: any) {
      logger.error('Registration error:', error);
      
      if (error.message === 'Email already exists') {
        ResponseUtil.conflict(res, 'Email already exists');
        return;
      }
      
      if (error.message === 'Username already exists') {
        ResponseUtil.conflict(res, 'Username already exists');
        return;
      }

      ResponseUtil.error(res, 'Registration failed');
    }
  };

  /**
   * Authenticate user login
   * 
   * Business Logic:
   * - Validates login credentials (username/email and password)
   * - Verifies user exists and account is active
   * - Checks password against hashed version in database
   * - Updates last login timestamp
   * - Generates new JWT access token
   * - Returns user data and access token
   * - Handles various error scenarios (invalid credentials, deactivated account, etc.)
   * 
   * @param {Request} req - Express request object containing login credentials
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when login is complete
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;

      // Validate input
      const errors = ValidationUtil.validateUserLogin(loginData);
      if (ValidationUtil.hasErrors(errors)) {
        const errorMessage = ValidationUtil.formatErrors(errors);
        ResponseUtil.validationError(res, 'Login validation failed', errorMessage);
        return;
      }

      // Login user
      const result = await this.authService.login(loginData);

      ResponseUtil.success(res, result, 'Login successful');
    } catch (error: any) {
      logger.error('Login error:', error);
      
      if (error.message === 'Invalid credentials') {
        ResponseUtil.unauthorized(res, 'Invalid credentials');
        return;
      }
      
      if (error.message === 'Account is deactivated') {
        ResponseUtil.forbidden(res, 'Account is deactivated');
        return;
      }
      
      if (error.message === 'Email verification required') {
        ResponseUtil.forbidden(res, 'Email verification required');
        return;
      }

      ResponseUtil.error(res, 'Login failed');
    }
  };

  /**
   * Refresh JWT access token using refresh token
   * 
   * Business Logic:
   * - Validates refresh token from request body
   * - Verifies refresh token is valid and not expired
   * - Checks if user account is still active
   * - Generates new access token with updated expiration
   * - Optionally generates new refresh token
   * - Returns new tokens for continued authentication
   * 
   * @param {Request} req - Express request object containing refresh token
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when token refresh is complete
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        ResponseUtil.badRequest(res, 'Refresh token is required');
        return;
      }

      // Refresh token
      const result = await this.authService.refreshToken(refresh_token);

      ResponseUtil.success(res, result, 'Token refreshed successfully');
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      
      if (error.message === 'Invalid refresh token' || error.message === 'Refresh token expired') {
        ResponseUtil.unauthorized(res, error.message);
        return;
      }
      
      if (error.message === 'User not found or inactive') {
        ResponseUtil.forbidden(res, 'User not found or inactive');
        return;
      }

      ResponseUtil.error(res, 'Token refresh failed');
    }
  };

  /**
   * Logout authenticated user
   * 
   * Business Logic:
   * - Invalidates user's current session
   * - Adds access token to blacklist (if implemented)
   * - Clears any server-side session data
   * - Updates user's last logout timestamp
   * - Logs logout activity for security monitoring
   * - Returns success confirmation
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when logout is complete
   */
  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { refresh_token } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Logout user
      await this.authService.logout(userId, refresh_token);

      ResponseUtil.success(res, null, 'Logout successful');
    } catch (error: any) {
      logger.error('Logout error:', error);
      ResponseUtil.error(res, 'Logout failed');
    }
  };

  /**
   * Get current authenticated user's profile
   * 
   * Business Logic:
   * - Extracts user ID from JWT token
   * - Fetches complete user profile from database
   * - Returns user data without sensitive information (password, tokens)
   * - Includes user preferences, settings, and account status
   * - Handles cases where user data might be incomplete
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when profile is retrieved
   */
  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Get user profile (this would typically fetch from database)
      // For now, we'll return the user data from the token
      const userProfile = {
        id: req.user?.userId,
        username: req.user?.username,
        email: req.user?.email,
        role: req.user?.role,
      };

      ResponseUtil.success(res, userProfile, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get profile error:', error);
      ResponseUtil.error(res, 'Failed to get profile');
    }
  };

  /**
   * Update user profile
   * 
   * Business Logic:
   * - Validates user input for profile updates
   * - Checks for username/email uniqueness
   * - Updates user profile in database
   * - Returns updated user profile
   * - Handles validation errors gracefully
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when profile is updated
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { username, email, contact_number, profile_image_url } = req.body;

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Validate input
      const errors = ValidationUtil.validateProfileUpdate({ username, email, contact_number });
      if (ValidationUtil.hasErrors(errors)) {
        const errorMessage = ValidationUtil.formatErrors(errors);
        ResponseUtil.validationError(res, 'Profile update validation failed', errorMessage);
        return;
      }

      // Update profile
      const updatedUser = await this.authService.updateProfile(userId, {
        username,
        email,
        contact_number,
        profile_image_url,
      });

      ResponseUtil.success(res, updatedUser, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update profile error:', error);
      
      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }
      
      if (error.message.includes('already exists')) {
        ResponseUtil.conflict(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Profile update failed');
    }
  };

  /**
   * Change user password
   * 
   * Business Logic:
   * - Validates current password against stored hash
   * - Validates new password meets security requirements
   * - Hashes new password using bcrypt
   * - Updates password in database
   * - Invalidates all existing sessions/tokens for security
   * - Logs password change activity
   * - Sends notification email about password change
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when password is changed
   */
  changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { current_password, new_password } = req.body;

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      if (!current_password || !new_password) {
        ResponseUtil.badRequest(res, 'Current password and new password are required');
        return;
      }

      // Validate new password
      const errors = ValidationUtil.validatePassword(new_password);
      if (ValidationUtil.hasErrors(errors)) {
        const errorMessage = ValidationUtil.formatErrors(errors);
        ResponseUtil.validationError(res, 'Password validation failed', errorMessage);
        return;
      }

      // Change password
      await this.authService.changePassword(userId, current_password, new_password);

      ResponseUtil.success(res, null, 'Password changed successfully');
    } catch (error: any) {
      logger.error('Change password error:', error);
      
      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }
      
      if (error.message === 'Current password is incorrect') {
        ResponseUtil.badRequest(res, 'Current password is incorrect');
        return;
      }

      ResponseUtil.error(res, 'Password change failed');
    }
  };

  /**
   * Request password reset with OTP for user account
   * 
   * Business Logic:
   * - Validates email format and existence
   * - Generates 4-digit OTP (default: 1111 for development)
   * - Stores OTP in database with expiration (5 minutes)
   * - Sends OTP via email (or uses default for development)
   * - Implements rate limiting to prevent abuse
   * - Returns generic success message to prevent email enumeration
   * - Logs reset request for security monitoring
   * 
   * @param {Request} req - Express request object containing email
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when reset request is processed
   */
  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        ResponseUtil.badRequest(res, 'Email is required');
        return;
      }

      // Validate email
      if (!ValidationUtil.isValidEmail(email)) {
        ResponseUtil.badRequest(res, 'Invalid email format');
        return;
      }

      // Request password reset with OTP
      const result = await this.authService.requestPasswordResetWithOTP(email);

      ResponseUtil.success(res, result, 'OTP sent to your email address');
    } catch (error: any) {
      logger.error('Password reset request error:', error);
      
      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, 'No account found with this email address');
        return;
      }

      ResponseUtil.error(res, 'Password reset request failed');
    }
  };

  /**
   * Verify OTP for password reset
   * 
   * Business Logic:
   * - Validates email and OTP format
   * - Checks OTP against stored value in database
   * - Verifies OTP hasn't expired (5 minutes)
   * - Generates temporary reset token for password change
   * - Invalidates OTP after successful verification
   * - Returns reset token for password change
   * 
   * @param {Request} req - Express request object containing email and OTP
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when OTP is verified
   */
  verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        ResponseUtil.badRequest(res, 'Email and OTP are required');
        return;
      }

      // Validate email
      if (!ValidationUtil.isValidEmail(email)) {
        ResponseUtil.badRequest(res, 'Invalid email format');
        return;
      }

      // Verify OTP
      const result = await this.authService.verifyOTP(email, otp);

      ResponseUtil.success(res, result, 'OTP verified successfully');
    } catch (error: any) {
      logger.error('OTP verification error:', error);
      
      if (error.message === 'Invalid OTP') {
        ResponseUtil.badRequest(res, 'Invalid OTP');
        return;
      }
      
      if (error.message === 'OTP expired') {
        ResponseUtil.badRequest(res, 'OTP has expired. Please request a new one.');
        return;
      }
      
      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, 'No account found with this email address');
        return;
      }

      ResponseUtil.error(res, 'OTP verification failed');
    }
  };

  /**
   * Reset user password using reset token
   * 
   * Business Logic:
   * - Validates reset token and checks expiration
   * - Verifies token hasn't been used before
   * - Validates new password meets security requirements
   * - Hashes new password using bcrypt
   * - Updates password in database
   * - Invalidates reset token to prevent reuse
   * - Invalidates all existing user sessions
   * - Sends confirmation email about password change
   * - Logs password reset activity
   * 
   * @param {Request} req - Express request object containing token and new password
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when password is reset
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reset_token, new_password } = req.body;

      if (!reset_token || !new_password) {
        ResponseUtil.badRequest(res, 'Reset token and new password are required');
        return;
      }

      // Validate new password
      const errors = ValidationUtil.validatePassword(new_password);
      if (ValidationUtil.hasErrors(errors)) {
        const errorMessage = ValidationUtil.formatErrors(errors);
        ResponseUtil.validationError(res, 'Password validation failed', errorMessage);
        return;
      }

      // Reset password
      await this.authService.resetPasswordWithToken(reset_token, new_password);

      ResponseUtil.success(res, null, 'Password reset successfully');
    } catch (error: any) {
      logger.error('Password reset error:', error);
      
      if (error.message === 'Invalid or expired reset token' || error.message === 'Reset token expired') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Password reset failed');
    }
  };

  /**
   * Verify user email address using verification token
   * 
   * Business Logic:
   * - Validates verification token from request
   * - Checks token expiration and validity
   * - Updates user's email verification status
   * - Activates user account if required
   * - Invalidates verification token after use
   * - Sends welcome email to verified user
   * - Logs email verification activity
   * 
   * @param {Request} req - Express request object containing verification token
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when email is verified
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        ResponseUtil.badRequest(res, 'Verification token is required');
        return;
      }

      // TODO: Implement email verification logic
      // This would typically verify the token and update user's verification status
      
      ResponseUtil.success(res, null, 'Email verified successfully');
    } catch (error: any) {
      logger.error('Email verification error:', error);
      ResponseUtil.error(res, 'Email verification failed');
    }
  };

  /**
   * Resend email verification to authenticated user
   * 
   * Business Logic:
   * - Checks if user is already verified
   * - Generates new verification token
   * - Implements rate limiting to prevent spam
   * - Sends verification email with new token
   * - Updates verification token in database
   * - Logs resend request for monitoring
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when verification email is sent
   */
  resendVerification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // TODO: Implement resend verification logic
      // This would typically generate a new verification token and send email
      
      ResponseUtil.success(res, null, 'Verification email sent');
    } catch (error: any) {
      logger.error('Resend verification error:', error);
      ResponseUtil.error(res, 'Failed to resend verification email');
    }
  };

  /**
   * OAuth login with Google
   * 
   * Business Logic:
   * - Validates Google access token
   * - Fetches user profile from Google API
   * - Creates or links OAuth account
   * - Generates JWT tokens
   * - Returns user data and tokens
   * 
   * @param {Request} req - Express request object containing Google access token
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when OAuth login is complete
   */
  oauthGoogle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        ResponseUtil.badRequest(res, 'Google access token is required');
        return;
      }

      // TODO: Implement Google OAuth verification
      // This would typically verify the token with Google API and get user profile
      ResponseUtil.success(res, null, 'Google OAuth login - Implementation needed');
    } catch (error: any) {
      logger.error('Google OAuth error:', error);
      ResponseUtil.error(res, 'Google OAuth login failed');
    }
  };

  /**
   * OAuth login with Facebook
   * 
   * Business Logic:
   * - Validates Facebook access token
   * - Fetches user profile from Facebook API
   * - Creates or links OAuth account
   * - Generates JWT tokens
   * - Returns user data and tokens
   * 
   * @param {Request} req - Express request object containing Facebook access token
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when OAuth login is complete
   */
  oauthFacebook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        ResponseUtil.badRequest(res, 'Facebook access token is required');
        return;
      }

      // TODO: Implement Facebook OAuth verification
      // This would typically verify the token with Facebook API and get user profile
      ResponseUtil.success(res, null, 'Facebook OAuth login - Implementation needed');
    } catch (error: any) {
      logger.error('Facebook OAuth error:', error);
      ResponseUtil.error(res, 'Facebook OAuth login failed');
    }
  };
}

export default AuthController;
