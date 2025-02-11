/**
 * Application Configuration Loader - Loads, validates, and structures application settings from environment variables.
 *
 * File: configuration.js
 * Path: src/configuration/configuration.js
 *
 * Description:
 * This file is responsible for loading all necessary environment variables for the application
 * and validating them against a predefined schema using Zod. It utilizes dotenv to load variables
 * from a .env file and defines a comprehensive schema to ensure that all required configurations
 * are present and of the correct type. The validated environment variables are then structured into
 * a configuration object, making it easy to access application settings throughout the codebase.
 * It includes validation for various aspects of the application, such as server settings, database connections,
 * authentication parameters, rate limiting, cookie settings, JWT secrets, CORS policies, system localization,
 * debugging configurations, contact information, social media links, email service settings, and cloud service credentials.
 * Error handling is implemented to catch validation failures and unexpected errors, providing informative
 * messages and preventing the application from starting with an invalid configuration.
 *
 * Author(s): Mohammad Montasim -Al- Mamun Shuvo
 * Maintainer(s): Mohammad Montasim -Al- Mamun Shuvo
 * Created: 2024-02-29
 * Last Modified: 2024-02-29
 * Version: 1.0.0
 *
 * License: Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)
 *          Copyright (c) 2024 Mohammad Montasim -Al- Mamun Shuvo
 *          License URL: https://creativecommons.org/licenses/by-nc-nd/4.0/
 *          Key License Terms: (See full license for complete terms, conditions, and limitations)
 *
 * Dependencies:
 *   - zod: For schema validation.
 *   - dotenv: For loading environment variables from .env file.
 *   - environments.js: For environment type constants.
 *   - httpMethods.js: For HTTP method constants used in CORS configuration.
 *   - routesConfig.mjs: For application route configurations.
 *   - logger.js: For application-wide logging.
 *   - isUrlReachable.js: Utility for checking URL reachability (used in CORS origin validation).
 *   - customErrors.js: For custom error classes, including EnvironmentVariableError.
 *
 * Usage Instructions:
 * Import the 'configuration' object from this file to access validated application settings
 * throughout your application.  Example: `import configuration from './config/configuration.js';`
 * Access settings via nested properties, e.g., `configuration.server.port`, `configuration.database.mongodb.uri`.
 *
 * Notes:
 * - The CORS_ALLOWED_ORIGINS validation includes a reachability check for each origin, which might
 *   add to the startup time, especially with a long list of origins. Consider caching or other optimization
 *   strategies if startup performance becomes a concern in production environments.
 * - Ensure all environment variables defined in the schema are properly set in your .env file or environment
 *   before running the application. Validation errors will prevent the application from starting if critical
 *   configurations are missing or invalid.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

import environments from '../constants/environments.js';
import httpMethods from '../constants/httpMethods.js';
import routesConfig from '../../routes.config.mjs';
import logger from '../lib/logger.js';

import isUrlReachable from '../utils/isUrlReachable.js';
import getIntValue from '../utils/getIntValue.js';
import getBooleanValue from '../utils/getBooleanValue.js';

import { EnvironmentVariableError } from '../lib/customErrors.js';

dotenv.config();

// --- 1. Streamlined Boolean Preprocessing ---
const toBoolean = z.preprocess((val) => {
    if (typeof val === 'boolean') return val; // Keep booleans as is
    if (['true', 'false'].includes(String(val).toLowerCase())) {
        return String(val).toLowerCase() === 'true';
    }
    return undefined; // Let Zod handle invalid boolean conversion
}, z.boolean());

// --- 2. Reusable Number Preprocessing ---
const toNumber = (schema) =>
    z
        .preprocess((val) => {
            if (typeof val === 'number') {
                return val;
            }
            if (typeof val === 'string') {
                const num = Number(val);
                if (!isNaN(num)) {
                    return num;
                }
            }
            return val; // Return original if conversion fails
        }, z.any())
        .pipe(schema);

// --- 3. Centralized String Splitting and Trimming ---
const splitAndTrimString = (schema) =>
    z
        .string()
        .transform((val) => val.split(',').map((item) => item.trim()))
        .pipe(schema);

// Define a Zod schema for all required environment variables using more descriptive names.
const envSchema = z.object({
    // Application
    NODE_ENV: z.enum([...Object.values(environments)], {
        required_error: 'NODE_ENV is required.',
        invalid_type_error: `NODE_ENV must be one of: ${Object.values(environments).join(', ')}.`,
    }),

    // Server
    SERVER_URL: z
        .string({
            required_error: 'SERVER_URL is required.',
        })
        .refine(
            async (val) => {
                val = val.trim();

                if (val.includes('localhost') || val.includes('127.0.0.1')) {
                    return true;
                } else {
                    try {
                        new URL(val); // Validate URL structure
                        return await isUrlReachable(val); // Check if the URL exists
                    } catch {
                        return false; // Invalid URL format
                    }
                }
            },
            {
                message: 'SERVER_URL must be a valid URL and reachable.',
            }
        ),
    SERVER_PORT: toNumber(
        z
            .number({
                required_error: 'SERVER_PORT is required.',
                invalid_type_error: 'SERVER_PORT must be a valid integer.',
            })
            .int({ message: 'SERVER_PORT must be an integer.' })
            .min(1, { message: 'SERVER_PORT must be greater than 0.' })
            .max(65535, {
                message: 'SERVER_PORT must be less than or equal to 65535.',
            })
    ),
    SERVER_TIMEOUT_SECONDS: toNumber(
        z
            .number({ required_error: 'SERVER_TIMEOUT_SECONDS is required.' })
            .min(1, {
                message: 'SERVER_TIMEOUT_SECONDS must be a positive number.',
            })
    ),
    SERVER_JSON_PAYLOAD_LIMIT_KB: toNumber(
        z
            .number({
                required_error: 'SERVER_JSON_PAYLOAD_LIMIT_KB is required.',
            })
            .min(1, {
                message:
                    'SERVER_JSON_PAYLOAD_LIMIT_KB must be a positive number.',
            })
    ),

    // Database - MongoDB
    MONGODB_CONNECTION_URI: z
        .string({
            required_error: 'MONGODB_CONNECTION_URI is required.',
        })
        .refine((val) => /^mongodb(?:\+srv)?:\/\/.+/i.test(val), {
            message:
                'MONGODB_CONNECTION_URI must be a valid MongoDB URI starting with "mongodb://" or "mongodb+srv://".',
        }),

    // Database - Prisma
    PRISMA_PROVIDER: z.string({
        required_error: 'PRISMA_PROVIDER is required.',
    }),
    PRISMA_DATABASE_URL: z.string({
        required_error: 'PRISMA_DATABASE_URL is required.',
    }),

    // Cache
    CACHE_DEFAULT_TTL_SECONDS: toNumber(
        z
            .number({
                required_error: 'CACHE_DEFAULT_TTL_SECONDS is required.',
            })
            .min(1)
    ),

    // Authentication - Attempts & Lockout
    AUTH_MAX_LOGIN_ATTEMPTS: toNumber(
        z
            .number({
                required_error: 'AUTH_MAX_LOGIN_ATTEMPTS is required.',
            })
            .min(1)
    ),
    AUTH_MAX_RESET_PASSWORD_ATTEMPTS: toNumber(
        z
            .number({
                required_error: 'AUTH_MAX_RESET_PASSWORD_ATTEMPTS is required.',
            })
            .min(1)
    ),
    AUTH_MAX_VERIFY_EMAIL_ATTEMPTS: toNumber(
        z
            .number({
                required_error: 'AUTH_MAX_VERIFY_EMAIL_ATTEMPTS is required.',
            })
            .min(1)
    ),
    AUTH_MAX_CHANGE_EMAIL_ATTEMPTS: toNumber(
        z
            .number({
                required_error: 'AUTH_MAX_CHANGE_EMAIL_ATTEMPTS is required.',
            })
            .min(1)
    ),
    AUTH_MAX_CHANGE_PASSWORD_ATTEMPTS: toNumber(
        z
            .number({
                required_error:
                    'AUTH_MAX_CHANGE_PASSWORD_ATTEMPTS is required.',
            })
            .min(1)
    ),
    AUTH_MAX_ACTIVE_SESSIONS: toNumber(
        z
            .number({
                required_error: 'AUTH_MAX_ACTIVE_SESSIONS is required.',
            })
            .min(1)
    ),
    AUTH_LOCK_DURATION_LOGIN_SECONDS: toNumber(
        z
            .number({
                required_error: 'AUTH_LOCK_DURATION_LOGIN_SECONDS is required.',
            })
            .min(0)
    ),
    AUTH_LOCK_DURATION_RESET_PASSWORD_SECONDS: toNumber(
        z
            .number({
                required_error:
                    'AUTH_LOCK_DURATION_RESET_PASSWORD_SECONDS is required.',
            })
            .min(0)
    ),
    AUTH_LOCK_DURATION_VERIFY_EMAIL_SECONDS: toNumber(
        z
            .number({
                required_error:
                    'AUTH_LOCK_DURATION_VERIFY_EMAIL_SECONDS is required.',
            })
            .min(0)
    ),
    AUTH_LOCK_DURATION_CHANGE_EMAIL_SECONDS: toNumber(
        z
            .number({
                required_error:
                    'AUTH_LOCK_DURATION_CHANGE_EMAIL_SECONDS is required.',
            })
            .min(0)
    ),
    AUTH_LOCK_DURATION_CHANGE_PASSWORD_SECONDS: toNumber(
        z
            .number({
                required_error:
                    'AUTH_LOCK_DURATION_CHANGE_PASSWORD_SECONDS is required.',
            })
            .min(0)
    ),

    // Rate Limiting
    RATE_LIMIT_MAX_REQUESTS_PER_WINDOW: toNumber(
        z
            .number({
                required_error:
                    'RATE_LIMIT_MAX_REQUESTS_PER_WINDOW is required.',
            })
            .min(1)
    ),
    RATE_LIMIT_WINDOW_MS: toNumber(
        z.number({ required_error: 'RATE_LIMIT_WINDOW_MS is required.' }).min(1)
    ),
    RATE_LIMIT_EXPOSE_HEADERS: z.string({
        // More descriptive name
        required_error: 'RATE_LIMIT_EXPOSE_HEADERS is required.',
    }),

    // Cookie - User
    COOKIE_USER_NAME: z.string({
        required_error: 'COOKIE_USER_NAME is required.',
    }),
    COOKIE_USER_MAX_AGE_SECONDS: toNumber(
        z
            .number({
                required_error: 'COOKIE_USER_MAX_AGE_SECONDS is required.',
            })
            .min(1)
    ),
    COOKIE_USER_SECURE: toBoolean,
    COOKIE_USER_HTTP_ONLY: toBoolean,
    COOKIE_USER_SAME_SITE: z.string({
        required_error: 'COOKIE_USER_SAME_SITE is required.',
    }),

    // Cookie - Admin
    COOKIE_ADMIN_NAME: z.string({
        required_error: 'COOKIE_ADMIN_NAME is required.',
    }),
    COOKIE_ADMIN_MAX_AGE_SECONDS: toNumber(
        z
            .number({
                required_error: 'COOKIE_ADMIN_MAX_AGE_SECONDS is required.',
            })
            .min(1)
    ),
    COOKIE_ADMIN_SECURE: toBoolean,
    COOKIE_ADMIN_HTTP_ONLY: toBoolean,
    COOKIE_ADMIN_SAME_SITE: z.string({
        required_error: 'COOKIE_ADMIN_SAME_SITE is required.',
    }),

    // JWT - Access Token
    JWT_ACCESS_TOKEN_SECRET: z.string({
        required_error: 'JWT_ACCESS_TOKEN_SECRET is required.',
    }),
    JWT_ACCESS_TOKEN_EXPIRY_MINUTES: toNumber(
        z
            .number({
                required_error: 'JWT_ACCESS_TOKEN_EXPIRY_MINUTES is required.',
            })
            .min(1)
    ),

    // JWT - Refresh Token
    JWT_REFRESH_TOKEN_SECRET: z.string({
        required_error: 'JWT_REFRESH_TOKEN_SECRET is required.',
    }),
    JWT_REFRESH_TOKEN_EXPIRY_MINUTES: toNumber(
        z
            .number({
                required_error: 'JWT_REFRESH_TOKEN_EXPIRY_MINUTES is required.',
            })
            .min(1)
    ),

    // JWT - Reset Password Token
    JWT_RESET_PASSWORD_TOKEN_SECRET: z.string({
        required_error: 'JWT_RESET_PASSWORD_TOKEN_SECRET is required.',
    }),
    JWT_RESET_PASSWORD_TOKEN_EXPIRY_MINUTES: toNumber(
        z
            .number({
                required_error:
                    'JWT_RESET_PASSWORD_TOKEN_EXPIRY_MINUTES is required.',
            })
            .min(1)
    ),

    // JWT - Verify Email Token
    JWT_VERIFY_EMAIL_TOKEN_SECRET: z.string({
        required_error: 'JWT_VERIFY_EMAIL_TOKEN_SECRET is required.',
    }),
    JWT_VERIFY_EMAIL_TOKEN_EXPIRY_MINUTES: toNumber(
        z
            .number({
                required_error:
                    'JWT_VERIFY_EMAIL_TOKEN_EXPIRY_MINUTES is required.',
            })
            .min(1)
    ),

    // CORS
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
    CORS_ALLOWED_ORIGINS: z
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
                                return await isUrlReachable(origin); // Check if the URL exists
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
    CORS_SITE_IDENTIFIER_HEADER: z.string({
        // More descriptive name
        required_error: 'CORS_SITE_IDENTIFIER_HEADER is required.',
    }),

    // System - Localization
    SYSTEM_TIMEZONE: z.string({
        required_error: 'SYSTEM_TIMEZONE is required.',
    }),
    SYSTEM_LOCALE: z.string({ required_error: 'SYSTEM_LOCALE is required.' }),
    SYSTEM_CURRENCY: z.string({
        required_error: 'SYSTEM_CURRENCY is required.',
    }),
    SYSTEM_COUNTRY_CODE: z.string({
        required_error: 'SYSTEM_COUNTRY_CODE is required.',
    }), // More descriptive

    // System - Admin Contact
    SYSTEM_ADMIN_EMAIL: z.string({
        required_error: 'SYSTEM_ADMIN_EMAIL is required.',
    }),
    SYSTEM_ADMIN_NAME: z.string({
        required_error: 'SYSTEM_ADMIN_NAME is required.',
    }),
    SYSTEM_ADMIN_PASSWORD: z.string({
        required_error: 'SYSTEM_ADMIN_PASSWORD is required.',
    }),

    // System - Debugging
    SYSTEM_DEBUG_LOG_LEVEL: z.string({
        required_error: 'SYSTEM_DEBUG_LOG_LEVEL is required.',
    }),
    SYSTEM_DEBUG_ALLOWED_USER_AGENTS: z.string({
        required_error: 'SYSTEM_DEBUG_ALLOWED_USER_AGENTS is required.',
    }),
    SYSTEM_DEBUG_ALLOWED_IPS: z.string({
        required_error: 'SYSTEM_DEBUG_ALLOWED_IPS is required.',
    }),
    SYSTEM_DEBUG_KEY: z.string({
        required_error: 'SYSTEM_DEBUG_KEY is required.',
    }),

    // System - General Contact
    SYSTEM_CONTACT_EMAIL: z.string({
        required_error: 'SYSTEM_CONTACT_EMAIL is required.',
    }),
    SYSTEM_CONTACT_PHONE: z.string({
        required_error: 'SYSTEM_CONTACT_PHONE is required.',
    }),

    // System - Support Contact
    SYSTEM_SUPPORT_EMAIL: z.string({
        required_error: 'SYSTEM_SUPPORT_EMAIL is required.',
    }),
    SYSTEM_SUPPORT_PHONE: z.string({
        required_error: 'SYSTEM_SUPPORT_PHONE is required.',
    }),

    // Social Media Links
    SOCIAL_MEDIA_LINKEDIN_URL: z.string({
        // More explicit naming
        required_error: 'SOCIAL_MEDIA_LINKEDIN_URL is required.',
    }),
    SOCIAL_MEDIA_FACEBOOK_URL: z.string({
        // More explicit naming
        required_error: 'SOCIAL_MEDIA_FACEBOOK_URL is required.',
    }),
    SOCIAL_MEDIA_X_URL: z.string({
        // More explicit naming, using X instead of TWITTER
        required_error: 'SOCIAL_MEDIA_X_URL is required.',
    }),
    SOCIAL_MEDIA_INSTAGRAM_URL: z.string({
        // More explicit naming
        required_error: 'SOCIAL_MEDIA_INSTAGRAM_URL is required.',
    }),
    SOCIAL_MEDIA_YOUTUBE_URL: z.string({
        // More explicit naming
        required_error: 'SOCIAL_MEDIA_YOUTUBE_URL is required.',
    }),
    SOCIAL_MEDIA_GITHUB_URL: z.string({
        // More explicit naming
        required_error: 'SOCIAL_MEDIA_GITHUB_URL is required.',
    }),

    // Email Service - SMTP
    EMAIL_SMTP_HOST: z.string({
        required_error: 'EMAIL_SMTP_HOST is required.',
    }),
    EMAIL_SMTP_PORT: toNumber(
        z.number({ required_error: 'EMAIL_SMTP_PORT is required.' }).min(1)
    ),
    EMAIL_SMTP_USERNAME: z.string({
        required_error: 'EMAIL_SMTP_USERNAME is required.',
    }),
    EMAIL_SMTP_PASSWORD: z.string({
        required_error: 'EMAIL_SMTP_PASSWORD is required.',
    }),
    EMAIL_SMTP_MAX_CONNECTION_ATTEMPTS: toNumber(
        z
            .number({
                required_error:
                    'EMAIL_SMTP_MAX_CONNECTION_ATTEMPTS is required.',
            })
            .min(1)
    ),

    // Google Drive Service
    GOOGLE_DRIVE_CLIENT_EMAIL: z.string({
        required_error: 'GOOGLE_DRIVE_CLIENT_EMAIL is required.',
    }),
    GOOGLE_DRIVE_PRIVATE_KEY: z.string({
        required_error: 'GOOGLE_DRIVE_PRIVATE_KEY is required.',
    }),
    GOOGLE_DRIVE_SCOPE: z.string({
        required_error: 'GOOGLE_DRIVE_SCOPE is required.',
    }),
    GOOGLE_DRIVE_FOLDER_ID: z.string({
        // Using ID instead of KEY, more common term
        required_error: 'GOOGLE_DRIVE_FOLDER_ID is required.',
    }),

    // Sentry Service
    SENTRY_ORGANIZATION_SLUG: z.string({
        // More descriptive name, SLUG is common in Sentry
        required_error: 'SENTRY_ORGANIZATION_SLUG is required.',
    }),
    SENTRY_PROJECT_SLUG: z.string({
        // More descriptive name, SLUG is common in Sentry
        required_error: 'SENTRY_PROJECT_SLUG is required.',
    }),
    SENTRY_TUNNEL_PATH: z.string({
        // Using PATH instead of ROUTE, more common for URL paths
        required_error: 'SENTRY_TUNNEL_PATH is required.',
    }),
    SENTRY_DSN: z.string({ required_error: 'SENTRY_DSN is required.' }),
    SENTRY_AUTH_TOKEN: z.string({
        required_error: 'SENTRY_AUTH_TOKEN is required.',
    }),

    APP_FEATURES_USE_HELMET: z.string().transform(getBooleanValue).optional(),
    APP_FEATURES_USE_CORS: z.string().transform(getBooleanValue).optional(),
    APP_FEATURES_USE_CORS_AUTHORIZATION_IDENTIFIER_HEADER: z
        .string()
        .transform(getBooleanValue)
        .optional(),
    APP_FEATURES_USE_HPP: z.string().transform(getBooleanValue).optional(),
    APP_FEATURES_MEASURE_COMPRESSION_SIZE: z
        .string()
        .transform(getBooleanValue)
        .optional(),
    APP_FEATURES_USE_COMPRESSION: z
        .string()
        .transform(getBooleanValue)
        .optional(),
    APP_FEATURES_USE_RATE_LIMIT: z
        .string()
        .transform(getBooleanValue)
        .optional(),
    APP_FEATURES_SANITIZE_REQUEST: z
        .string()
        .transform(getBooleanValue)
        .optional(),
});

let envVars;
try {
    logger.debug('Validating application environment variables...'); // Info level for start
    envVars = await envSchema.parseAsync(process.env);
    logger.debug('Environment variables validation successful.'); // Info level for success
} catch (error) {
    if (error instanceof z.ZodError) {
        const combinedErrors = error.errors
            .map((err) => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
        const errorMessage = `Critical configuration error: ${combinedErrors}`;
        logger.error(
            `Environment variables validation failed: ${errorMessage}`
        ); // Error level for failure

        throw new EnvironmentVariableError(errorMessage); // Keep throwing the error
    }
    logger.error(
        'An unexpected error occurred during environment variables validation:',
        error
    ); // Error for unexpected errors
    throw error; // Re-throw unexpected errors
}

// Build the configuration object using the validated environment variables, with improved structure and names.
const configuration = {
    app: {
        // Grouping general application settings
        environment: envVars.NODE_ENV,
        isProduction: envVars.NODE_ENV === envVars.PRODUCTION,
    },
    server: {
        // Grouping server related settings
        url: envVars.SERVER_URL,
        port: getIntValue(envVars.SERVER_PORT),
        timeoutSeconds: getIntValue(envVars.SERVER_TIMEOUT_SECONDS),
        jsonPayloadLimitKB: getIntValue(envVars.SERVER_JSON_PAYLOAD_LIMIT_KB),
    },
    database: {
        // Grouping database settings
        mongodb: {
            // Explicitly grouping MongoDB settings
            uri: envVars.MONGODB_CONNECTION_URI, // Shortened 'connectionUri' to 'uri' for brevity in nested context
        },
        prisma: {
            // Explicitly grouping Prisma settings
            provider: envVars.PRISMA_PROVIDER, // Shortened 'databaseProvider' to 'provider'
            url: envVars.PRISMA_DATABASE_URL, // Shortened 'databaseUrl' to 'url'
        },
    },
    cache: {
        // Grouping cache settings
        defaultTtlSeconds: getIntValue(envVars.CACHE_DEFAULT_TTL_SECONDS), // More descriptive
    },
    auth: {
        // Grouping authentication settings
        maxAttempts: {
            // Grouping attempt limits
            login: envVars.AUTH_MAX_LOGIN_ATTEMPTS,
            resetPassword: envVars.AUTH_MAX_RESET_PASSWORD_ATTEMPTS,
            verifyEmail: envVars.AUTH_MAX_VERIFY_EMAIL_ATTEMPTS,
            changeEmail: envVars.AUTH_MAX_CHANGE_EMAIL_ATTEMPTS,
            changePassword: envVars.AUTH_MAX_CHANGE_PASSWORD_ATTEMPTS,
        },
        session: {
            // Grouping session related settings
            maxActiveSessions: getIntValue(envVars.AUTH_MAX_ACTIVE_SESSIONS),
        },
        lockoutDurationSeconds: {
            // More descriptive, using seconds consistently
            login: getIntValue(envVars.AUTH_LOCK_DURATION_LOGIN_SECONDS),
            resetPassword: getIntValue(
                envVars.AUTH_LOCK_DURATION_RESET_PASSWORD_SECONDS
            ),
            verifyEmail: getIntValue(
                envVars.AUTH_LOCK_DURATION_VERIFY_EMAIL_SECONDS
            ),
            changeEmail: getIntValue(
                envVars.AUTH_LOCK_DURATION_CHANGE_EMAIL_SECONDS
            ),
            changePassword: getIntValue(
                envVars.AUTH_LOCK_DURATION_CHANGE_PASSWORD_SECONDS
            ),
        },
        rateLimit: {
            // Grouping rate limiting settings
            maxRequestsPerWindow: getIntValue(
                envVars.RATE_LIMIT_MAX_REQUESTS_PER_WINDOW
            ), // More descriptive
            windowMs: getIntValue(envVars.RATE_LIMIT_WINDOW_MS),
            exposeHeaders: envVars.RATE_LIMIT_EXPOSE_HEADERS, // More descriptive
        },
        cookie: {
            // Grouping cookie settings
            user: {
                // Grouping user cookie settings
                name: envVars.COOKIE_USER_NAME, // Consistent cookie naming
                maxAgeSeconds: getIntValue(envVars.COOKIE_USER_MAX_AGE_SECONDS), // Consistent units
                secure: envVars.COOKIE_USER_SECURE,
                httpOnly: envVars.COOKIE_USER_HTTP_ONLY,
                sameSite: envVars.COOKIE_USER_SAME_SITE,
            },
            admin: {
                // Grouping admin cookie settings
                name: envVars.COOKIE_ADMIN_NAME, // Consistent cookie naming
                maxAgeSeconds: getIntValue(
                    envVars.COOKIE_ADMIN_MAX_AGE_SECONDS
                ), // Consistent units
                secure: envVars.COOKIE_ADMIN_SECURE,
                httpOnly: envVars.COOKIE_ADMIN_HTTP_ONLY,
                sameSite: envVars.COOKIE_ADMIN_SAME_SITE,
            },
        },
        jwt: {
            // Grouping JWT settings
            accessToken: {
                // Grouping access token settings
                secret: envVars.JWT_ACCESS_TOKEN_SECRET,
                expiryMinutes: getIntValue(
                    envVars.JWT_ACCESS_TOKEN_EXPIRY_MINUTES
                ), // Consistent naming
            },
            refreshToken: {
                // Grouping refresh token settings
                secret: envVars.JWT_REFRESH_TOKEN_SECRET,
                expiryMinutes: getIntValue(
                    envVars.JWT_REFRESH_TOKEN_EXPIRY_MINUTES
                ), // Consistent naming
            },
            resetPasswordToken: {
                // Grouping reset password token settings
                secret: envVars.JWT_RESET_PASSWORD_TOKEN_SECRET,
                expiryMinutes: getIntValue(
                    envVars.JWT_RESET_PASSWORD_TOKEN_EXPIRY_MINUTES
                ), // Consistent naming
            },
            verifyEmailToken: {
                // Grouping verify email token settings
                secret: envVars.JWT_VERIFY_EMAIL_TOKEN_SECRET,
                expiryMinutes: getIntValue(
                    envVars.JWT_VERIFY_EMAIL_TOKEN_EXPIRY_MINUTES
                ), // Consistent naming
            },
        },
    },
    cors: {
        // Grouping CORS settings
        allowedMethods: envVars.CORS_ALLOWED_METHODS,
        allowedOrigins: envVars.CORS_ALLOWED_ORIGINS, // Pluralized to match variable
        allowedHeaders: envVars.CORS_ALLOWED_HEADERS,
        siteIdentifierHeader: envVars.CORS_SITE_IDENTIFIER_HEADER, // More descriptive
    },
    system: {
        // Grouping system-wide settings
        localization: {
            // Grouping localization settings
            timezone: envVars.SYSTEM_TIMEZONE,
            locale: envVars.SYSTEM_LOCALE,
            currency: envVars.SYSTEM_CURRENCY,
            countryCode: envVars.SYSTEM_COUNTRY_CODE, // More descriptive
        },
        admin: {
            // Grouping admin contact settings
            email: envVars.SYSTEM_ADMIN_EMAIL,
            name: envVars.SYSTEM_ADMIN_NAME,
            password: envVars.SYSTEM_ADMIN_PASSWORD,
        },
        debug: {
            // Grouping debug settings
            logLevel: envVars.SYSTEM_DEBUG_LOG_LEVEL,
            allowedUserAgents: envVars.SYSTEM_DEBUG_ALLOWED_USER_AGENTS,
            allowedIps: envVars.SYSTEM_DEBUG_ALLOWED_IPS,
            key: envVars.SYSTEM_DEBUG_KEY,
        },
        generalContact: {
            // Grouping general contact settings
            email: envVars.SYSTEM_CONTACT_EMAIL,
            phone: envVars.SYSTEM_CONTACT_PHONE,
        },
        supportContact: {
            // Grouping support contact settings
            email: envVars.SYSTEM_SUPPORT_EMAIL,
            phone: envVars.SYSTEM_SUPPORT_PHONE,
        },
    },
    socialMedia: {
        // Grouping social media links
        linkedinUrl: envVars.SOCIAL_MEDIA_LINKEDIN_URL, // More descriptive
        facebookUrl: envVars.SOCIAL_MEDIA_FACEBOOK_URL, // More descriptive
        xUrl: envVars.SOCIAL_MEDIA_X_URL, // More descriptive, using X
        instagramUrl: envVars.SOCIAL_MEDIA_INSTAGRAM_URL, // More descriptive
        youtubeUrl: envVars.SOCIAL_MEDIA_YOUTUBE_URL, // More descriptive
        githubUrl: envVars.SOCIAL_MEDIA_GITHUB_URL, // More descriptive
    },
    emailService: {
        // Grouping email service settings
        smtp: {
            // Grouping SMTP settings
            host: envVars.EMAIL_SMTP_HOST,
            port: getIntValue(envVars.EMAIL_SMTP_PORT),
            username: envVars.EMAIL_SMTP_USERNAME,
            password: envVars.EMAIL_SMTP_PASSWORD,
            maxConnectionAttempts: getIntValue(
                envVars.EMAIL_SMTP_MAX_CONNECTION_ATTEMPTS
            ),
        },
    },
    googleDriveService: {
        // Grouping Google Drive service settings
        clientEmail: envVars.GOOGLE_DRIVE_CLIENT_EMAIL,
        privateKey: envVars.GOOGLE_DRIVE_PRIVATE_KEY,
        scope: envVars.GOOGLE_DRIVE_SCOPE,
        folderId: envVars.GOOGLE_DRIVE_FOLDER_ID, // More common term
    },
    sentryService: {
        // Grouping Sentry service settings
        organizationSlug: envVars.SENTRY_ORGANIZATION_SLUG, // More descriptive
        projectSlug: envVars.SENTRY_PROJECT_SLUG, // More descriptive
        tunnelPath: envVars.SENTRY_TUNNEL_PATH, // More descriptive
        dsn: envVars.SENTRY_DSN,
        authToken: envVars.SENTRY_AUTH_TOKEN,
    },

    features: {
        helmet: envVars.APP_FEATURES_USE_HELMET,
        cors: envVars.APP_FEATURES_USE_CORS,
        checkCorsAuthorizationIdentifierHeader:
            envVars.APP_FEATURES_USE_CORS_AUTHORIZATION_IDENTIFIER_HEADER,
        hpp: envVars.APP_FEATURES_USE_HPP,
        measureCompressionSize: envVars.APP_FEATURES_MEASURE_COMPRESSION_SIZE,
        compression: envVars.APP_FEATURES_USE_COMPRESSION,
        rateLimit: envVars.APP_FEATURES_USE_RATE_LIMIT,
        sanitizeRequest: envVars.APP_FEATURES_SANITIZE_REQUEST,
    },

    routes: routesConfig, // Kept as is, assuming it's route configurations
};

export default configuration;
