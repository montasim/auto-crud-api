'use strict';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import helmetConfiguration from './configuration/helmet.configuration.js';
import corsConfiguration from './configuration/cors.configuration.js';
import compressionConfiguration from './configuration/compression.configuration.js';
import morganConfiguration from './configuration/morgan.configuration.js';
import schemas from '../schemas.js';

import sanitizeRequestConfiguration from './configuration/sanitizeRequest.configuration.js';
import hppConfiguration from './configuration/hpp.configuration.js';
import createMongooseModel from './models/SchemaFactory.js';
import createZodSchema from './validators/ZodFactory.js';
import createCrudRoutes from './routes/CrudFactory.js';

const app = express();

// Security middleware
app.use(helmet(helmetConfiguration));
app.use(cors(corsConfiguration));
app.use(hppConfiguration());
app.use(compressionConfiguration);

// Morgan HTTP requestBooks loggerService setup
app.use(morganConfiguration);

// Body parsing middleware
app.use(express.json({ limit: '20mb' })); // unified the limit for JSON
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Sanitize requestBooks data
app.use(sanitizeRequestConfiguration);

// Routes
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: { title: 'Auto CRUD API', version: '1.0.0' },
    },
    apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Dynamically create models, validators, and routes
Object.entries(schemas)?.forEach(([name, schemaDefinition]) => {
    const model = createMongooseModel(name, schemaDefinition);
    const zodSchema = createZodSchema(name, schemaDefinition);

    app.use(`/api/${name}`, createCrudRoutes(model, zodSchema));
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

export default app;
