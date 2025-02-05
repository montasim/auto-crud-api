import express from 'express';
import multer from 'multer';
import asyncHandler from '../utils/asyncHandler.js';
import validateInput from '../middlewares/validateInput.js';
import toSentenceCase from '../utils/toSentenceCase.js';

/**
 * Creates dynamic Multer middleware based on schema rules.
 */
const createMulterMiddleware = (schemaRules) => {
    return Object.entries(schemaRules).reduce(
        (middlewareMap, [field, rules]) => {
            if (rules.allowedMimeType) {
                const storage = multer.memoryStorage();

                const upload = multer({
                    storage,
                    limits: {
                        fileSize: rules.maxSize * 1024, // Convert KB to bytes
                    },
                    fileFilter: (req, file, cb) => {
                        if (!rules.allowedMimeType.includes(file.mimetype)) {
                            return cb(
                                new Error(
                                    `Invalid file type. Allowed types: ${rules.allowedMimeType.join(', ')}`
                                )
                            );
                        }
                        cb(null, true);
                    },
                });

                middlewareMap[field] = upload.array(field, rules.maxFile || 1);
            }

            return middlewareMap;
        },
        {}
    );
};

/**
 * Creates CRUD routes dynamically.
 */
const createCrudRoutes = (
    modelName,
    model,
    zodSchema,
    routes,
    schemaRules = {}
) => {
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

    // Generate multer middlewares for applicable fields
    const uploadMiddlewares = createMulterMiddleware(schemaRules);

    routes.forEach(
        ({ paths, method, handler, dataValidation = true, rules }) => {
            paths.forEach((path) => {
                const middleware = [];

                // Apply file upload middleware if applicable
                Object.keys(uploadMiddlewares).forEach((field) => {
                    middleware.push(uploadMiddlewares[field]);
                });

                // Apply request validation
                if (dataValidation) {
                    middleware.push((req, res, next) =>
                        validateInput(
                            req,
                            res,
                            next,
                            zodSchema,
                            rules,
                            schemaRules
                        )
                    );
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

export default createCrudRoutes;
