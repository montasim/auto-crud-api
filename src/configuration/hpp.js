'use strict';

import hpp from 'hpp';

import logger from '../lib/logger.js';

import hppIncidentReport from '../service/hppIncidentReport.js';

const hppConfiguration = (options) => {
    return (req, res, next) => {
        // Define sensitive parameters that should not be repeated
        const sensitiveParams = ['user', 'auth', 'token'];

        sensitiveParams.forEach(async (param) => {
            if (req.query[param] && Array.isArray(req.query[param])) {
                const incidentDetails = {
                    message: `HTTP Parameter Pollution (HPP) attempt detected.`,
                    parameter: param,
                    values: req.query[param],
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    timestamp: new Date().toISOString(),
                };

                // Log the security warning
                logger.warn(
                    `HPP Attempt: Suspicious repeated query parameter detected: '${param}'. Possible attack vector.`,
                    incidentDetails
                );

                // Save to database via incident report function
                await hppIncidentReport(incidentDetails);
            }
        });

        // Use the standard HPP middleware with configured options
        return hpp(options)(req, res, next);
    };
};

export default hppConfiguration;
