'use strict';

import logger from '../lib/logger.js';
import httpStatus from 'http-status-lite';
import CspViolation from '../models/CspViolation.js';

const cspViolationReport = async (req, res) => {
    try {
        const violationReport = req.body['csp-report'];

        if (violationReport) {
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
            await CspViolation.create(reportData);
        } else {
            logger.warn(
                '⚠️ Received a CSP violation report, but no details were provided.'
            );
        }

        res.status(httpStatus.NO_CONTENT).end();
    } catch (error) {
        logger.error('❌ Error saving CSP violation report:', error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            error: 'Failed to process CSP report',
        });
    }
};

export default cspViolationReport;
