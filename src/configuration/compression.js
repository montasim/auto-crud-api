'use strict';

import compression from 'compression';

import logger from '../lib/logger.js';

const compressionConfiguration = compression({
    level: 9, // Maximum compression level
    threshold: 0, // Always compress, regardless of response size
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            logger.info(
                `🚫 Compression skipped for request: ${req.method} ${req.originalUrl} (Header: x-no-compression)`
            );

            // Do not compress responses if the 'x-no-compression' header is present
            return false;
        }

        const shouldCompress = compression.filter(req, res);
        if (shouldCompress) {
            logger.info(
                `✅ Compression applied for request: ${req.method} ${req.originalUrl}`
            );
        } else {
            logger.info(
                `⚠️ Compression not applied due to content type for: ${req.method} ${req.originalUrl}`
            );
        }

        return shouldCompress;
    },
});

export default compressionConfiguration;
