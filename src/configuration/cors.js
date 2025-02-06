'use strict';

import httpStatus from 'http-status-lite';

import configuration from './configuration.js';
import logger from '../lib/logger.js';

import { ConfigurationError } from '../lib/customErrors.js';

const whitelist = Array.isArray(configuration.cors.allowedOrigin)
    ? configuration.cors.allowedOrigin
    : [];
const authorizationIdentifierHeader = 'X-Site-Identifier';

const corsConfiguration = {
    origin: (origin, callback) => {
        if (!origin || whitelist.includes(origin)) {
            callback(null, true);
        } else {
            const msg = `CORS Error: Request from origin '${origin}' blocked. Allowed origins: ${JSON.stringify(whitelist)}`;

            logger.error(msg, {
                origin,
                allowedOrigins: whitelist,
            });

            callback(new ConfigurationError(msg), false); // Return explicit false for better debugging
        }
    },
    optionsSuccessStatus: httpStatus.OK, // For legacy browser support
    methods: configuration.cors.allowedMethods,
    allowedHeaders: configuration.cors.allowedHeaders,
    credentials: true, // This allows the server to send cookies
    preflightContinue: true, // Let middleware handle OPTIONS requests too
    maxAge: 24 * 60 * 60, // 24 hours

    // Middleware for identifier validation
    checkAuthorizationIdentifierHeader: (req, res, next) => {
        const siteIdentifier =
            req.headers[authorizationIdentifierHeader.toLowerCase()];

        if (!siteIdentifier) {
            const errorMsg = `Missing '${authorizationIdentifierHeader}' header in the request.`;
            logger.error(errorMsg, {
                method: req.method,
                url: req.originalUrl,
            });

            return res.status(httpStatus.FORBIDDEN).json({
                error: errorMsg,
                errorCode: 'MISSING_IDENTIFIER_HEADER',
            });
        }

        next();
    },
};

export default corsConfiguration;
