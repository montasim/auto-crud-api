import axios from 'axios';

import logger from '../lib/logger.js';

// Helper function to verify if a URL is reachable
const isUrlReachable = async (url) => {
    try {
        await axios.get(url, { timeout: 5000 }); // Timeout added to avoid hanging requests
        return true; // URL is reachable
    } catch (error) {
        const statusCode = error.response?.status;
        const errorMessage = statusCode
            ? `URL Check Failed: ${url} responded with status code ${statusCode}.`
            : error.request
              ? `URL Check Failed: No response from ${url}.`
              : `URL Check Failed: Error with ${url} - ${error.message}`;

        logger.error(errorMessage, { url, error: error.toString() });
        return false; // URL is not reachable
    }
};

export default isUrlReachable;
