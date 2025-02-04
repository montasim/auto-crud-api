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

/**
 * Middleware to measure response size before and after compression.
 */
const measureCompressionSize = (req, res, next) => {
    let originalSize = 0;
    let compressedSize = 0;

    // Capture original response write and end functions
    const originalWrite = res.write;
    const originalEnd = res.end;

    const chunks = [];

    // Override write function to store response data
    res.write = function (chunk, ...args) {
        chunks.push(chunk);
        originalSize += chunk.length;
        originalWrite.apply(res, [chunk, ...args]);
    };

    // Override end function to finalize size calculation
    res.end = function (chunk, ...args) {
        if (chunk) {
            chunks.push(chunk);
            originalSize += chunk.length;
        }

        // Simulate compression (since actual compression is handled internally)
        compressedSize = Buffer.concat(chunks).length;

        // Log size difference
        const reductionPercentage =
            originalSize > 0
                ? ((originalSize - compressedSize) / originalSize) * 100
                : 0;

        logger.info(
            `📏 Compression Stats for ${req.method} ${req.originalUrl} | Original: ${originalSize} bytes | Compressed: ${compressedSize} bytes | Reduction: ${reductionPercentage.toFixed(2)}%`
        );

        originalEnd.apply(res, [chunk, ...args]);
    };

    next();
};

export { compressionConfiguration, measureCompressionSize };
