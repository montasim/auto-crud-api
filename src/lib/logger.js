import winston from 'winston';
import 'winston-daily-rotate-file';
import logSymbols from 'log-symbols';

import environments from "../constants/environments.js";

// Define log directory
const LOG_DIR = 'logs';

// Map log levels to log symbols
const logLevelToSymbol = {
    info: logSymbols.success, // ✅
    warn: logSymbols.warning, // ⚠️
    error: logSymbols.error,  // ❌
    debug: logSymbols.info,   // ℹ️
};

// Create a custom log format with log symbols
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        const symbol = logLevelToSymbol[level] || logSymbols.info;
        return `${timestamp} [${level.toUpperCase()}] ${symbol} ${message}`;
    })
);

// Create a function to configure daily rotated file transport
const createDailyRotateTransport = (filename, level) =>
    new winston.transports.DailyRotateFile({
        dirname: LOG_DIR,
        filename: `${filename}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        level,
        format: customFormat,
    });

// Prepare the transports array conditionally based on environment
const transports = [];

// In development, add both console and file transports
if (process.env.NODE_ENV !== environments.PRODUCTION) {
    transports.push(
        new winston.transports.Console({ format: customFormat }),
        createDailyRotateTransport('combined', 'info'),
        createDailyRotateTransport('errors', 'error')
    );
}

// Create logger instance with the conditional transports
const logger = winston.createLogger({
    level: 'info',
    format: customFormat,
    transports,
});

export default logger;
