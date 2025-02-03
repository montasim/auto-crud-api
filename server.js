import mongodb from './src/lib/mongodb.js';
import app from './src/app.js';
import logger from './src/lib/logger.js';
import configuration from './src/configuration/configuration.js';

const startServer = async () => {
    try {
        await mongodb.connect();

        return app.listen(configuration.port, () => {
            logger.info(
                `${configuration.env} server started on port ${configuration.port}`
            );
        });
    } catch (error) {
        logger.error('Failed to start the server:', error);

        process.exit(1); // Exit the process with failure
    }
};

startServer();
