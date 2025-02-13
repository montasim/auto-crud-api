import express from 'express';

import toSentenceCase from '../utils/toSentenceCase.js';
import validateContentType from '../middlewares/validateContentType.js';
import validateInput from '../middlewares/validateInput.js';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequestBody from '../middlewares/validateRequestBody.js';

import HTTP_METHODS from '../constants/httpMethods.js';

// ✅ Determine the appropriate sub-schema based on HTTP method.
// For example: POST -> create, PUT/PATCH -> update, GET -> read, DELETE -> delete.
const getValidationSchema = (method, zodSchema) => {
    let validationSchema;
    switch (method.toUpperCase()) {
        case HTTP_METHODS.POST:
            validationSchema = zodSchema.create;
            break;
        case HTTP_METHODS.PUT:
        case HTTP_METHODS.PATCH:
            validationSchema = zodSchema.update;
            break;
        case HTTP_METHODS.GET:
            validationSchema = zodSchema.read;
            break;
        case HTTP_METHODS.DELETE:
            validationSchema = zodSchema.delete;
            break;
        default:
            validationSchema = zodSchema.create;
    }

    return validationSchema;
};

const crudRoutesFactory = (modelName, model, zodSchema, routes) => {
    const router = express.Router();
    const modelNameInSentenceCase = toSentenceCase(modelName);

    const uniqueFields = Object.entries(model.schema.paths)
        .filter(([, field]) => field.options.unique)
        .map(([key]) => key);

    const referenceFields = Object.entries(model.schema.paths)
        .filter(
            ([, field]) => field.instance === 'ObjectId' && field.options.ref
        )
        .map(([key]) => key);

    const getPopulatedDocument = async (documentId) =>
        model.findById(documentId).populate(referenceFields);

    const methodsThatRequireBody = ['POST', 'PUT', 'PATCH'];

    routes.forEach(
        ({ paths, method, handler, dataValidation = true, rules }) => {
            paths.forEach((path) => {
                const middleware = [];

                // ✅ Content-Type Validation
                if (rules?.request?.contentType) {
                    middleware.push((req, res, next) =>
                        validateContentType(
                            req,
                            res,
                            next,
                            rules.request.contentType
                        )
                    );
                }

                // ✅ Request Body Validation (if applicable)
                if (dataValidation && methodsThatRequireBody.includes(method)) {
                    middleware.push((req, res, next) =>
                        validateRequestBody(req, res, next)
                    );
                }

                // ✅ Check if the selected sub-schema has any keys to validate.
                // For a Zod object schema, an empty schema will have no keys in its shape.
                const validationSchema = getValidationSchema(method, zodSchema);
                const hasValidation =
                    validationSchema &&
                    Object.keys(validationSchema._def.shape).length > 0;

                // ✅ Data Validation: Only add the validation middleware if there's something to validate.
                if (dataValidation && hasValidation) {
                    middleware.push((req, res, next) =>
                        validateInput(req, res, next, validationSchema, rules)
                    );
                }

                // ✅ Handler Execution
                middleware.push(
                    asyncHandler((req, res) =>
                        handler(
                            req,
                            res,
                            model,
                            uniqueFields,
                            modelNameInSentenceCase,
                            getPopulatedDocument,
                            referenceFields,
                            rules
                        )
                    )
                );

                router[method.toLowerCase()](path, ...middleware);
            });
        }
    );

    return router;
};

export default crudRoutesFactory;
