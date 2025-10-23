import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

/**
 * Create rate limiter middleware
 */
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    max: options.max || config.rateLimit.maxRequests,
    message: options.message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round((options.windowMs || config.rateLimit.windowMs) / 1000),
      });
    },
  });
};

/**
 * General API rate limiter
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Very strict rate limiter for sensitive operations
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: 'Too many attempts for this operation, please try again later.',
});

/**
 * File upload rate limiter
 */
export const fileUploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 file uploads per hour
  message: 'Too many file uploads, please try again later.',
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later.',
});

/**
 * Email verification rate limiter
 */
export const emailVerificationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 email verification requests per hour
  message: 'Too many email verification requests, please try again later.',
});

/**
 * CV download rate limiter
 */
export const cvDownloadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 CV downloads per hour
  message: 'Too many CV downloads, please try again later.',
});

/**
 * CV share rate limiter
 */
export const cvShareRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 CV shares per hour
  message: 'Too many CV shares, please try again later.',
});

/**
 * User-specific rate limiter (requires authentication)
 */
export const createUserRateLimiter = (maxRequests: number, windowMs: number = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: any) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.userId || req.ip;
    },
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const identifier = (req as any).user?.userId || req.ip;
      logger.warn(`User rate limit exceeded for: ${identifier}, URL: ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

/**
 * Premium user rate limiter (higher limits)
 */
export const premiumUserRateLimiter = createUserRateLimiter(200, 15 * 60 * 1000);

/**
 * Regular user rate limiter
 */
export const regularUserRateLimiter = createUserRateLimiter(100, 15 * 60 * 1000);

export default {
  generalRateLimiter,
  authRateLimiter,
  strictRateLimiter,
  fileUploadRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
  cvDownloadRateLimiter,
  cvShareRateLimiter,
  createUserRateLimiter,
  premiumUserRateLimiter,
  regularUserRateLimiter,
};

