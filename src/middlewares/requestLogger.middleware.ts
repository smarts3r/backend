import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capture the original res.end method to log after response is sent
  const originalEnd = res.end;

  res.end = function(chunk?: any, encoding?: any, callback?: any) {
    const duration = Date.now() - startTime;

    // Log the request details
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      responseTime: `${duration}ms`,
      body: req.body && Object.keys(req.body).length > 0 ? '[BODY_DATA]' : undefined,
    });

    // Call the original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};