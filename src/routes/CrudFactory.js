import express from 'express';

import logger from '../lib/logger.js';
import schema from '../lib/schema.js';
import sharedResponseTypes from '../utils/responseTypes.js';

import asyncHandler from '../utils/asyncHandler.js';
import validate from '../utils/validate.js';
import toSentenceCase from '../utils/toSentenceCase.js';

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
    // Route Handlers
    // ------------------------

    // Create a document.
    const createDocument = async (req, res) => {
        // Check for uniqueness constraints.
        for (const field of uniqueFields) {
            if (req.body[field]) {
                const existingDoc = await model.findOne({
                    [field]: req.body[field],
                });
                if (existingDoc) {
                    const msg = `Conflict: ${sentenceCaseModelName} with ${field} "${req.body[field]}" already exists.`;
                    logger.warn(msg);
                    return sharedResponseTypes.CONFLICT(req, res, {}, msg);
                }
            }
        }

        // Create the new document.
        let doc = await model.create(req.body);
        doc = await getPopulatedDoc(doc._id);

        const msg = `Success: New ${sentenceCaseModelName} created with ID "${doc._id}".`;
        logger.info(msg);
        return sharedResponseTypes.CREATED(req, res, {}, msg, doc);
    };

    // Retrieve a list of documents with filtering, sorting, numeric conversion, condition reporting, and invalid key detection.
    const getDocumentsList = async (req, res) => {
        // Destructure pagination and sorting parameters, and capture the rest as filters.
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            ...filters
        } = req.query;

        // Detect invalid keys (e.g., keys that start with '?').
        const invalidKeys = Object.keys(filters).filter((key) =>
            key.startsWith('?')
        );
        if (invalidKeys.length > 0) {
            const msg = `Bad Request: Invalid query parameter(s) detected: ${invalidKeys.join(', ')}.`;
            logger.warn(msg);

            // // Remove invalid keys from the filters.
            // invalidKeys.forEach((key) => delete filters[key]);
            return sharedResponseTypes.BAD_REQUEST(req, res, {}, msg);
        }

        // Build a filter query by including only non-empty filter values.
        const filterQuery = {};
        Object.keys(filters).forEach((key) => {
            if (filters[key] !== '') {
                filterQuery[key] = filters[key];
            }
        });

        // Convert filter values to numbers for numeric fields.
        Object.keys(filterQuery).forEach((key) => {
            const schemaPath = model.schema.paths[key];
            if (schemaPath && schemaPath.instance === 'Number') {
                filterQuery[key] = Number(filterQuery[key]);
            }
        });

        // Get the total count of documents matching the filter conditions.
        const totalCount = await model.countDocuments(filterQuery);

        // Execute the query with filtering, sorting, and pagination.
        const docs = await model
            .find(filterQuery)
            .populate(refFields) // Dynamically populate referenced fields.
            .sort(sort)
            .skip((page - 1) * Number(limit))
            .limit(Number(limit));

        // Build a condition string for the response message.
        const conditionStr = Object.keys(filterQuery).length
            ? JSON.stringify(filterQuery)
            : 'No filters applied';

        const msg = `Success: ${totalCount} ${sentenceCaseModelName}${totalCount !== 1 ? 's' : ''} fetched with filters: ${conditionStr}, sorted by '${sort}', page ${page}, and limit ${limit}.`;
        logger.info(msg);

        // Return both the total count and the documents.
        return sharedResponseTypes.OK(req, res, {}, msg, docs, totalCount);
    };

    // Retrieve a single document by ID.
    const getADocument = async (req, res) => {
        const docId = req.params.id;
        const doc = await getPopulatedDoc(docId);

        if (!doc)
            return sharedResponseTypes.NOT_FOUND(
                res,
                {},
                `Not Found: ${sentenceCaseModelName} with ID "${docId}" does not exist.`
            );

        const msg = `Success: ${sentenceCaseModelName} with ID "${docId}" fetched with populated references.`;
        logger.info(msg);
        return sharedResponseTypes.OK(req, res, {}, msg, doc);
    };

    // Update a document.
    const updateADocument = async (req, res) => {
        const docId = req.params.id;

        // Check uniqueness constraints.
        for (const field of uniqueFields) {
            if (req.body[field]) {
                const existingDoc = await model.findOne({
                    [field]: req.body[field],
                });
                if (existingDoc && existingDoc._id.toString() !== docId) {
                    const msg = `Conflict: ${sentenceCaseModelName} with ${field} "${req.body[field]}" already exists.`;
                    return sharedResponseTypes.CONFLICT(req, res, {}, msg);
                }
            }
        }

        let updatedDoc = await model.findByIdAndUpdate(docId, req.body, {
            new: true,
        });
        if (!updatedDoc)
            return sharedResponseTypes.NOT_FOUND(
                res,
                {},
                `Not Found: ${sentenceCaseModelName} with ID "${docId}" does not exist.`
            );

        updatedDoc = await getPopulatedDoc(docId);
        const msg = `Success: ${sentenceCaseModelName} updated with ID "${docId}".`;
        logger.info(msg);
        return sharedResponseTypes.OK(req, res, {}, msg, updatedDoc);
    };

    // Delete a single document.
    const deleteADocument = async (req, res) => {
        const docId = req.params.id;
        const deletedDoc = await model.findByIdAndDelete(docId);
        if (!deletedDoc)
            return sharedResponseTypes.NOT_FOUND(
                res,
                {},
                `Not Found: ${sentenceCaseModelName} with ID "${docId}" does not exist.`
            );

        const msg = `Success: ${sentenceCaseModelName} with ID "${docId}" deleted successfully.`;
        logger.info(msg);
        return sharedResponseTypes.OK(req, res, {}, msg);
    };

    // Delete multiple documents.
    const deleteDocumentList = async (req, res) => {
        // Validate the request using Zod.
        const validationResult = schema.idsSchema.safeParse(req.query);
        if (!validationResult.success) {
            return sharedResponseTypes.BAD_REQUEST(
                res,
                {},
                `Bad Request: ${validationResult.error.errors[0].message}`
            );
        }

        // Expect a comma-separated list of IDs.
        const docIds = req.query.ids.split(',');

        // Ensure that all provided IDs exist.
        const existingDocs = await model.find({ _id: { $in: docIds } });
        if (existingDocs.length !== docIds.length) {
            return sharedResponseTypes.NOT_FOUND(
                res,
                {},
                `Not Found: Some ${sentenceCaseModelName} IDs do not exist. Deletion aborted.`
            );
        }

        // Delete all matching documents.
        await model.deleteMany({ _id: { $in: docIds } });
        const msg = `Success: ${sentenceCaseModelName} with IDs: ${docIds.join(', ')} deleted successfully.`;
        logger.info(msg);
        return sharedResponseTypes.OK(req, res, {}, msg);
    };

    // ------------------------
    // Route Definitions
    // ------------------------

    // Group route paths to reduce redundancy.
    const createDocumentPaths = ['/', '/create', '/new'];
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
        router.post(path, validate(zodSchema), asyncHandler(createDocument));
    });

    // Read All (GET)
    getDocumentListPaths.forEach((path) => {
        router.get(path, validate(zodSchema), asyncHandler(getDocumentsList));
    });

    // Read One (GET)
    getOneDocumentPaths.forEach((path) => {
        router.get(path, validate(zodSchema), asyncHandler(getADocument));
    });

    // Update (PATCH)
    patchDocumentPaths.forEach((path) => {
        router.patch(path, validate(zodSchema), asyncHandler(updateADocument));
    });

    // Delete One (DELETE)
    deleteOneDocumentPaths.forEach((path) => {
        router.delete(path, validate(zodSchema), asyncHandler(deleteADocument));
    });

    // Delete List (DELETE)
    deleteDocumentListPaths.forEach((path) => {
        router.delete(
            path,
            validate(zodSchema),
            asyncHandler(deleteDocumentList)
        );
    });

    // ------------------------
    // Undefined Routes Handling
    // ------------------------
    // Catch-all route for undefined endpoints.
    router.all('*', (req, res) => {
        const msg = `Not Found: The route ${req.originalUrl} does not exist.`;
        logger.warn(msg);
        return sharedResponseTypes.NOT_FOUND(req, res, {}, msg);
    });

    return router;
};

export default createCrudRoutes;
