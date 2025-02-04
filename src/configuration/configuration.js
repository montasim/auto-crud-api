import { z } from 'zod';
import dotenv from 'dotenv';
import axios from 'axios';

import environments from '../constants/environments.js';
import httpMethods from '../constants/httpMethods.js';

import { EnvironmentVariableError } from '../lib/customErrors.js';

dotenv.config();

// Helper function to check if a URL is reachable
const checkUrlExists = async (url) => {
    try {
        await axios.get(url); // Perform a GET request to the URL
        return true; // If successful, return true
    } catch (error) {
        return false; // If there's an error, return false (URL is not reachable)
    }
};

// Define a Zod schema for the required environment variables.
const envSchema = z.object({
    // NODE_ENV must be one of the allowed values.
    NODE_ENV: z.enum([...Object.values(environments)], {
        required_error: 'The NODE_ENV environment variable is required.',
        invalid_type_error: `NODE_ENV must be one of: ${Object.values(environments).join(', ')}.`,
    }),

    // PORT must be provided and be a valid integer between 1 and 65535.
    PORT: z.preprocess(
        (val) => Number(val),
        z
            .number({
                required_error: 'The PORT environment variable is required.',
                invalid_type_error:
                    'The PORT environment variable must be a valid integer.',
            })
            .int({
                message: 'The PORT environment variable must be an integer.',
            })
            .min(1, {
                message:
                    'The PORT environment variable must be greater than 0.',
            })
            .max(65535, {
                message:
                    'The PORT environment variable must be less than or equal to 65535.',
            })
    ),

    // DATABASE_MONGODB_CONNECTION_URI must be provided and follow the basic MongoDB URI pattern.
    DATABASE_MONGODB_CONNECTION_URI: z
        .string({
            required_error:
                'The DATABASE_MONGODB_CONNECTION_URI environment variable is required.',
        })
        .refine((val) => /^mongodb(?:\+srv)?:\/\/.+/i.test(val), {
            message:
                'The DATABASE_MONGODB_CONNECTION_URI environment variable must be a valid MongoDB URI, starting with "mongodb://" or "mongodb+srv://".',
        }),

    // CORS_ALLOWED_METHODS must be an array of allowed values
    CORS_ALLOWED_METHODS: z
        .string()
        .transform((val) => val.split(',').map((method) => method.trim())) // Split string into an array
        .refine(
            (methods) =>
                methods.every((method) =>
                    Object.values(httpMethods).includes(method)
                ),
            {
                message: `CORS_ALLOWED_METHODS must be one of: ${Object.values(httpMethods).join(', ')}`,
            }
        ),

    // CORS_ALLOWED_ORIGIN must be a valid URL or a comma-separated list of valid URLs
    CORS_ALLOWED_ORIGIN: z
        .string()
        .transform((val) => val.split(',').map((url) => url.trim())) // Split string into an array of URLs
        .refine(
            async (origins) => {
                const validationResults = await Promise.all(
                    origins.map(async (origin) => {
                        origin = origin.trim();

                        if (
                            origin.includes('localhost') ||
                            origin.includes('127.0.0.1')
                        ) {
                            return true;
                        } else {
                            try {
                                new URL(origin); // Validate URL structure
                                return await checkUrlExists(origin); // Check if the URL exists
                            } catch {
                                return false; // Invalid URL format
                            }
                        }
                    })
                );
                return validationResults.every((result) => result === true);
            },
            {
                message:
                    'CORS_ALLOWED_ORIGIN must be a valid URL and reachable.',
            }
        ),

    // CORS_ALLOWED_HEADERS must be a valid non-empty string (can be a comma-separated list)
    CORS_ALLOWED_HEADERS: z
        .string()
        .min(1, { message: 'CORS_ALLOWED_HEADERS must be a valid string.' }) // Ensure it's a non-empty string
        .transform((val) => val.split(',').map((header) => header.trim())) // Split string into an array of headers
        .refine(
            (headers) =>
                headers.every((header) => /^[a-zA-Z0-9-_]+$/.test(header)), // Validate each header
            {
                message:
                    'CORS_ALLOWED_HEADERS must be a valid string of comma-separated values with valid characters.',
            }
        ),
});

// Validate the environment variables asynchronously.
// If validation fails, throw a EnvironmentVariableError with a descriptive message.
let envVars;
try {
    envVars = await envSchema.parseAsync(process.env); // Use parseAsync for asynchronous validation
} catch (error) {
    if (error instanceof z.ZodError) {
        // Combine all error messages into a single string.
        const combinedErrors = error.errors
            .map((err) => err.message)
            .join(', ');
        throw new EnvironmentVariableError(
            `Critical configuration error: ${combinedErrors}`
        );
    }
    throw error; // Rethrow non-Zod errors.
}

// Build the configuration object.
const configuration = {
    env: envVars.NODE_ENV,

    port: envVars.PORT,

    database: {
        mongodb: {
            connectionUri: envVars.DATABASE_MONGODB_CONNECTION_URI,
        },
    },

    cors: {
        allowedMethods: envVars.CORS_ALLOWED_METHODS,
        allowedOrigin: envVars.CORS_ALLOWED_ORIGIN,
        allowedHeaders: envVars.CORS_ALLOWED_HEADERS,
    },
};

export default configuration;
