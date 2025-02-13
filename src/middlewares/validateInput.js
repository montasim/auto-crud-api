import httpStatus from 'http-status-lite';

import HTTP_METHODS from '../constants/httpMethods.js';

import sendResponse from '../utils/sendResponse.js';

const validateInput = (req, res, next, schemas) => {
    let schema;

    switch (req.method) {
        case HTTP_METHODS.POST:
            schema = schemas.create;
            break;
        case HTTP_METHODS.PUT:
            schema = schemas.update;
            break;
        case HTTP_METHODS.GET:
            schema = schemas.read;
            break;
        case HTTP_METHODS.DELETE:
            schema = schemas.delete;
            break;
        default:
            return next(); // No validation needed
    }

    const result = schema.safeParse({ ...req.body, ...req.params });

    if (!result.success) {
        const errors = result?.error?.errors?.map((e) => ({
            field: e.path ? e.path.join('.') : 'unknown',
            message: e?.message,
        }));

        return sendResponse(
            req,
            res,
            {},
            httpStatus.BAD_REQUEST,
            false,
            'Data validation failed',
            {},
            {},
            errors
        );
    }

    next();
};

export default validateInput;
