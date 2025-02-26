'use strict';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import multer from 'multer';

import logger from './lib/logger.js';
import sharedResponseTypes from './utils/responseTypes.js';

import helmetConfiguration from './configuration/helmet.js';
import corsConfiguration from './configuration/cors.js';
import hppConfiguration from './configuration/hpp.js';
import {
    compressionConfiguration,
    measureCompressionSize,
} from './configuration/compression.js';
import morganConfiguration from './configuration/morgan.js';
import sanitizeRequestConfiguration from './configuration/sanitizeRequest.js';
import swaggerConfiguration from './configuration/swagger.js';

import cspRoutes from './routes/CspRoutes.js';
import hppRoutes from './routes/HppRoutes.js';
import verifyTurnstileRoutes from './routes/VerifyTurnstileRoutes.js';
import cspViolationReport from './service/cspViolationReport.js';

import configuration from './configuration/configuration.js';

import createMongooseModel from './models/SchemaFactory.js';
import createZodSchema from './validators/ZodFactory.js';
import createCrudRoutes from './routes/CrudFactory.js';

const app = express();
const upload = multer();

// Security middleware (early in the stack)
logger.debug('Initializing security middleware...');
app.use(helmet(helmetConfiguration));
app.use(cors(corsConfiguration));
app.use(hppConfiguration());
app.use(measureCompressionSize);
app.use(compressionConfiguration);
logger.debug('Security middleware initialized.');

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
logger.debug('Enabling request sanitization...');
app.use(sanitizeRequestConfiguration);
logger.debug('Request sanitization enabled.');

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
Object.entries(configuration.routesConfig).forEach(
    ([name, { schema, routes, schemaRules }]) => {
        logger.info(`Creating routes for: ${name}`);

        if (!Array.isArray(routes)) {
            logger.error(
                `Error: "routes" must be an array in ${name}, but received ${typeof routes}`
            );
            return;
        }

        const model = createMongooseModel(name, schema);
        const zodSchema = createZodSchema(name, schema);
        const router = createCrudRoutes(
            name,
            model,
            zodSchema,
            routes,
            schemaRules
        );

        routes.forEach(({ paths, method }) => {
            paths.forEach((path) => {
                logger.debug(
                    `Route Created: [${method.toUpperCase()}] /api/${name}${path}`
                );
            });
        });

        app.use(`/api/${name}`, router);
    }
);
logger.debug('Dynamic route creation completed.');

// ✅ Attach CSP Violation Routes
logger.debug('Adding violation reporting routes...');
app.use('/api/report/csp-violation', cspRoutes);
app.use('/api/report/hpp-violation', hppRoutes);
app.use('/api/verify-turnstile', verifyTurnstileRoutes);
logger.debug('Violation reporting routes added.');

app.get('/debug-sentry', (req, res, error) => {
    throw new Error(error);
});

// Optional fallthrough error handler
app.use(() => (err, req, res, next) => {
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

export default app;
