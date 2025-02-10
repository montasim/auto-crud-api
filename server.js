// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
import './instrument.mjs'; // Ensure profiling is set up correctly

import * as Sentry from '@sentry/node';
import fs from 'fs';
import https from 'https';

import mongodb from './src/lib/mongodb.js';
import app from './src/app.js';
import configuration from './src/configuration/configuration.js';
import logger from './src/lib/logger.js';

import toSentenceCase from './src/utils/toSentenceCase.js';
import asyncHandler from './src/utils/asyncHandler.js';
import createDefaultAdmin from './src/service/createDefaultAdmin.js';

// Graceful shutdown function
const initiateGracefulShutdown = async (reason, server, error = {}) => {
    logger.warn(`Shutting down gracefully due to ${reason}: ${error}.`);

    const shutdownTimeout = setTimeout(() => {
        logger.error('Shutdown timed out, forcing shutdown.');
        process.exit(1);
    }, 30000);

    try {
        await new Promise((resolve, reject) => {
            server.close((closeError) => {
                clearTimeout(shutdownTimeout);

                if (closeError) {
                    logger.error(
                        `Failed to close server: ${closeError.message}`
                    );
                    return reject(closeError);
                }
                logger.warn('Server successfully closed.');
                resolve();
            });
        });

        await mongodb.disconnect();
        process.exit(0);
    } catch (shutdownError) {
        logger.error(`Shutdown failed: ${shutdownError.message}`);
        process.exit(1);
    }
};

// Unified error handler
const handleCriticalError = async (type, error, server) => {
    logger.error(`${type}: ${error.message}`, { stack: error.stack || 'N/A' });
    await initiateGracefulShutdown(type, server, error);
};

// Handle process signals (SIGINT, SIGTERM)
const shutdownHandler = async (signal, server) => {
    logger.warn(`Received ${signal}, initiating shutdown...`);
    await initiateGracefulShutdown(signal, server);
};

// Server startup function
const startServer = async () => {
    try {
        // The error handler must be registered before any other error middleware and after all controllers
        Sentry.setupExpressErrorHandler(app);

        await mongodb.connect();
        // Fire-and-forget creating the default admin (if needed)
        asyncHandler(createDefaultAdmin());

        const port = configuration.server.port;
        const environment = toSentenceCase(configuration.app.environment);

        let server;

        // Create an HTTPS server if in production and SSL credentials are provided,
        // otherwise create an HTTP server.
        if (
            configuration.app.isProduction &&
            process.env.SSL_KEY &&
            process.env.SSL_CERT
        ) {
            const sslOptions = {
                key: fs.readFileSync(process.env.SSL_KEY),
                cert: fs.readFileSync(process.env.SSL_CERT),
            };
            server = https.createServer(sslOptions, app).listen(port, () => {
                logger.info(
                    `HTTPS Server running with ${environment} configuration on port ${port}`
                );
            });
        } else {
            server = app.listen(port, () => {
                logger.info(
                    `HTTP Server running with ${environment} configuration on port ${port}`
                );
            });
        }

        // Attach event listeners to handle errors and process signals
        server.on('error', (error) =>
            handleCriticalError('Server Error', error, server)
        );
        process.on('uncaughtException', (error) =>
            handleCriticalError('Uncaught Exception', error, server)
        );
        process.on('unhandledRejection', (error) =>
            handleCriticalError('Unhandled Rejection', error, server)
        );

        process.on('SIGINT', () => shutdownHandler('SIGINT', server));
        process.on('SIGTERM', () => shutdownHandler('SIGTERM', server));
    } catch (error) {
        logger.error('Failed to start the server:', error);
        process.exit(1);
    }
};

// ✅ **Ensuring the promise is handled properly**
startServer().catch((error) => {
    logger.error('Critical failure during server startup:', error);
    process.exit(1);
});
