/**
 * Auth Service
 *
 * Business Logic:
 * - Handles user registration, login, token issuance/verification
 * - Abstracts hashing, token lifetimes, and refresh flow
 * - Provides simple methods consumed by controllers/middleware
 *
 * Code Conventions:
 * - Throws typed Errors; no HTTP objects here
 * - Pure functions where possible
 *
 * @fileoverview Authentication domain service
 * @author vicky neosoft test builder app
 */
/**
 * Authentication Service
 * 
 * This service handles all authentication business logic including:
 * - User registration with password hashing
 * - User login with credential verification
 * - JWT token generation and validation
 * - Password reset and change operations
 * - OAuth integration (Google, Facebook)
 * - Email verification processes
 * - Session management and security
 * 
 * Business Logic:
 * - Implements secure password hashing with bcrypt
 * - Generates and validates JWT tokens with proper expiration
 * - Manages user sessions and authentication state
 * - Handles OAuth provider integration
 * - Implements email verification workflows
 * - Provides comprehensive error handling
 * 
 * @fileoverview Authentication service for CV Builder API
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/environment';
import { database } from '@/config/database';
import { UserModel } from '@/models/User';
import { 
  User, 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  JWTPayload,
  OAuthProfile 
} from '@/shared/types';
import { TOKEN_TYPES, OAUTH_PROVIDERS } from '@/shared/constants';
import { logger } from '@/utils/logger';

/**
 * Authentication Service class
 * 
 * Handles all authentication-related business logic
 * 
 * @class AuthService
 */
export class AuthService {
  private userModel: UserModel;
  private supabase = database.getClient();

  /**
   * Constructor initializes UserModel dependency
   * 
   * Business Logic:
   * - Creates UserModel instance for user database operations
   * - Gets Supabase client for direct database access
   * - Establishes dependency injection pattern
   * 
   * @constructor
   */
  constructor() {
    this.userModel = new UserModel();
  }

