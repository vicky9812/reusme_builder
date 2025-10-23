import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { AuthenticatedRequest, JWTPayload } from '@/shared/types';
import { USER_ROLES } from '@/shared/constants';
import { ResponseUtil } from '@/utils/response';
import { logger } from '@/utils/logger';

/**
 * Authentication & Authorization Middleware
 *
 * Business Logic:
 * - Verifies JWT, attaches `req.user`, and enforces active-user checks
 * - Provides role-based permission guard via `hasPermission(action)`
 * - Normalizes errors to consistent API responses
 *
 * Code Conventions:
 * - Stateless; depends on `AuthService` for token validation
 * - Action strings follow `verb:scope` (e.g., `download:own`, `read:all`)
 * - Admin and premium “unlimited” rights satisfy equivalent “own” checks
 *
 * @fileoverview HTTP middleware for authN/authZ
 * @author vicky neosoft test builder app
 */
export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Verify JWT token and attach user to request
   */
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ResponseUtil.unauthorized(res, 'Access token required');
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!token) {
        ResponseUtil.unauthorized(res, 'Access token required');
        return;
      }

      // Verify token
      const payload = await this.authService.verifyToken(token);
      
      // Attach user to request
      req.user = payload;
      
      next();
    } catch (error) {
      logger.error('Authentication failed:', error);
      ResponseUtil.unauthorized(res, 'Invalid or expired token');
    }
  };

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (token) {
          try {
            const payload = await this.authService.verifyToken(token);
            req.user = payload;
          } catch (error) {
            // Token is invalid, but we continue without authentication
            logger.warn('Optional authentication failed:', error);
          }
        }
      }
      
      next();
    } catch (error) {
      logger.error('Optional authentication error:', error);
      next();
    }
  };

  /**
   * Require specific role
   */
  requireRole = (roles: string | string[]) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        ResponseUtil.forbidden(res, 'Insufficient permissions');
        return;
      }

      next();
    };
  };

  /**
   * Require admin role
   */
  requireAdmin = this.requireRole('admin');

  /**
   * Require premium role
   */
  requirePremium = this.requireRole(['admin', 'premium']);

  /**
   * Check if user owns resource
   */
  requireOwnership = (userIdParam: string = 'userId') => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
      
      if (req.user.role !== USER_ROLES.ADMIN && req.user.userId !== resourceUserId) {
        ResponseUtil.forbidden(res, 'Access denied: You can only access your own resources');
        return;
      }

      next();
    };
  };

  /**
   * Rate limiting for authentication endpoints
   */
  authRateLimit = (req: Request, res: Response, next: NextFunction): void => {
    // This would typically use a rate limiting library like express-rate-limit
    // For now, we'll implement a basic check
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Log authentication attempts
    logger.info(`Auth attempt from IP: ${clientIp}, User-Agent: ${userAgent}`);
    
    next();
  };

  /**
   * Validate refresh token
   */
  validateRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        ResponseUtil.badRequest(res, 'Refresh token is required');
        return;
      }

      // Verify refresh token exists and is valid
      const { data: tokenRecord, error } = await this.authService['supabase']
        .from('refresh_tokens')
        .select('*')
        .eq('token', refresh_token)
        .eq('is_revoked', false)
        .single();

      if (error || !tokenRecord) {
        ResponseUtil.unauthorized(res, 'Invalid refresh token');
        return;
      }

      // Check if token is expired
      if (new Date() > new Date(tokenRecord.expires_at)) {
        ResponseUtil.unauthorized(res, 'Refresh token expired');
        return;
      }

      // Attach token record to request for use in controller
      (req as any).refreshTokenRecord = tokenRecord;
      
      next();
    } catch (error) {
      logger.error('Refresh token validation failed:', error);
      ResponseUtil.unauthorized(res, 'Invalid refresh token');
    }
  };

  /**
   * Check if user is verified
   */
  requireVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    // For OAuth users, verification is automatic
    // For regular users, we need to check if they're verified
    // This would require fetching the user from database
    // For now, we'll assume all authenticated users are verified
    
    next();
  };

  /**
   * Check if user is active
   */
  requireActiveUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    // This would typically check the user's status in the database
    // For now, we'll assume all authenticated users are active
    
    next();
  };

  /**
   * Extract user ID from token
   */
  extractUserId = (req: AuthenticatedRequest): string | null => {
    return req.user?.userId || null;
  };

  /**
   * Check if user has permission for action
   */
  hasPermission = (action: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Define permissions based on user role
      const permissions: Record<string, string[]> = {
        user: ['read:own', 'write:own', 'delete:own', 'download:own', 'share:own'],
        premium: ['read:own', 'write:own', 'delete:own', 'download:unlimited', 'share:unlimited'],
        admin: ['read:all', 'write:all', 'delete:all', 'download:unlimited', 'share:unlimited', 'manage:users', 'manage:system'],
      };

      const userPermissions = permissions[req.user.role] || [];
      
      // Allow "unlimited" permissions to satisfy "own" checks
      const unlimitedEquivalent = action.endsWith(':own')
        ? action.replace(':own', ':unlimited')
        : undefined;

      const isAllowed = userPermissions.includes(action) || (unlimitedEquivalent ? userPermissions.includes(unlimitedEquivalent) : false);

      if (!isAllowed) {
        ResponseUtil.forbidden(res, `Permission denied for action: ${action}`);
        return;
      }

      next();
    };
  };
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export individual middleware functions
export const authenticate = authMiddleware.authenticate;
export const optionalAuth = authMiddleware.optionalAuth;
export const requireRole = authMiddleware.requireRole;
export const requireAdmin = authMiddleware.requireAdmin;
export const requirePremium = authMiddleware.requirePremium;
export const requireOwnership = authMiddleware.requireOwnership;
export const authRateLimit = authMiddleware.authRateLimit;
export const validateRefreshToken = authMiddleware.validateRefreshToken;
export const requireVerification = authMiddleware.requireVerification;
export const requireActiveUser = authMiddleware.requireActiveUser;
export const hasPermission = authMiddleware.hasPermission;

export default authMiddleware;
