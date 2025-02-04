'use strict';

const helmetConfiguration = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"], // Allow content only from the current domain
            scriptSrc: ["'self'"], // Restrict scripts to self
            objectSrc: ["'none'"], // Disallow plugins (Flash, Silverlight, etc.)
            imgSrc: ["'self'"], // Restrict images to self
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
            upgradeInsecureRequests: [], // Upgrade all HTTP requests to HTTPS
            reportUri: '/csp-violation-report', // Send violations to this endpoint
        },
        reportOnly: true, // Logs violations without blocking requests
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
};

export default helmetConfiguration;