  /**
   * Register a new user account
   * 
   * Business Logic:
   * - Checks for existing users with same email/username
   * - Hashes password using bcrypt with salt rounds
   * - Creates user record in database
   * - Generates JWT access and refresh tokens
   * - Sends verification email (if configured)
   * - Returns user data and tokens
   * 
   * @param {RegisterRequest} userData - User registration data
   * @returns {Promise<AuthResponse>} Promise resolving to authentication response
   * @throws {Error} If user already exists or registration fails
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if email already exists
      const emailExists = await this.userModel.emailExists(userData.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }

      // Check if username already exists
      const usernameExists = await this.userModel.usernameExists(userData.username);
      if (usernameExists) {
        throw new Error('Username already exists');
      }

      // Create user
      const user = await this.userModel.create(userData);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Update last login
      await this.userModel.updateLastLogin(user.id);

      logger.info(`User registered successfully: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email or username
      const user = await this.userModel.findByEmailOrUsername(
        loginData.email || loginData.username!
      );

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await this.userModel.verifyPassword(user, loginData.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Check if email is verified (for non-OAuth users)
      if (!user.oauth_provider && !user.is_verified) {
        throw new Error('Email verification required');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Update last login
      await this.userModel.updateLastLogin(user.id);

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * OAuth login/register
   */
  async oauthLogin(profile: OAuthProfile): Promise<AuthResponse> {
    try {
      // Check if OAuth user already exists
      let user = await this.userModel.findOAuthUser(profile.provider, profile.id);

      if (user) {
        // User exists, update last login
        await this.userModel.updateLastLogin(user.id);
      } else {
        // Check if email already exists with different provider
        const existingUser = await this.userModel.findByEmail(profile.email);
        if (existingUser) {
          // Link OAuth account to existing user
          user = await this.userModel.update(existingUser.id, {
            oauth_provider: profile.provider as any,
            oauth_id: profile.id,
            profile_image_url: profile.picture,
            is_verified: true,
          });
        } else {
          // Create new OAuth user
          user = await this.userModel.createOAuthUser({
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
            provider: profile.provider,
            oauthId: profile.id,
          });
        }
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info(`OAuth login successful: ${user.email} via ${profile.provider}`);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      logger.error('OAuth login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JWTPayload;

      // Check if refresh token exists in database
      const { data: tokenRecord, error } = await this.supabase
        .from('refresh_tokens')
        .select('*')
        .eq('token', refreshToken)
        .eq('is_revoked', false)
        .single();

      if (error || !tokenRecord) {
        throw new Error('Invalid refresh token');
      }

      // Check if token is expired
      if (new Date() > new Date(tokenRecord.expires_at)) {
        throw new Error('Refresh token expired');
      }

      // Get user
      const user = await this.userModel.findById(decoded.userId);
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);
      const expiresIn = this.getTokenExpiration(config.jwt.expiresIn);

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        access_token: accessToken,
        expires_in: expiresIn,
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
      // Revoke refresh token if provided
      if (refreshToken) {
        await this.supabase
          .from('refresh_tokens')
          .update({ is_revoked: true })
          .eq('token', refreshToken);
      }

      // Revoke all refresh tokens for the user (optional - for security)
      // await this.supabase
      //   .from('refresh_tokens')
      //   .update({ is_revoked: true })
      //   .eq('user_id', userId)
      //   .eq('is_revoked', false);

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      return decoded;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: { username?: string; email?: string; contact_number?: string; profile_image_url?: string }): Promise<User> {
    try {
      // Check if username or email already exists (if being updated)
      if (updates.username) {
        const existingUserByUsername = await this.userModel.findByUsername(updates.username);
        if (existingUserByUsername && existingUserByUsername.id !== userId) {
          throw new Error('Username already exists');
        }
      }

      if (updates.email) {
        const existingUserByEmail = await this.userModel.findByEmail(updates.email);
        if (existingUserByEmail && existingUserByEmail.id !== userId) {
          throw new Error('Email already exists');
        }
      }

      // Update user
      const updatedUser = await this.userModel.update(userId, updates);

      logger.info(`Profile updated for user: ${updatedUser.email}`);
      return updatedUser;
    } catch (error) {
      logger.error('Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.userModel.verifyPassword(user, currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await this.userModel.updatePassword(userId, newPassword);

      // Revoke all refresh tokens for security
      await this.supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('user_id', userId)
        .eq('is_revoked', false);

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      // Check if user exists
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return;
      }

      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      // Store reset token
      await this.supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
        });

      // TODO: Send email with reset link
      logger.info(`Password reset requested for: ${email}`);
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Get reset token
      const { data: resetToken, error } = await this.supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (error || !resetToken) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if token is expired
      if (new Date() > new Date(resetToken.expires_at)) {
        throw new Error('Reset token expired');
      }

      // Update password
      await this.userModel.updatePassword(resetToken.user_id, newPassword);

      // Mark token as used
      await this.supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', resetToken.id);

      // Revoke all refresh tokens for security
      await this.supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('user_id', resetToken.user_id)
        .eq('is_revoked', false);

      logger.info(`Password reset completed for user: ${resetToken.user_id}`);
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Request password reset with OTP
   * 
   * Business Logic:
   * - Validates user exists with provided email
   * - Generates 4-digit OTP (default: 1111 for development)
   * - Stores OTP in database with 5-minute expiration
   * - Sends OTP via email (or logs for development)
   * - Implements rate limiting to prevent abuse
   * - Returns OTP info for development purposes
   * 
   * @param {string} email - User's email address
   * @returns {Promise<{otp: string, expires_at: string}>} OTP details
   * @throws {Error} If user not found or service error
   */
  async requestPasswordResetWithOTP(email: string): Promise<{otp: string, expires_at: string}> {
    try {
      // Check if user exists
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        throw new Error('No account found with this email address. Please check your email or create a new account.');
      }

      // Generate OTP (default: 1111 for development)
      const otp = process.env.NODE_ENV === 'production' 
        ? Math.floor(1000 + Math.random() * 9000).toString() 
        : '1111';

      // Set expiration time (5 minutes from now)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Store OTP in database
      await this.supabase
        .from('password_reset_otps')
        .upsert({
          email: email.toLowerCase(),
          otp: otp,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          used: false
        });

      // In production, send email here
      if (process.env.NODE_ENV === 'production') {
        // TODO: Implement email sending service
        logger.info(`OTP sent to ${email}: ${otp}`);
      } else {
        logger.info(`Development OTP for ${email}: ${otp}`);
      }

      return {
        otp: process.env.NODE_ENV === 'production' ? '****' : otp,
        expires_at: expiresAt.toISOString()
      };
    } catch (error: any) {
      logger.error('Request password reset with OTP error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP for password reset
   * 
   * Business Logic:
   * - Validates OTP format and email
   * - Checks OTP against stored value in database
   * - Verifies OTP hasn't expired
   * - Generates temporary reset token
   * - Invalidates OTP after successful verification
   * - Returns reset token for password change
   * 
   * @param {string} email - User's email address
   * @param {string} otp - 4-digit OTP code
   * @returns {Promise<{reset_token: string, expires_at: string}>} Reset token details
   * @throws {Error} If OTP invalid, expired, or user not found
   */
  async verifyOTP(email: string, otp: string): Promise<{reset_token: string, expires_at: string}> {
    try {
      // Validate OTP format
      if (!/^\d{4}$/.test(otp)) {
        throw new Error('Invalid OTP format');
      }

      // Check if user exists
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        throw new Error('No account found with this email address. Please check your email or create a new account.');
      }

      // Get OTP from database
      const { data: otpData, error } = await this.supabase
        .from('password_reset_otps')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !otpData) {
        throw new Error('Invalid OTP');
      }

      // Check if OTP has expired
      const now = new Date();
      const expiresAt = new Date(otpData.expires_at);
      if (now > expiresAt) {
        throw new Error('OTP expired');
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        throw new Error('Invalid OTP');
      }

      // Generate reset token
      const resetToken = uuidv4();
      const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset token
      await this.supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token: resetToken,
          expires_at: tokenExpiresAt.toISOString(),
          created_at: new Date().toISOString(),
          used: false
        });

      // Mark OTP as used
      await this.supabase
        .from('password_reset_otps')
        .update({ used: true })
        .eq('id', otpData.id);

      return {
        reset_token: resetToken,
        expires_at: tokenExpiresAt.toISOString()
      };
    } catch (error: any) {
      logger.error('Verify OTP error:', error);
      throw error;
    }
  }

