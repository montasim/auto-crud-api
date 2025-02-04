'use strict';

import httpStatus from 'http-status-lite';

import logger from '../lib/logger.js';
import CspViolation from '../models/CspViolation.js';
import sharedResponseTypes from '../utils/responseTypes.js';

/**
 * Create a CSP violation report (Triggered by CSP violation reports).
 */
const cspViolationReport = async (req, res) => {
    const violationReport = req.body['csp-report'];

    if (!violationReport) {
        logger.warn(
            '⚠️ Received a CSP violation report, but no details were provided.'
        );
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({ error: 'No CSP violation details provided.' });
    }

    const reportData = {
        blockedURI: violationReport['blocked-uri'],
        violatedDirective: violationReport['violated-directive'],
        documentURI: violationReport['document-uri'],
        originalPolicy: violationReport['original-policy'],
        userAgent: req.headers['user-agent'],
        ip: req.ip,
    };

    // Log warning
    logger.warn('⚠️ Helmet CSP Violation Detected!', reportData);

    // Save the violation to the database
    const savedReport = await CspViolation.create(reportData);

    return sharedResponseTypes.CREATED(req, res, {}, '', savedReport);
};

export default cspViolationReport;
