import winston from 'winston';
import 'winston-daily-rotate-file';
import logSymbols from 'log-symbols';
import path from 'path';

// Define log directory
const LOG_DIR = 'logs';

// Function to map log levels to log symbols
const logLevelToSymbol = {
    info: logSymbols.success, // ✅
    warn: logSymbols.warning, // ⚠️
    error: logSymbols.error, // ❌
    debug: logSymbols.info, // ℹ️
};

// Create a custom log format with log symbols
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Improved timestamp format
    winston.format.printf(({ timestamp, level, message }) => {
        const symbol = logLevelToSymbol[level] || logSymbols.info; // Default to ℹ️
        return `${timestamp} [${level.toUpperCase()}] ${symbol} ${message}`;
    })
);

// Create a function to configure daily rotated file transport
const createDailyRotateTransport = (filename, level) =>
    new winston.transports.DailyRotateFile({
        dirname: LOG_DIR, // Directory where log files will be saved
        filename: path.join(LOG_DIR, `${filename}-%DATE%.log`), // Include filename pattern with date
        datePattern: 'YYYY-MM-DD', // Rotate daily
        maxFiles: '30d', // Retain logs for 30 days
        level, // Minimum log level for this file
        format: customFormat,
    });

// Create logger instance
const logger = winston.createLogger({
    level: 'info',
    format: customFormat, // Apply the custom format globally
    transports: [
        new winston.transports.Console({ format: customFormat }), // Console logging with symbols
        createDailyRotateTransport('combined', 'info'), // All logs with daily rotation
        createDailyRotateTransport('errors', 'error'), // Error logs with daily rotation
    ],
});

export default logger;
