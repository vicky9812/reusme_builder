/**
 * Response Utilities
 *
 * Business Logic:
 * - Centralizes JSON response shapes and status codes
 * - Ensures consistent `{ success, message, data }` contract
 *
 * Code Conventions:
 * - No logging here; just response formatting
 *
 * @fileoverview HTTP response helpers
 * @author vicky neosoft test builder app
 */
import { Response } from 'express';
import { HTTP_STATUS, API_MESSAGES } from '@/shared/constants';
import { ApiResponse, PaginationInfo } from '@/shared/types';

/**
 * Utility class for standardizing API responses
 */
export class ResponseUtil {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data?: T,
    message: string = API_MESSAGES.SUCCESS,
    statusCode: number = HTTP_STATUS.OK
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response
   */
  static created<T>(
    res: Response,
    data?: T,
    message: string = API_MESSAGES.CREATED
  ): Response {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  /**
   * Send success response with pagination
   */
  static successWithPagination<T>(
    res: Response,
    data: T[],
    pagination: PaginationInfo,
    message: string = API_MESSAGES.SUCCESS
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      pagination,
    };

    return res.status(HTTP_STATUS.OK).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string = API_MESSAGES.INTERNAL_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    error?: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send bad request response
   */
  static badRequest(
    res: Response,
    message: string = API_MESSAGES.BAD_REQUEST,
    error?: string
  ): Response {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, error);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(
    res: Response,
    message: string = API_MESSAGES.UNAUTHORIZED,
    error?: string
  ): Response {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED, error);
  }

  /**
   * Send forbidden response
   */
  static forbidden(
    res: Response,
    message: string = API_MESSAGES.FORBIDDEN,
    error?: string
  ): Response {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN, error);
  }

  /**
   * Send not found response
   */
  static notFound(
    res: Response,
    message: string = API_MESSAGES.NOT_FOUND,
    error?: string
  ): Response {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND, error);
  }

  /**
   * Send conflict response
   */
  static conflict(
    res: Response,
    message: string = API_MESSAGES.CONFLICT,
    error?: string
  ): Response {
    return this.error(res, message, HTTP_STATUS.CONFLICT, error);
  }

  /**
   * Send validation error response
   */
  static validationError(
    res: Response,
    message: string = API_MESSAGES.VALIDATION_ERROR,
    error?: string
  ): Response {
    return this.error(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, error);
  }

  /**
   * Send payment required response
   */
  static paymentRequired(
    res: Response,
    message: string = API_MESSAGES.PAYMENT_REQUIRED,
    error?: string
  ): Response {
    return this.error(res, message, HTTP_STATUS.PAYMENT_REQUIRED, error);
  }

  /**
   * Create pagination info object
   */
  static createPaginationInfo(
    page: number,
    limit: number,
    total: number
  ): PaginationInfo {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * Send file download response
   */
  static download(
    res: Response,
    filePath: string,
    fileName: string
  ): void {
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('File download error:', err);
        this.error(res, 'File download failed');
      }
    });
  }

  /**
   * Send file stream response
   */
  static stream(
    res: Response,
    stream: NodeJS.ReadableStream,
    contentType: string,
    fileName?: string
  ): void {
    res.setHeader('Content-Type', contentType);
    if (fileName) {
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    }
    stream.pipe(res);
  }
}

export default ResponseUtil;
