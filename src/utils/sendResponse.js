import zlib from 'zlib';

import logger from '../lib/logger.js';

const sendResponse = (
    req,
    res,
    contentType,
    status,
    success,
    message,
    data,
    pagination,
    errors
) => {
    const route = req.url;
    const responsePayload = {
        meta: {
            // ...(timeStamp && { timeStamp }),
            // ...(timeZoneDetails && { timeZone: timeZoneDetails }),
            // ...(deviceDetails && { device: deviceDetails }),
            // ...(ipAddress && { ip: ipAddress }),
            ...(route && { route }),
        },
        status: {
            ...(success && { success }),
            ...(message && { message }),
        },
        ...(data && { data }),
        ...(errors && { errors }),
    };
    // Convert response to JSON string
    const jsonResponse = JSON.stringify(responsePayload);
    const originalSize = Buffer.byteLength(jsonResponse, 'utf8');

    // Check if client supports compression
    // Safe check for `req.headers`
    const acceptEncoding = req?.headers?.['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip')) {
        zlib.gzip(jsonResponse, (err, compressed) => {
            if (err) {
                logger.error('Compression Error:', err);
            }
            const compressedSize = compressed.length;
            const compressionRatio =
                ((originalSize - compressedSize) / originalSize) * 100;

            logger.info(
                `Compression Stats: Original Size: ${originalSize} bytes | Compressed: ${compressedSize} bytes | Reduction: ${compressionRatio.toFixed(2)}%`
            );

            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Length', compressedSize);
            res.setHeader('Content-Type', contentType);
            res.status(status).end(compressed);
        });
    } else {
        // Send uncompressed response
        res.status(status).json(responsePayload);
    }

    logger.info(responsePayload?.status?.message);
};

export default sendResponse;
