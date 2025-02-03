import httpStatus from 'http-status-lite';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

import logger from '../lib/logger.js';

import sendResponse from './sendResponse.js';
import {
    AppError,
    ZodValidationError,
    MongooseValidationError,
    DuplicateKeyError,
    InvalidObjectIdError,
} from '../lib/customErrors.js';

const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            logger.error(`FAILED: ${fn.name}`, error);

            // Handle Zod Validation Errors
            if (error instanceof ZodError) {
                return sendResponse(
                    res,
                    {},
                    httpStatus.BAD_REQUEST,
                    false,
                    'Validation failed',
                    {},
                    new ZodValidationError(error.errors).details
                );
            }

            // Handle Mongoose Validation Errors
            if (error instanceof mongoose.Error.ValidationError) {
                return sendResponse(
                    res,
                    {},
                    httpStatus.BAD_REQUEST,
                    false,
                    'Database validation failed',
                    {},
                    new MongooseValidationError(error.errors).details
                );
            }

            // Handle MongoDB Duplicate Key Errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                return sendResponse(
                    res,
                    {},
                    httpStatus.CONFLICT,
                    false,
                    `Duplicate value error: ${field} already exists`,
                    {},
                    new DuplicateKeyError(field, error.keyValue[field]).details
                );
            }

            // Handle Mongoose Cast Errors (Invalid ObjectId)
            if (error instanceof mongoose.Error.CastError) {
                return sendResponse(
                    res,
                    {},
                    httpStatus.BAD_REQUEST,
                    false,
                    `Invalid ${error.path}: ${error.value}`,
                    {},
                    new InvalidObjectIdError(error.path, error.value).details
                );
            }

            // Handle General Errors
            if (error instanceof AppError) {
                return sendResponse(
                    res,
                    {},
                    error.statusCode,
                    false,
                    error.message,
                    {},
                    error.details
                );
            }

            return sendResponse(
                res,
                {},
                httpStatus.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Internal Server Error',
                {},
                process.env.NODE_ENV === 'production' ? undefined : error.stack
            );
        } finally {
            logger.info(`COMPLETED: ${fn.name}`);
        }
    };
};

export default asyncHandler;
