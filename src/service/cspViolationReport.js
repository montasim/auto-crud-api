'use strict';

import logger from '../lib/logger.js';
import CspViolation from '../models/CspViolation.js';
import responseTypes from '../utils/responseTypes.js';

/**
 * Create a CSP violation report (Triggered by CSP violation reports).
 */
const cspViolationReport = async (req, res) => {
    const violationReport = req.body['csp-report'];

    if (!violationReport) {
        const msg =
            '⚠️ Received a CSP violation report, but no details were provided.';
        responseTypes.BAD_REQUEST(req, res, {}, msg);
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
    return responseTypes.CREATED(req, res, {}, '', savedReport);
};

export default cspViolationReport;
