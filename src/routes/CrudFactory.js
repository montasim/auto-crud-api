import express from 'express';

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
        .filter(([_, field]) => field.options.unique)
        .map(([key]) => key);

    const referenceFields = Object.entries(model.schema.paths)
        .filter(
            ([_, field]) => field.instance === 'ObjectId' && field.options.ref
        )
        .map(([key]) => key);

    // Helper to retrieve a document by its ID with populated reference fields.
    const getPopulatedDocument = async (documentId) =>
        model.findById(documentId).populate(referenceFields);

    // Routes definitions and their corresponding handlers.
    const routesConfig = [
        {
            paths: ['/', '/create', '/new'],
            method: 'post',
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
            method: 'post',
            handler: createDummyDocuments,
        },
        {
            paths: ['/', '/all', '/list', '/read', '/show', '/view'],
            method: 'get',
            handler: getDocumentsList,
        },
        {
            paths: [':/id', '/read/:id', '/show/:id', '/view/:id'],
            method: 'get',
            handler: getADocument,
        },
        {
            paths: [':/id', '/edit/:id', '/update/:id'],
            method: 'patch',
            handler: updateADocument,
        },
        {
            paths: [':/id', '/delete/:id', '/destroy/:id'],
            method: 'delete',
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
            method: 'delete',
            handler: deleteDocumentList,
        },
    ];

    // Dynamic route creation.
    routesConfig.forEach(
        ({ paths, method, handler, additionalParams = false }) => {
            paths.forEach((path) => {
                router[method](
                    path,
                    validate(zodSchema),
                    asyncHandler((req, res) => {
                        if (additionalParams) {
                            return handler(
                                req,
                                res,
                                req,
                                res,
                                model,
                                uniqueFields,
                                modelNameInSentenceCase,
                                getPopulatedDocument,
                                referenceFields
                            );
                        }
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
            });
        }
    );

    return router;
};

export default createCrudRoutes;
