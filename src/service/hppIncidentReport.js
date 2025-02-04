'use strict';

import logger from '../lib/logger.js';
import HppViolation from '../models/HppViolation.js';

/**
 * Handles the reporting of HTTP Parameter Pollution (HPP) incidents.
 * @param {Object} incidentDetails - Details of the detected HPP attempt.
 */
const hppIncidentReport = async (incidentDetails) => {
    try {
        logger.alert('🚨 Security Incident Reported (HPP):', incidentDetails);

        // Save to database
        await HppViolation.create(incidentDetails);
    } catch (error) {
        logger.error('❌ Error saving HPP violation report:', error);
    }
};

export default hppIncidentReport;
