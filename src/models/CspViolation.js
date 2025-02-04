'use strict';

import { model, Schema } from 'mongoose';

const cspViolationSchema = new Schema(
    {
        blockedURI: { type: String, required: true },
        violatedDirective: { type: String, required: true },
        documentURI: { type: String, required: true },
        originalPolicy: { type: String, required: true },
        userAgent: { type: String },
        ip: { type: String },
        timestamp: { type: Date, default: Date.now },
    },
    { collection: 'csp_violations' } // Store in the "csp_violations" collection
);

const CspViolation = model('CspViolation', cspViolationSchema);

export default CspViolation;
