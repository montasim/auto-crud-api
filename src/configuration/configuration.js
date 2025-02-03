import { z } from 'zod';
import dotenv from 'dotenv';

import environments from '../constants/environments.js';

import { CriticalError } from '../lib/customErrors.js';

dotenv.config();

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

    // MONGO_URI must be provided and follow the basic MongoDB URI pattern.
    MONGO_URI: z
        .string({
            required_error: 'The MONGO_URI environment variable is required.',
        })
        .refine((val) => /^mongodb(?:\+srv)?:\/\/.+/i.test(val), {
            message:
                'The MONGO_URI environment variable must be a valid MongoDB URI, starting with "mongodb://" or "mongodb+srv://".',
        }),
});

// Validate the environment variables.
// If validation fails, throw a CriticalError with a descriptive message.
let envVars;
try {
    envVars = envSchema.parse(process.env);
} catch (error) {
    if (error instanceof z.ZodError) {
        // Combine all error messages into a single string.
        const combinedErrors = error.errors
            .map((err) => err.message)
            .join(', ');
        throw new CriticalError(
            `Critical configuration error: ${combinedErrors}`
        );
    }
    throw error; // Rethrow non-Zod errors.
}

// Build the configuration object.
const configuration = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongoUri: envVars.MONGO_URI,
};

export default configuration;
