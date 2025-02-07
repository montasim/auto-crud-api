'use strict';

import rateLimit from 'express-rate-limit';

import logger from '../lib/logger.js';
import configuration from './configuration.js';
import responseTypes from '../utils/responseTypes.js';

const rateLimiter = rateLimit({
    windowMs: configuration.auth.rateLimit.windowMs,
    max: configuration.auth.rateLimit.maxRequestsPerWindow,
    message:
        'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers

    handler: (req, res, next, options) => {
        const msg = `Rate limit exceeded for IP: ${req.ip}`;
        logger.warn(`${msg}, URL: ${req.originalUrl}`);

        return responseTypes.TOO_MANY_REQUESTS(
            req,
            res,
            {},
            `${msg}, please try again after ${options.windowMs / 60000} minutes`
        );
    },
});

export default rateLimiter;
