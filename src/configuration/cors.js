'use strict';

import configuration from './configuration.js';

const whitelist = configuration.cors.allowedOrigin;
const corsConfiguration = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200, // For legacy browser support
    methods: configuration.cors.allowedMethods,
    allowedHeaders: configuration.cors.allowedMethods,
    credentials: true, // This allows the server to send cookies
    preflightContinue: false,
    maxAge: 24 * 60 * 60, // 24 hours
};

export default corsConfiguration;
