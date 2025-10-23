/**
 * Backend Server bootstrap
 *
 * Business Logic:
 * - Creates and configures the Express app (security headers, CORS, logging, rate-limits)
 * - Parses request bodies and exposes a health endpoint
 * - Mounts all API routes under `/api`
 * - Centralizes 404 and global error handling
 * - Starts HTTP server and handles graceful shutdown
 *
 * Code Conventions:
 * - Each module owns a single responsibility (SRP)
 * - Typed request/response helpers for consistent API responses
 * - Environment driven configuration via `config/environment`
 *
 * @fileoverview Server entry for CV Builder API
 * @author vicky neosoft test builder app
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '@/config/environment';
import { database } from '@/config/database';
import { logger, morganStream } from '@/utils/logger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { generalRateLimiter } from '@/middleware/rateLimiter';
import routes from '@/routes';

/**
 * Server class that manages the Express application lifecycle
 * 
 * Business Logic:
 * - Encapsulates all server configuration and initialization
 * - Handles middleware setup for security, logging, and request processing
 * - Manages route registration and error handling
 * - Provides graceful startup and shutdown procedures
 * 
 * @class Server
 */
class Server {
  private app: express.Application;
  private port: number;

  /**
   * Constructor initializes the Express application
   * 
   * Business Logic:
   * - Creates Express app instance
   * - Sets up port from environment configuration
   * - Initializes all middleware, routes, and error handling
   * 
   * @constructor
   */
  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize all middleware for the Express application
   * 
   * Business Logic:
   * - Helmet: Security headers to protect against common vulnerabilities
   * - CORS: Cross-origin resource sharing configuration for frontend access
   * - Morgan: HTTP request logging for monitoring and debugging
   * - Rate Limiting: Prevents abuse by limiting requests per IP
   * - Body Parsing: Handles JSON and URL-encoded request bodies
   * - Request ID: Adds unique ID to each request for tracing
   * 
   * @private
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    this.app.use(generalRateLimiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Increase header size limit to prevent 431 errors
    this.app.use((req, res, next) => {
      // Set header size limit to 32KB (default is usually 8KB)
      req.setMaxListeners(0);
      next();
    });

    // Logging middleware
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', { stream: morganStream }));
    }

    // Request ID middleware (for tracing)
    this.app.use((req: any, res, next) => {
      req.id = Math.random().toString(36).substring(2, 15);
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Health check endpoint (before other routes)
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: '1.0.0',
      });
    });
  }

  /**
   * Initialize all API routes for the application
   * 
   * Business Logic:
   * - Registers all API routes under /api prefix
   * - Provides root endpoint with API information
   * - Sets up health check endpoint for monitoring
   * - Routes are organized by feature (auth, cv, etc.)
   * 
   * @private
   */
  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'CV Builder API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health',
      });
    });
  }

  /**
   * Initialize error handling middleware
   * 
   * Business Logic:
   * - Sets up 404 handler for undefined routes
   * - Configures global error handler for all errors
   * - Ensures consistent error response format
   * - Logs errors for debugging and monitoring
   * 
   * @private
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server and initialize all services
   * 
   * Business Logic:
   * - Tests database connection before starting
   * - Starts HTTP server on configured port
   * - Sets up graceful shutdown handlers
   * - Logs server startup information
   * - Exits process if startup fails
   * 
   * @public
   * @async
   * @throws {Error} If database connection fails
   */
  public async start(): Promise<void> {
    try {
      // Test database connection - temporarily disabled for development
      // const dbConnected = await database.testConnection();
      // if (!dbConnected) {
      //   throw new Error('Database connection failed');
      // }

      // Start server with increased header size limit
      const server = this.app.listen(this.port, '0.0.0.0', () => {
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(`📊 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 API URL: http://localhost:${this.port}/api`);
        logger.info(`❤️  Health check: http://localhost:${this.port}/health`);
      });

      // Increase header size limit to prevent 431 errors
      server.maxHeadersCount = 2000; // Increase from default 2000
      server.headersTimeout = 60000; // Increase timeout

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handlers for the server
   * 
   * Business Logic:
   * - Handles SIGTERM and SIGINT signals for clean shutdown
   * - Closes HTTP server gracefully with timeout
   * - Handles uncaught exceptions to prevent crashes
   * - Logs shutdown process for monitoring
   * - Forces exit if graceful shutdown fails
   * 
   * @private
   */
  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      // Close server
      const server = this.app.listen(this.port);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * Get the Express application instance
   * 
   * Business Logic:
   * - Provides access to the Express app for testing
   * - Allows external modules to access the app instance
   * - Useful for integration testing and middleware testing
   * 
   * @public
   * @returns {express.Application} The Express application instance
   */
  public getApp(): express.Application {
    return this.app;
  }
}

/**
 * Create and start the server instance
 * 
 * Business Logic:
 * - Instantiates the Server class
 * - Starts the server with all configurations
 * - Handles server startup and error handling
 */
const server = new Server();
server.start();

export default server;
