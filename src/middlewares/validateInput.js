import httpStatus from 'http-status-lite';
import contentTypes from 'content-types-lite';

import httpMethods from '../constants/httpMethods.js';
import sharedResponseTypes from '../utils/responseTypes.js';

import sendResponse from '../utils/sendResponse.js';

const validateInput = (schemas, rules) => (req, res, next) => {
    const validRequestContentType = rules?.request?.contentType?.trim();

    let validRequestContentTypeLowerCase = validRequestContentType;
    if (validRequestContentType) {
        validRequestContentTypeLowerCase =
            validRequestContentType.toLowerCase();
    }

    // Ensure the content type is valid
    if (
        validRequestContentTypeLowerCase &&
        !Object.values(contentTypes).includes(validRequestContentTypeLowerCase)
    ) {
        const msg = `Unsupported Content-Type: '${validRequestContentType}'. Allowed values are: ${Object.values(contentTypes).join(', ')}.`;
        return sharedResponseTypes.BAD_REQUEST(req, res, {}, msg);
    }
    const requestContentType = req?.headers['content-type']
        ?.trim()
        .toLowerCase();

    if (validRequestContentTypeLowerCase !== requestContentType) {
        const msg = `Invalid Content-Type: Expected "${validRequestContentTypeLowerCase}", but received "${requestContentType}".`;
        return sharedResponseTypes.BAD_REQUEST(req, res, {}, msg);
    }

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
