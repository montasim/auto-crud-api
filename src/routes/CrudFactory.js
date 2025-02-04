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
    const sentenceCaseModelName = toSentenceCase(model.modelName);

    // Extract unique fields from the Mongoose schema.
    const uniqueFields = Object.entries(model.schema.paths)
        .filter(([_, value]) => value.options.unique)
        .map(([key]) => key);

    // Extract reference fields for population.
    const refFields = Object.entries(model.schema.paths)
        .filter(
            ([_, value]) => value.instance === 'ObjectId' && value.options.ref
        )
        .map(([key]) => key);

    // Helper to retrieve a document by its ID with populated reference fields.
    const getPopulatedDoc = async (docId) =>
        model.findById(docId).populate(refFields);

    // ------------------------
    // Route Definitions
    // ------------------------

    // Group route paths to reduce redundancy.
    const createDocumentPaths = ['/', '/create', '/new'];
    const createDummyDocumentPaths = [
        '/create/dummy',
        '/create-dummy',
        '/create-dummy-data',
        '/create-fake',
        '/create-fake-data',
        '/create-sample',
        '/create-sample-data',
        '/generate-sample',
        '/generate-sample-data',
    ];
    const getDocumentListPaths = [
        '/',
        '/all',
        '/list',
        '/read',
        '/show',
        '/view',
    ];
    const getOneDocumentPaths = ['/:id', '/read/:id', '/show/:id', '/view/:id'];
    const patchDocumentPaths = ['/:id', '/edit/:id', '/update/:id'];
    const deleteOneDocumentPaths = ['/:id', '/delete/:id', '/destroy/:id'];
    const deleteDocumentListPaths = [
        '/',
        '/delete-list',
        '/delete-by-list',
        '/destroy-list',
        '/destroy-by-list',
    ];

    // Create (POST)
    createDocumentPaths.forEach((path) => {
        router.post(
            path,
            validate(zodSchema),
            asyncHandler((req, res) =>
                createDocument(
                    req,
                    res,
                    req,
                    res,
                    model,
                    uniqueFields,
                    sentenceCaseModelName,
                    getPopulatedDoc,
                    refFields
                )
            )
        );
    });

    // Create Dummy (POST)
    createDummyDocumentPaths.forEach((path) => {
        router.post(
            path,
            asyncHandler((req, res) =>
                createDummyDocuments(
                    req,
                    res,
                    req,
                    res,
                    model,
                    uniqueFields,
                    sentenceCaseModelName,
                    getPopulatedDoc,
                    refFields
                )
            )
        );
    });

    // Read All (GET)
    getDocumentListPaths.forEach((path) => {
        router.get(
            path,
            validate(zodSchema),
            asyncHandler((req, res) =>
                getDocumentsList(
                    req,
                    res,
                    model,
                    uniqueFields,
                    sentenceCaseModelName,
                    getPopulatedDoc,
                    refFields
                )
            )
        );
    });

    // Read One (GET)
    getOneDocumentPaths.forEach((path) => {
        router.get(
            path,
            validate(zodSchema),
            asyncHandler((req, res) =>
                getADocument(
                    req,
                    res,
                    model,
                    uniqueFields,
                    sentenceCaseModelName,
                    getPopulatedDoc,
                    refFields
                )
            )
        );
    });

    // Update (PATCH)
    patchDocumentPaths.forEach((path) => {
        router.patch(
            path,
            validate(zodSchema),
            asyncHandler((req, res) =>
                updateADocument(
                    req,
                    res,
                    model,
                    uniqueFields,
                    sentenceCaseModelName,
                    getPopulatedDoc,
                    refFields
                )
            )
        );
    });

    // Delete One (DELETE)
    deleteOneDocumentPaths.forEach((path) => {
        router.delete(
            path,
            validate(zodSchema),
            asyncHandler((req, res) =>
                deleteADocument(
                    req,
                    res,
                    model,
                    uniqueFields,
                    sentenceCaseModelName,
                    getPopulatedDoc,
                    refFields
                )
            )
        );
    });

    // Delete List (DELETE)
    deleteDocumentListPaths.forEach((path) => {
        router.delete(
            path,
            validate(zodSchema),
            asyncHandler((req, res) =>
                deleteDocumentList(
                    req,
                    res,
                    model,
                    uniqueFields,
                    sentenceCaseModelName,
                    getPopulatedDoc,
                    refFields
                )
            )
        );
    });

    return router;
};

export default createCrudRoutes;
