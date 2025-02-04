'use strict';

const corsConfiguration = () => {
    const allowedOrigins =
        getEnvironmentData('CORS_ALLOWED_ORIGIN')?.split(',') || [];
    const allowedMethods = getEnvironmentData('CORS_ALLOWED_METHODS');
    const allowedHeaders = getEnvironmentData('CORS_ALLOWED_HEADERS');
    const allowedSiteIdentifier = getEnvironmentData('AUTH_X_SITE_IDENTIFIER');
    const allowedUserAgentForDebug = getEnvironmentData(
        'DEBUG_ALLOWED_USER_AGENT'
    );
    const debugKey = getEnvironmentData('DEBUG_KEY');

    return {
        origin: (origin, callback) => {
            const whitelist = ['http://localhost:5000', '127.0.01:5000']; // List of allowed origins

            if (whitelist.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        optionsSuccessStatus: 200, // For legacy browser support
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true, // This allows the server to send cookies
        preflightContinue: false,
        maxAge: 24 * 60 * 60, // 24 hours
    };
};

export default corsConfiguration;
