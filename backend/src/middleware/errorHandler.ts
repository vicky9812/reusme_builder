import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/environment';
import { ResponseUtil } from '@/utils/response';
import { logger } from '@/utils/logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Global error handler:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    ResponseUtil.validationError(res, 'Validation failed', error.message);
    return;
  }

  if (error.name === 'UnauthorizedError') {
    ResponseUtil.unauthorized(res, 'Unauthorized access');
    return;
  }

  if (error.name === 'ForbiddenError') {
    ResponseUtil.forbidden(res, 'Access forbidden');
    return;
  }

  if (error.name === 'NotFoundError') {
    ResponseUtil.notFound(res, 'Resource not found');
    return;
  }

  if (error.name === 'ConflictError') {
    ResponseUtil.conflict(res, 'Resource conflict');
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    ResponseUtil.unauthorized(res, 'Invalid token');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    ResponseUtil.unauthorized(res, 'Token expired');
    return;
  }

  // Handle database errors
  if (error.code === '23505') { // Unique constraint violation
    ResponseUtil.conflict(res, 'Resource already exists');
    return;
  }

  if (error.code === '23503') { // Foreign key constraint violation
    ResponseUtil.badRequest(res, 'Invalid reference');
    return;
  }

  if (error.code === '23502') { // Not null constraint violation
    ResponseUtil.badRequest(res, 'Required field missing');
    return;
  }

  // Handle Supabase specific errors
  if (error.code === 'PGRST116') { // No rows returned
    ResponseUtil.notFound(res, 'Resource not found');
    return;
  }

  // Handle file upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    ResponseUtil.badRequest(res, 'File too large');
    return;
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    ResponseUtil.badRequest(res, 'Too many files');
    return;
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    ResponseUtil.badRequest(res, 'Unexpected file field');
    return;
  }

  // Default error response
  const message = config.nodeEnv === 'production' 
    ? 'Internal server error' 
    : error.message;

  ResponseUtil.error(res, message);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  ResponseUtil.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error
 */
export const createError = (message: string, statusCode: number = 500, name?: string) => {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  if (name) {
    error.name = name;
  }
  return error;
};

/**
 * Validation error
 */
export const ValidationError = (message: string) => {
  return createError(message, 422, 'ValidationError');
};

/**
 * Unauthorized error
 */
export const UnauthorizedError = (message: string = 'Unauthorized') => {
  return createError(message, 401, 'UnauthorizedError');
};

/**
 * Forbidden error
 */
export const ForbiddenError = (message: string = 'Forbidden') => {
  return createError(message, 403, 'ForbiddenError');
};

/**
 * Not found error
 */
export const NotFoundError = (message: string = 'Not found') => {
  return createError(message, 404, 'NotFoundError');
};

/**
 * Conflict error
 */
export const ConflictError = (message: string = 'Conflict') => {
  return createError(message, 409, 'ConflictError');
};

export default errorHandler;

