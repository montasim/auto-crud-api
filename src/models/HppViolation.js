'use strict';

import { model, Schema } from 'mongoose';

const hppViolationSchema = new Schema(
    {
        parameter: { type: String, required: true },
        values: { type: [String], required: true },
        ip: { type: String },
        userAgent: { type: String },
        timestamp: { type: Date, default: Date.now },
    },
    { collection: 'hpp_violations' } // Store in the "hpp_violations" collection
);

const HppViolation = model('HppViolation', hppViolationSchema);

export default HppViolation;
