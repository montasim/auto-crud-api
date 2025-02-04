import express from 'express';

import httpMethods from '../constants/httpMethods.js';

import asyncHandler from '../utils/asyncHandler.js';
import validate from '../utils/validate.js';
import toSentenceCase from '../utils/toSentenceCase.js';
import createDocument from '../service/createDocument.js';
import createDummyDocuments from '../service/createDummyDocuments.js';
import getDocumentsList from '../service/getDocumentsList.js';
import getADocument from '../service/getADocument.js';
import updateADocument from '../service/updateADocument.js';
import deleteADocument from '../service/deleteADocument.js';
import deleteDocumentList from '../service/deleteDocumentList.js';

const createCrudRoutes = (model, zodSchema) => {
    const router = express.Router();
    const modelNameInSentenceCase = toSentenceCase(model.modelName);

    // Extract unique fields and reference fields.
    const uniqueFields = Object.entries(model.schema.paths)
        .filter(([, field]) => field.options.unique)
        .map(([key]) => key);

    const referenceFields = Object.entries(model.schema.paths)
        .filter(
            ([, field]) => field.instance === 'ObjectId' && field.options.ref
        )
        .map(([key]) => key);

    // Helper to retrieve a document by its ID with populated reference fields.
    const getPopulatedDocument = async (documentId) =>
        model.findById(documentId).populate(referenceFields);

    // Routes definitions and their corresponding handlers.
    const routesConfig = [
        {
            paths: ['/', '/create', '/new'],
            method: httpMethods.POST.toLowerCase(),
            handler: createDocument,
            additionalParams: true,
        },
        {
            paths: [
                '/create/dummy',
                '/create-dummy',
                '/create-dummy-data',
                '/create-fake',
                '/create-fake-data',
                '/create-sample',
                '/create-sample-data',
                '/generate-sample',
                '/generate-sample-data',
            ],
            method: httpMethods.POST.toLowerCase(),
            handler: createDummyDocuments,
            dataValidation: false,
        },
        {
            paths: ['/', '/all', '/list', '/read', '/show', '/view'],
            method: httpMethods.GET.toLowerCase(),
            handler: getDocumentsList,
        },
        {
            paths: ['/:id', '/read/:id', '/show/:id', '/view/:id'],
            method: httpMethods.GET.toLowerCase(),
            handler: getADocument,
        },
        {
            paths: ['/:id', '/edit/:id', '/update/:id'],
            method: httpMethods.PATCH.toLowerCase(),
            handler: updateADocument,
        },
        {
            paths: ['/:id', '/delete/:id', '/destroy/:id'],
            method: httpMethods.DELETE.toLowerCase(),
            handler: deleteADocument,
        },
        {
            paths: [
                '/',
                '/delete-list',
                '/delete-by-list',
                '/destroy-list',
                '/destroy-by-list',
            ],
            method: httpMethods.DELETE.toLowerCase(),
            handler: deleteDocumentList,
        },
    ];

    // Dynamic route creation.
    routesConfig.forEach(
        ({ paths, method, handler, dataValidation = true }) => {
            paths.forEach((path) => {
                const middleware = [];

                // ✅ Only add validation if `dataValidation` is `false`
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

                router[method](path, ...middleware);
            });
        }
    );

    return router;
};

export default createCrudRoutes;
