import mongodb from './src/lib/mongodb.js';
import app from './src/app.js';
import configuration from './src/configuration/configuration.js';
import logger from './src/lib/logger.js';

import toSentenceCase from './src/utils/toSentenceCase.js';

const startServer = async () => {
    try {
        await mongodb.connect();

        const port = configuration.port;
        return app.listen(port, () => {
            logger.info(
                `${toSentenceCase(configuration.env)} server started on port ${port}`
            );
        });
    } catch (error) {
        logger.error('Failed to start the server:', error);

        process.exit(1); // Exit the process with failure
    }
};

startServer();
