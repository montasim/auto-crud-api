'use strict';

import logger from '../lib/logger.js';
import HppViolation from '../models/HppViolation.js';
import sharedResponseTypes from '../utils/responseTypes.js';

/**
 * Create an HPP violation report (Triggered by HPP detection).
 */
const hppIncidentReport = async (req, res) => {
    const { parameter, values, ip, userAgent } = req.body;

    if (!parameter || !values || !ip) {
        logger.warn(
            '⚠️ Received an HPP violation report, but some details are missing.'
        );
        return sharedResponseTypes.BAD_REQUEST(
            req,
            res,
            {},
            'Missing required HPP violation details.'
        );
    }

    const reportData = {
        parameter,
        values,
        ip,
        userAgent: userAgent || req.headers['user-agent'],
        timestamp: new Date(),
    };

    // Log warning
    logger.warn('⚠️ HPP Violation Detected!', reportData);

    // Save to the database
    const savedReport = await HppViolation.create(reportData);

    return sharedResponseTypes.CREATED(req, res, {}, '', savedReport);
};

export default hppIncidentReport;
