'use strict';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import configuration from './configuration/configuration.js';
import logger from './lib/logger.js';
import sharedResponseTypes from './utils/responseTypes.js';

import helmetConfiguration from './configuration/helmet.js';
import corsConfiguration from './configuration/cors.js';
import hppConfiguration from './configuration/hpp.js';
import {
    compressionConfiguration,
    measureCompressionSize,
} from './configuration/compression.js';
import rateLimiter from './configuration/rateLimiter.js';
import morganConfiguration from './configuration/morgan.js';
import sanitizeRequestConfiguration from './configuration/sanitizeRequest.js';
import swaggerConfiguration from './configuration/swagger.js';

import cspRoutes from './routes/CspRoutes.js';
import hppRoutes from './routes/HppRoutes.js';
import cspViolationReport from './service/cspViolationReport.js';

import initializeRoutes from './modules/routeInitializer.js';
import asyncHandler from './utils/asyncHandler.js';
import availableRoutes from './service/availableRoutes.js';

const app = express();

// If behind a proxy that terminates TLS (like Nginx), ensure the proper headers are set.
// In production, redirect any non-HTTPS request to HTTPS.
if (configuration.app.isProduction) {
    app.use((req, res, next) => {
        // Check both req.secure and the x-forwarded-proto header.
        if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// Security middleware (early in the stack)
logger.debug('Initializing middleware...');

// Conditional Middleware Initialization
if (configuration.features.helmet) {
    app.use(helmet(helmetConfiguration));
    logger.debug('Helmet middleware enabled.');
}

if (configuration.features.cors) {
    app.use(cors(corsConfiguration));
    logger.debug('CORS middleware enabled.');
}

if (configuration.features.checkCorsAuthorizationIdentifierHeader) {
    app.use(corsConfiguration.checkAuthorizationIdentifierHeader);
    logger.debug('CORS Authorization Identifier Header check enabled.');
}

if (configuration.features.hpp) {
    app.use(hppConfiguration());
    logger.debug('HPP middleware enabled.');
}

if (configuration.features.measureCompressionSize) {
    app.use(measureCompressionSize);
    logger.debug('Compression size measurement enabled.');
}

if (configuration.features.compression) {
    app.use(compressionConfiguration);
    logger.debug('Compression middleware enabled.');
}

// ✅ Rate Limiter to protect against brute-force attacks and abuse
if (configuration.features.rateLimit) {
    logger.debug('Applying rate limiting...');
    app.use(rateLimiter);
    logger.debug('Rate limiter enabled.');
}

// Morgan HTTP request logger setup
logger.debug('Setting up request logging...');
app.use(morganConfiguration);
logger.debug('Request logging enabled.');

// Body parsing middleware
logger.debug('Configuring body parsers...');
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
logger.debug('Body parsing configured.');

// Sanitize request data
if (configuration.features.sanitizeRequest) {
    logger.debug('Enabling request sanitization...');
    app.use(sanitizeRequestConfiguration);
    logger.debug('Request sanitization enabled.');
}

// CSP Violation Logging Endpoint
logger.debug('Adding CSP Violation logging endpoint...');
app.post(
    '/api/report/csp-violation',
    express.json(),
    async (req, res) => await cspViolationReport(req, res)
);
logger.debug('CSP Violation logging endpoint added.');

// Routes and Swagger documentation setup
logger.debug('Setting up Swagger API documentation...');
const swaggerDocs = swaggerJsdoc(swaggerConfiguration);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
logger.debug('Swagger API documentation available at /api/docs');

// ✅ Dynamically create models, validators, and routes
logger.debug('Initializing dynamic route creation...');
initializeRoutes(app);
logger.debug('Dynamic route creation completed.');

// ✅ Attach CSP Violation Routes
logger.debug('Adding violation reporting routes...');
app.use('/api/report/csp-violation', cspRoutes);
app.use('/api/report/hpp-violation', hppRoutes);
logger.debug('Violation reporting routes added.');

// Add this endpoint after dynamic routes have been initialized

app.all(
    '/api/routes-info',
    asyncHandler((req, res) => availableRoutes(req, res))
);

// Do not expose debug endpoints in production.
if (!configuration.app.isProduction) {
    app.get('/debug-sentry', (req, res, error) => {
        throw new Error(error);
    });
}

// Optional fallthrough error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // The error ID is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.status(500).end(`${res.sentry}\n`);
});

// Catch-all route for undefined routes
app.all('*', (req, res) => {
    const msg = `Not Found: The route ${req.method} ${req.originalUrl} does not exist.`;
    return sharedResponseTypes.NOT_FOUND(req, res, {}, msg);
});

logger.info('Server setup completed. Ready to accept requests.');
console.log(test);

export default app;
