import express from 'express';

import asyncHandler from '../utils/asyncHandler.js';
import validate from '../utils/validate.js';
import toSentenceCase from '../utils/toSentenceCase.js';

const createCrudRoutes = (modelName, model, zodSchema, routes) => {
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

    routes.forEach(({ paths, method, handler, dataValidation = true }) => {
        paths.forEach((path) => {
            const middleware = [];

            if (dataValidation) {
                middleware.push(validate(zodSchema));
            }

            middleware.push(
                asyncHandler((req, res) => {
                    return handler(
                        req,
                        res,
                        model,
                        uniqueFields,
                        modelNameInSentenceCase,
                        getPopulatedDocument,
                        referenceFields
                    );
                })
            );

            router[method.toLowerCase()](path, ...middleware);
        });
    });

    return router;
};

export default createCrudRoutes;
