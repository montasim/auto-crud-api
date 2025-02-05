'use strict';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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
import cspViolationReport from './service/cspViolationReport.js';

import configuration from './configuration/configuration.js';

import createMongooseModel from './models/SchemaFactory.js';
import createZodSchema from './validators/ZodFactory.js';
import createCrudRoutes from './routes/CrudFactory.js';

const app = express();

// Security middleware (early in the stack)
app.use(helmet(helmetConfiguration));
app.use(cors(corsConfiguration));
app.use(hppConfiguration());
app.use(measureCompressionSize);
app.use(compressionConfiguration);

// Morgan HTTP request logger setup
app.use(morganConfiguration);

// Body parsing middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Sanitize request data (after body parsing for security)
app.use(sanitizeRequestConfiguration);

// CSP Violation Logging Endpoint
app.post(
    '/api/report/csp-violation',
    express.json(),
    async (req, res) => await cspViolationReport(req, res)
);

// Routes and Swagger documentation setup
const swaggerDocs = swaggerJsdoc(swaggerConfiguration);

// ✅ Dynamically create models, validators, and routes
Object.entries(configuration.routesConfig).forEach(
    ([name, { schema, routes }]) => {
        logger.info(`✅ Creating routes for: ${name}`);

        if (!Array.isArray(routes)) {
            logger.error(
                `❌ Error: "routes" must be an array in ${name}, but received ${typeof routes}`
            );
            return; // Skip this model to prevent crashes
        }

        const model = createMongooseModel(name, schema);
        const zodSchema = createZodSchema(name, schema);
        app.use(
            `/api/${name}`,
            createCrudRoutes(name, model, zodSchema, routes)
        );
    }
);

// Serve Swagger UI for API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ✅ Attach CSP Violation Routes
app.use('/api/report/csp-violation', cspRoutes);
app.use('/api/report/hpp-violation', hppRoutes);

// Catch-all route for undefined routes
app.all('*', (req, res) => {
    const msg = `Not Found: The route ${req.method} ${req.originalUrl} does not exist.`;
    return sharedResponseTypes.NOT_FOUND(req, res, {}, msg);
});

export default app;
