import httpStatus from 'http-status-lite';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

import logger from '../lib/logger.js';
import configuration from '../configuration/configuration.js';
import environments from '../constants/environments.js';

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
            logger.info(
                `STARTED: ${fn.name} - ${req.method} ${req.originalUrl}`
            );

            await fn(req, res, next);
        } catch (error) {
            let status;
            let message;
            let errorDetails;

            // Handling Zod Validation Errors
            if (error instanceof ZodError) {
                status = httpStatus.BAD_REQUEST;
                message =
                    'Invalid input data. Please ensure the provided data follows the correct format.';
                errorDetails = new ZodValidationError(error.errors).details;
                logger.warn(`Zod Validation Error: ${message}`, errorDetails);
            }
            // Handling Mongoose Validation Errors
            else if (error instanceof mongoose.Error.ValidationError) {
                status = httpStatus.BAD_REQUEST;
                message =
                    'Database validation failed. Please check the submitted values.';
                errorDetails = new MongooseValidationError(error.errors)
                    .details;
                logger.warn(
                    `Mongoose Validation Error: ${message}`,
                    errorDetails
                );
            }
            // Handling MongoDB Duplicate Key Errors
            else if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                status = httpStatus.CONFLICT;
                message = `Duplicate value error: ${field} already exists`;
                errorDetails = new DuplicateKeyError(
                    field,
                    error.keyValue[field]
                ).details;
                logger.warn(`Duplicate Key Error: ${message}`, errorDetails);
            }
            // Handling Mongoose Cast Errors (Invalid ObjectId)
            else if (error instanceof mongoose.Error.CastError) {
                status = httpStatus.BAD_REQUEST;
                message = `Invalid value for the field "${error.path}". Expected a valid MongoDB ObjectId but received: "${error.value}".`;
                errorDetails = new InvalidObjectIdError(error.path, error.value)
                    .details;
                logger.warn(`Invalid ObjectId Error: ${message}`, errorDetails);
            }
            // Handling Custom Application Errors
            else if (error instanceof AppError) {
                status = error.statusCode;
                message = `Application Error: ${error.message}`;
                errorDetails = error.details;
                logger.warn(`AppError: ${message}`, errorDetails);
            }
            // Generic server errors
            else {
                status = httpStatus.INTERNAL_SERVER_ERROR;
                message =
                    error.message ||
                    'An unexpected error occurred on the server.';
                errorDetails =
                    configuration.env === environments.PRODUCTION
                        ? undefined
                        : error.stack;
                logger.error(`Server Error: ${message}`, errorDetails);
            }

            // Send the response with the detailed error information
            return sendResponse(
                req,
                res,
                {},
                status,
                false,
                message,
                {},
                {},
                errorDetails
            );
        } finally {
            logger.info(
                `COMPLETED: ${fn.name} - ${req.method} ${req.originalUrl}`
            );
        }
    };
};

export default asyncHandler;
