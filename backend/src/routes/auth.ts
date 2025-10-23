import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '@/controllers/AuthController';
import {
  authenticate,
  authRateLimit,
  validateRefreshToken
} from '@/middleware/auth';
import {
  validateBody,
  validatePagination,
  sanitizeInput,
  requireFields
} from '@/middleware/validation';
import { ValidationUtil } from '@/utils/validation';
import { AuthenticatedRequest } from '@/shared/types';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimit,
  sanitizeInput,
  validateBody(ValidationUtil.validateUserRegistration),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimit,
  sanitizeInput,
  validateBody(ValidationUtil.validateUserLogin),
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  authRateLimit,
  sanitizeInput,
  validateRefreshToken,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  sanitizeInput,
  (req: any, res: Response) => {
    authController.logout(req, res);
  }
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  (req: any, res: Response) => {
    authController.getProfile(req, res);
  }
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  sanitizeInput,
  validateBody(ValidationUtil.validateProfileUpdate),
  (req: any, res: Response) => {
    authController.updateProfile(req, res);
  }
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  sanitizeInput,
  requireFields(['current_password', 'new_password']),
  (req: any, res: Response) => {
    authController.changePassword(req, res);
  }
);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset with OTP
 * @access  Public
 */
router.post(
  '/request-password-reset',
  authRateLimit,
  sanitizeInput,
  requireFields(['email']),
  authController.requestPasswordReset
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for password reset
 * @access  Public
 */
router.post(
  '/verify-otp',
  authRateLimit,
  sanitizeInput,
  requireFields(['email', 'otp']),
  authController.verifyOTP
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  authRateLimit,
  sanitizeInput,
  requireFields(['reset_token', 'new_password']),
  authController.resetPassword
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email',
  authRateLimit,
  sanitizeInput,
  requireFields(['token']),
  authController.verifyEmail
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Private
 */
router.post(
  '/resend-verification',
  authenticate,
  sanitizeInput,
  authController.resendVerification
);

/**
 * @route   POST /api/auth/oauth/google
 * @desc    OAuth login with Google
 * @access  Public
 */
router.post(
  '/oauth/google',
  authRateLimit,
  sanitizeInput,
  requireFields(['access_token']),
  authController.oauthGoogle
);

/**
 * @route   POST /api/auth/oauth/facebook
 * @desc    OAuth login with Facebook
 * @access  Public
 */
router.post(
  '/oauth/facebook',
  authRateLimit,
  sanitizeInput,
  requireFields(['access_token']),
  authController.oauthFacebook
);

export default router;
