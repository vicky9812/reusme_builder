import { Request, Response, NextFunction } from 'express';
import { ValidationUtil } from '@/utils/validation';
import { ResponseUtil } from '@/utils/response';
import { ValidationError } from '@/shared/types';
import { logger } from '@/utils/logger';

/**
 * Validation middleware factory
 */
export class ValidationMiddleware {
  /**
   * Validate request body
   */
  static validateBody = (validationFn: (data: any) => ValidationError[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const errors = validationFn(req.body);
        
        if (ValidationUtil.hasErrors(errors)) {
          const errorMessage = ValidationUtil.formatErrors(errors);
          ResponseUtil.validationError(res, 'Validation failed', errorMessage);
          return;
        }

        next();
      } catch (error) {
        logger.error('Validation middleware error:', error);
        ResponseUtil.badRequest(res, 'Invalid request data');
      }
    };
  };

  /**
   * Validate request parameters
   */
  static validateParams = (validationFn: (params: any) => ValidationError[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const errors = validationFn(req.params);
        
        if (ValidationUtil.hasErrors(errors)) {
          const errorMessage = ValidationUtil.formatErrors(errors);
          ResponseUtil.validationError(res, 'Invalid parameters', errorMessage);
          return;
        }

        next();
      } catch (error) {
        logger.error('Parameter validation error:', error);
        ResponseUtil.badRequest(res, 'Invalid parameters');
      }
    };
  };

  /**
   * Validate query parameters
   */
  static validateQuery = (validationFn: (query: any) => ValidationError[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const errors = validationFn(req.query);
        
        if (ValidationUtil.hasErrors(errors)) {
          const errorMessage = ValidationUtil.formatErrors(errors);
          ResponseUtil.validationError(res, 'Invalid query parameters', errorMessage);
          return;
        }

        next();
      } catch (error) {
        logger.error('Query validation error:', error);
        ResponseUtil.badRequest(res, 'Invalid query parameters');
      }
    };
  };

  /**
   * Validate file upload
   */
  static validateFile = (fieldName: string = 'file') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const file = (req as any).file || (req as any).files?.[fieldName];
        
        if (!file) {
          ResponseUtil.badRequest(res, 'File is required');
          return;
        }

        const errors = ValidationUtil.validateFileUpload(file);
        
        if (ValidationUtil.hasErrors(errors)) {
          const errorMessage = ValidationUtil.formatErrors(errors);
          ResponseUtil.validationError(res, 'File validation failed', errorMessage);
          return;
        }

        next();
      } catch (error) {
        logger.error('File validation error:', error);
        ResponseUtil.badRequest(res, 'File validation failed');
      }
    };
  };

  /**
   * Validate pagination parameters
   */
  static validatePagination = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const errors = ValidationUtil.validatePagination(page, limit);
      
      if (ValidationUtil.hasErrors(errors)) {
        const errorMessage = ValidationUtil.formatErrors(errors);
        ResponseUtil.validationError(res, 'Invalid pagination parameters', errorMessage);
        return;
      }

      // Set default values
      req.query.page = page?.toString() || '1';
      req.query.limit = limit?.toString() || '10';

      next();
    } catch (error) {
      logger.error('Pagination validation error:', error);
      ResponseUtil.badRequest(res, 'Invalid pagination parameters');
    }
  };

  /**
   * Sanitize request data
   */
  static sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize body
      if (req.body) {
        req.body = ValidationMiddleware.sanitizeObject(req.body);
      }

      // Sanitize query
      if (req.query) {
        req.query = ValidationMiddleware.sanitizeObject(req.query);
      }

      // Sanitize params
      if (req.params) {
        req.params = ValidationMiddleware.sanitizeObject(req.params);
      }

      next();
    } catch (error) {
      logger.error('Input sanitization error:', error);
      ResponseUtil.badRequest(res, 'Invalid input data');
    }
  };

  /**
   * Recursively sanitize object
   */
  private static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return ValidationUtil.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => ValidationMiddleware.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = ValidationMiddleware.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate UUID parameter
   */
  static validateUUID = (paramName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const uuid = req.params[paramName];
        
        if (!uuid) {
          ResponseUtil.badRequest(res, `${paramName} is required`);
          return;
        }

        // Basic UUID validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(uuid)) {
          ResponseUtil.badRequest(res, `Invalid ${paramName} format`);
          return;
        }

        next();
      } catch (error) {
        logger.error('UUID validation error:', error);
        ResponseUtil.badRequest(res, 'Invalid UUID format');
      }
    };
  };

  /**
   * Validate email parameter
   */
  static validateEmail = (paramName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const email = req.params[paramName] || req.body[paramName];
        
        if (!email) {
          ResponseUtil.badRequest(res, `${paramName} is required`);
          return;
        }

        if (!ValidationUtil.isValidEmail(email)) {
          ResponseUtil.badRequest(res, `Invalid ${paramName} format`);
          return;
        }

        next();
      } catch (error) {
        logger.error('Email validation error:', error);
        ResponseUtil.badRequest(res, 'Invalid email format');
      }
    };
  };

  /**
   * Validate required fields
   */
  static requireFields = (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const missingFields: string[] = [];
        
        for (const field of fields) {
          if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
            missingFields.push(field);
          }
        }

        if (missingFields.length > 0) {
          ResponseUtil.badRequest(res, `Missing required fields: ${missingFields.join(', ')}`);
          return;
        }

        next();
      } catch (error) {
        logger.error('Required fields validation error:', error);
        ResponseUtil.badRequest(res, 'Invalid request data');
      }
    };
  };

  /**
   * Validate enum values
   */
  static validateEnum = (fieldName: string, allowedValues: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const value = req.body[fieldName];
        
        if (value !== undefined && !allowedValues.includes(value)) {
          ResponseUtil.badRequest(res, `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}`);
          return;
        }

        next();
      } catch (error) {
        logger.error('Enum validation error:', error);
        ResponseUtil.badRequest(res, 'Invalid enum value');
      }
    };
  };

  /**
   * Validate array length
   */
  static validateArrayLength = (fieldName: string, minLength: number = 0, maxLength: number = Infinity) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const array = req.body[fieldName];
        
        if (array !== undefined) {
          if (!Array.isArray(array)) {
            ResponseUtil.badRequest(res, `${fieldName} must be an array`);
            return;
          }

          if (array.length < minLength) {
            ResponseUtil.badRequest(res, `${fieldName} must have at least ${minLength} items`);
            return;
          }

          if (array.length > maxLength) {
            ResponseUtil.badRequest(res, `${fieldName} must have at most ${maxLength} items`);
            return;
          }
        }

        next();
      } catch (error) {
        logger.error('Array length validation error:', error);
        ResponseUtil.badRequest(res, 'Invalid array length');
      }
    };
  };
}

// Export individual middleware functions
export const validateBody = ValidationMiddleware.validateBody;
export const validateParams = ValidationMiddleware.validateParams;
export const validateQuery = ValidationMiddleware.validateQuery;
export const validateFile = ValidationMiddleware.validateFile;
export const validatePagination = ValidationMiddleware.validatePagination;
export const sanitizeInput = ValidationMiddleware.sanitizeInput;
export const validateUUID = ValidationMiddleware.validateUUID;
export const validateEmail = ValidationMiddleware.validateEmail;
export const requireFields = ValidationMiddleware.requireFields;
export const validateEnum = ValidationMiddleware.validateEnum;
export const validateArrayLength = ValidationMiddleware.validateArrayLength;

export default ValidationMiddleware;

