'use strict';

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import httpStatus from 'http-status-lite';

import logger from '../lib/logger.js';

// Create a JSDOM window object to use with DOMPurify
const { window } = new JSDOM('');
const dompurify = DOMPurify(window);

/**
 * Recursively sanitizes an object using strict DOMPurify configurations.
 * @param {Object} obj - The object to sanitize.
 */
const sanitize = (obj) => {
    const seen = new WeakSet(); // Prevent circular reference issues

    const recurSanitize = (object) => {
        if (seen.has(object)) {
            return;
        }
        seen.add(object);

        Object.keys(object).forEach((key) => {
            const value = object[key];

            if (typeof value === 'string') {
                const sanitizedValue = dompurify.sanitize(value, {
                    USE_PROFILES: { html: true }, // Strict sanitization
                    ALLOWED_TAGS: [], // Allow NO tags (strips all HTML)
                    ALLOWED_ATTR: [], // Allow NO attributes (removes inline event handlers)
                });

                if (value !== sanitizedValue) {
                    logger.warn(
                        `⚠️ Strict Sanitization Applied: Key '${key}' was modified due to potential XSS.`
                    );
                }

                object[key] = sanitizedValue; // Replace with sanitized version
            } else if (value && typeof value === 'object') {
                recurSanitize(value);
            }
        });
    };

    recurSanitize(obj);
};

/**
 * Middleware to sanitize incoming request data (body, query, params).
 */
const sanitizeRequestConfiguration = (req, res, next) => {
    try {
        ['body', 'query', 'params'].forEach((part) => {
            if (req[part] && typeof req[part] === 'object') {
                logger.info(`🔍 Sanitizing request ${part}:`, req[part]); // Log original data
                sanitize(req[part]);
                logger.info(
                    `✅ Strictly Sanitized request ${part}:`,
                    req[part]
                ); // Log sanitized data
            }
        });
    } catch (error) {
        logger.error('❌ Strict Sanitization Error:', error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error processing request, please try again later.',
        });
    }

    next();
};

export default sanitizeRequestConfiguration;
