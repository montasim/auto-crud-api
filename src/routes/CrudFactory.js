import express from 'express';

import toSentenceCase from '../utils/toSentenceCase.js';
import validateContentType from '../middlewares/validateContentType.js';
import validateInput from '../middlewares/validateInput.js';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequestBody from '../middlewares/validateRequestBody.js';

const buildCrudRoutes = (modelName, model, zodSchema, routes) => {
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

                // ✅ Request Body Validation
                if (dataValidation && methodsThatRequireBody.includes(method)) {
                    middleware.push((req, res, next) =>
                        validateRequestBody(req, res, next)
                    );
                }

                // ✅ Data Validation
                if (dataValidation) {
                    middleware.push((req, res, next) =>
                        validateInput(req, res, next, zodSchema, rules)
                    );
                }

                // ✅ Handler
                middleware.push(
                    asyncHandler((req, res) => {
                        return handler(
                            req,
                            res,
                            model,
                            uniqueFields,
                            modelNameInSentenceCase,
                            getPopulatedDocument,
                            referenceFields,
                            rules
                        );
                    })
                );

                router[method.toLowerCase()](path, ...middleware);
            });
        }
    );

    return router;
};

export default buildCrudRoutes;
