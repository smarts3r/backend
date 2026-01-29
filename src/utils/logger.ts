import winston from 'winston';
import path from 'path';

const { combine, timestamp, label, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, label, timestamp, stack }) => {
  return `${timestamp} [${label}] ${level}: ${stack || message}`;
});

const logLevel = process.env.LOG_LEVEL || 'info';

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

const isVercel = process.env.VERCEL === '1';

if (process.env.NODE_ENV === 'production' && !isVercel) {
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
} else if (!isVercel) {

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

export const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    label({ label: 'Express API' }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports,
  exitOnError: false,
});

const requestTransports: winston.transport[] = [];
if (!isVercel) {
  requestTransports.push(
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
  );
} else {
  requestTransports.push(consoleTransport);
}

export const requestLoggerInstance = winston.createLogger({
  level: logLevel,
  format: combine(
    label({ label: 'Express API' }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: requestTransports,
  exitOnError: false,
});

export const stream = {
  write: (message: string) => {
    requestLoggerInstance.info(message.trim());
  },
};