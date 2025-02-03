import httpStatus from 'http-status-lite';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

import logger from '../lib/logger.js';

import sendResponse from './sendResponse.js';

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
                    error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    }))
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
                    Object.values(error.errors).map((e) => ({
                        field: e.path,
                        message: e.message,
                    }))
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
                    { field, value: error.keyValue[field] }
                );
            }

            // Handle Other Mongoose Errors (e.g., CastError for invalid ObjectId)
            if (error instanceof mongoose.Error.CastError) {
                return sendResponse(
                    res,
                    {},
                    httpStatus.BAD_REQUEST,
                    false,
                    `Invalid ${error.path}: ${error.value}`
                );
            }

            // Handle General Errors
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
