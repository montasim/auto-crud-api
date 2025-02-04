'use strict';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import schemas from '../schemas.js';
import logger from './lib/logger.js';
import sharedResponseTypes from './utils/responseTypes.js';

import helmetConfiguration from './configuration/helmet.js';
import corsConfiguration from './configuration/cors.js';
import hppConfiguration from './configuration/hpp.js';
import compressionConfiguration from './configuration/compression.js';
import morganConfiguration from './configuration/morgan.js';
import sanitizeRequestConfiguration from './configuration/sanitizeRequest.js';
import swaggerConfiguration from './configuration/swagger.js';

import cspViolationReport from './service/cspViolationReport.js';
import createMongooseModel from './models/SchemaFactory.js';
import createZodSchema from './validators/ZodFactory.js';
import createCrudRoutes from './routes/CrudFactory.js';

const app = express();

// Security middleware (early in the stack)
app.use(helmet(helmetConfiguration)); // Helmet for basic security
app.use(cors(corsConfiguration)); // Cross-origin request handling
app.use(hppConfiguration()); // Prevent HTTP Parameter Pollution
app.use(compressionConfiguration); // Compress responses for performance

// Morgan HTTP request logger setup
app.use(morganConfiguration); // HTTP request logging middleware

// Body parsing middleware
app.use(express.json({ limit: '20mb' })); // Body parsing for JSON
app.use(express.urlencoded({ limit: '20mb', extended: true })); // Parse URL encoded data

// Sanitize request data (after body parsing for security)
app.use(sanitizeRequestConfiguration);

// CSP Violation Logging Endpoint
app.post(
    '/report/csp-violation',
    express.json(),
    async (req, res) => await cspViolationReport(req, res)
);

// Routes and Swagger documentation setup
const swaggerDocs = swaggerJsdoc(swaggerConfiguration);

// Dynamically create models, validators, and routes
Object.entries(schemas)?.forEach(([name, schemaDefinition]) => {
    const model = createMongooseModel(name, schemaDefinition);
    const zodSchema = createZodSchema(name, schemaDefinition);
    app.use(`/api/${name}`, createCrudRoutes(model, zodSchema)); // Dynamically created routes
});

// Serve Swagger UI for API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Catch-all route for undefined routes (after all routes)
app.all('*', (req, res) => {
    const msg = `Not Found: The route ${req.method} ${req.originalUrl} does not exist.`;
    logger.warn(msg); // Logs the undefined route request
    return sharedResponseTypes.NOT_FOUND(req, res, {}, msg);
});

export default app;
