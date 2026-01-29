import winston from 'winston';
import path from 'path';

const { combine, timestamp, label, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, label, timestamp, stack }) => {
  return `${timestamp} [${label}] ${level}: ${stack || message}`;
});

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || 'info';

// Define transports for different environments
const consoleTransport = new winston.transports.Console({
  level: logLevel,
  format: combine(
    colorize(),
    label({ label: 'Express API' }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  silent: process.env.NODE_ENV === 'test'
});

const transports: winston.transport[] = [consoleTransport];

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: combine(
        label({ label: 'Express API' }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      level: 'info',
      format: combine(
        label({ label: 'Express API' }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      )
    })
  );
} else {
  // Create logs directory for development if it doesn't exist
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      level: 'info',
      format: combine(
        label({ label: 'Express API' }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      )
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    label({ label: 'Express API' }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports,
  exitOnError: false, // Do not exit on uncaught exceptions
});

// Create a request logger
export const requestLoggerInstance = winston.createLogger({
  level: logLevel,
  format: combine(
    label({ label: 'Express API' }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'requests.log'),
      level: 'info',
      format: combine(
        label({ label: 'Express API' }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        printf(({ level, message, label, timestamp }) => {
          return `${timestamp} [${label}] ${level}: ${message}`;
        })
      )
    })
  ],
  exitOnError: false,
});

// Stream object for Morgan-like middleware
export const stream = {
  write: (message: string) => {
    requestLoggerInstance.info(message.trim());
  },
};