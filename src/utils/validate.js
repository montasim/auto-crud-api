import httpStatus from 'http-status-lite';

import httpMethods from '../constants/httpMethods.js';

import sendResponse from './sendResponse.js';

const validate = (schemas) => (req, res, next) => {
    let schema;

    switch (req.method) {
        case httpMethods.POST:
            schema = schemas.create;
            break;
        case httpMethods.PUT:
            schema = schemas.update;
            break;
        case httpMethods.GET:
            schema = schemas.read;
            break;
        case httpMethods.DELETE:
            schema = schemas.delete;
            break;
        default:
            return next(); // No validation needed
    }

    const result = schema.safeParse({ ...req.body, ...req.params });

    if (!result.success) {
        return sendResponse(
            req,
            res,
            {},
            httpStatus.BAD_REQUEST,
            false,
            'Validation failed',
            {},
            {},
            result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }))
        );
    }

    next();
};

export default validate;
