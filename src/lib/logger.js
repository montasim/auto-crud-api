import winston from 'winston';
import 'winston-daily-rotate-file';

// Create a custom log format
const customFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
);

// Daily rotation transport for all logs
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
    dirname: 'logs', // Directory where log files will be saved
    filename: 'combined-%DATE%.log', // Filename pattern with date placeholder
    datePattern: 'YYYY-MM-DD', // Rotate daily
    maxFiles: '30d', // Retain logs for 30 days
    level: 'info', // Minimum log level for this file
    format: customFormat,
});

// Daily rotation transport specifically for errors
const dailyRotateErrorFileTransport = new winston.transports.DailyRotateFile({
    dirname: 'logs', // Directory where error log files will be saved
    filename: 'errors-%DATE%.log', // Filename pattern for errors with date placeholder
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    level: 'error',
    format: customFormat,
});

const logger = winston.createLogger({
    level: 'info',
    format: customFormat, // Apply the custom format globally
    transports: [
        new winston.transports.Console({
            format: customFormat,
        }),
        dailyRotateFileTransport, // All logs with daily rotation
        dailyRotateErrorFileTransport, // Error logs with daily rotation
    ],
});

export default logger;
