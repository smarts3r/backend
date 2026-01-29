import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Generic validation middleware using Zod
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body by default
      const parsedData = schema.parse(req.body);
      req.body = parsedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for response
        const errors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        logger.error('Validation Error:', {
          errors,
          requestBody: req.body,
          url: req.url,
          method: req.method,
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
};

/**
 * Validation middleware for specific parts of the request
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = schema.parse(req.body);
      req.body = parsedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        logger.error('Body Validation Error:', {
          errors,
          requestBody: req.body,
          url: req.url,
          method: req.method,
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = schema.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsedData,
        writable: true,
        configurable: true,
        enumerable: true
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        logger.error('Query Validation Error:', {
          errors,
          query: req.query,
          url: req.url,
          method: req.method,
        });

        return res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors,
        });
      }

      logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = schema.parse(req.params);
      Object.defineProperty(req, 'params', {
        value: parsedData,
        writable: true,
        configurable: true,
        enumerable: true
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        logger.error('Params Validation Error:', {
          errors,
          params: req.params,
          url: req.url,
          method: req.method,
        });

        return res.status(400).json({
          success: false,
          message: 'Params validation failed',
          errors,
        });
      }

      logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
};