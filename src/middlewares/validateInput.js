import httpStatus from 'http-status-lite';
import contentTypes from 'content-types-lite';

import httpMethods from '../constants/httpMethods.js';
import sharedResponseTypes from '../utils/responseTypes.js';
import logger from '../lib/logger.js';

import sendResponse from '../utils/sendResponse.js';

/**
 * Converts string values in `multipart/form-data` to appropriate data types (Boolean, Number).
 */
const convertFormDataValues = (data, schemas) => {
    const convertedData = { ...data };

    Object.keys(data).forEach((key) => {
        if (!schemas[key]) return; // Skip if no schema for this field

        const schemaType = schemas[key]._def.typeName;

        // Convert to Boolean
        if (schemaType === 'ZodBoolean') {
            convertedData[key] =
                data[key] === 'true' || data[key] === '1' ? true : false;
        }

        // Convert to Number
        if (schemaType === 'ZodNumber' && !isNaN(data[key])) {
            convertedData[key] = Number(data[key]);
        }
    });

    return convertedData;
};

/**
 * Validates request input using Zod schemas and file validation rules.
 */
const validateInput = (
    req,
    res,
    next,
    schemas,
    rules = {},
    schemaRules = {}
) => {
    const validRequestContentType = rules?.request?.contentType
        ?.trim()
        ?.toLowerCase();
    const requestContentType =
        req.headers['content-type']?.trim()?.toLowerCase() || '';

    // ✅ Ensure valid Content-Type
    if (
        validRequestContentType &&
        !Object.values(contentTypes).includes(validRequestContentType)
    ) {
        return sharedResponseTypes.BAD_REQUEST(
            req,
            res,
            {},
            `Unsupported Content-Type: '${validRequestContentType}'. Allowed: ${Object.values(contentTypes).join(', ')}`
        );
    }

    if (
        validRequestContentType &&
        !requestContentType.includes(validRequestContentType)
    ) {
        return sharedResponseTypes.BAD_REQUEST(
            req,
            res,
            {},
            `Invalid Content-Type: Expected "${validRequestContentType}", received "${requestContentType}".`
        );
    }

    let schema;
    switch (req.method) {
        case httpMethods.POST:
            schema = schemas.create;
            break;
        case httpMethods.PUT:
        case httpMethods.PATCH:
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

    // ✅ Merge request body, params, and files for validation
    let requestData = { ...req.body, ...req.params };

    // 🔥 Convert form-data string values to Boolean/Number
    if (requestContentType.includes('multipart/form-data')) {
        requestData = convertFormDataValues(requestData, schema.shape);
    }

    console.log(req.files);

    // ✅ Handle file validation if schemaRules exist
    if (req.files && Object.keys(schemaRules).length > 0) {
        for (const [field, rules] of Object.entries(schemaRules)) {
            console.log('Processing uploaded files:', req.files);

            const uploadedFiles = Array.isArray(
                req?.files?.filter((file) => file.fieldname === field)
            );
            console.log(uploadedFiles);

            if (uploadedFiles) {
                console.log(
                    `Validating field: ${field}, Uploaded Files:`,
                    uploadedFiles
                );

                // ✅ Validate file count
                if (uploadedFiles.length > rules.maxFile) {
                    return sharedResponseTypes.BAD_REQUEST(
                        req,
                        res,
                        {},
                        `Only ${rules.maxFile} file(s) allowed for ${field}`
                    );
                }

                for (const file of uploadedFiles) {
                    console.log(
                        `Validating file: ${file.originalname}, Type: ${file.mimetype}, Size: ${file.size} bytes`
                    );

                    // ✅ Ensure mimetype is valid
                    if (!rules.allowedMimeType.includes(file.mimetype)) {
                        return sharedResponseTypes.BAD_REQUEST(
                            req,
                            res,
                            {},
                            `Invalid file type for ${field}. Allowed: ${rules.allowedMimeType.join(', ')}`
                        );
                    }

                    // ✅ Validate file size (Convert from bytes to KB)
                    const fileSizeKB = file.size / 1024;
                    if (
                        fileSizeKB < rules.minSize ||
                        fileSizeKB > rules.maxSize
                    ) {
                        return sharedResponseTypes.BAD_REQUEST(
                            req,
                            res,
                            {},
                            `${field} size must be between ${rules.minSize}KB and ${rules.maxSize}KB. Uploaded: ${fileSizeKB.toFixed(2)}KB`
                        );
                    }
                }
            }
        }
    }

    console.log(requestData);

    // ✅ Validate request data using Zod
    const result = schema.safeParse(requestData);

    if (!result.success) {
        const errors = result.error.errors.map((e) => ({
            field: e.path ? e.path.join('.') : 'unknown',
            message: e.message,
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