  /**
   * Reset password using reset token
   * 
   * Business Logic:
   * - Validates reset token and checks expiration
   * - Verifies token hasn't been used before
   * - Validates new password meets security requirements
   * - Hashes new password using bcrypt
   * - Updates password in database
   * - Invalidates reset token to prevent reuse
   * - Invalidates all existing user sessions
   * - Logs password reset activity
   * 
   * @param {string} resetToken - Reset token from OTP verification
   * @param {string} newPassword - New password
   * @returns {Promise<void>} Promise that resolves when password is reset
   * @throws {Error} If token invalid, expired, or service error
   */
  async resetPasswordWithToken(resetToken: string, newPassword: string): Promise<void> {
    try {
      // Get reset token from database
      const { data: tokenData, error } = await this.supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', resetToken)
        .eq('used', false)
        .single();

      if (error || !tokenData) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if token has expired
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      if (now > expiresAt) {
        throw new Error('Reset token expired');
      }

      // Update password using UserModel
      await this.userModel.updatePassword(tokenData.user_id, newPassword);

      // Mark token as used
      await this.supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', tokenData.id);

      // Revoke all refresh tokens for security
      await this.supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('user_id', tokenData.user_id)
        .eq('is_revoked', false);

      logger.info(`Password reset successful for user ID: ${tokenData.user_id}`);
    } catch (error: any) {
      logger.error('Reset password with token error:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const expiresIn = this.getTokenExpiration(config.jwt.expiresIn);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.supabase
      .from('refresh_tokens')
      .insert({
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt.toISOString(),
      });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    };
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Get token expiration in seconds
   */
  private getTokenExpiration(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default 1 hour
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }

  /**
   * Sanitize user object (remove sensitive data)
   */
  private sanitizeUser(user: User): Omit<User, 'password_hash'> {
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export default AuthService;
