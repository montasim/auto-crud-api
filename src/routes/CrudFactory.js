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

    // Get unique fields from the schema
    const uniqueFields = Object.entries(model.schema.paths)
        .filter(([_, value]) => value.options.unique)
        .map(([key]) => key);

    // Get schema reference fields dynamically
    const refFields = Object.entries(model.schema.paths)
        .filter(
            ([_, value]) => value.instance === 'ObjectId' && value.options.ref
        )
        .map(([key, value]) => key);

    const createDocument = async (req, res) => {
        // Check for existing unique fields
        for (const field of uniqueFields) {
            if (req.body[field]) {
                const existingDoc = await model.findOne({
                    [field]: req.body[field],
                });
                if (existingDoc) {
                    const existingDocMessage = `${sentenceCaseModelName} with ${field} "${req.body[field]}" already exists`;

                    logger.warn(existingDocMessage);

                    return sharedResponseTypes.CONFLICT(
                        res,
                        {},
                        existingDocMessage
                    );
                }
            }
        }

        // Create new document
        let doc = await model.create(req.body);

        // Populate referenced fields
        doc = await model.findById(doc._id).populate(refFields);

        const successMessage = `New ${sentenceCaseModelName} created with ID: "${doc._id}"`;

        logger.info(successMessage);

        return sharedResponseTypes.CREATED(res, {}, successMessage, doc);
    };

    const getDocumentsList = async (req, res) => {
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const docs = await model
            .find({})
            .populate(refFields) // Populate referenced fields dynamically
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const successMessage = `${sentenceCaseModelName} fetched with populated references`;

        logger.info(successMessage);

        return sharedResponseTypes.OK(res, {}, successMessage, docs);
    };

    const getADocument = async (req, res) => {
        const docId = req.params.id;

        const doc = await model.findById(docId).populate(refFields);

        if (!doc)
            return sharedResponseTypes.NOT_FOUND(
                res,
                {},
                `${sentenceCaseModelName} with ID: "${docId}" not found`
            );

        const successMessage = `${sentenceCaseModelName} with ID: "${docId}" fetched with populated references`;

        logger.info(successMessage);

        return sharedResponseTypes.OK(res, {}, successMessage, doc);
    };

    const updateADocument = async (req, res) => {
        const docId = req.params.id;

        // Check for existing unique fields before update
        for (const field of uniqueFields) {
            if (req.body[field]) {
                const existingDoc = await model.findOne({
                    [field]: req.body[field],
                });
                if (existingDoc && existingDoc._id.toString() !== docId) {
                    return sharedResponseTypes.CONFLICT(
                        res,
                        {},
                        `${sentenceCaseModelName} with ${field} "${req.body[field]}" already exists`
                    );
                }
            }
        }

        // Update document
        let updatedDoc = await model.findByIdAndUpdate(docId, req.body, {
            new: true,
        });

        if (!updatedDoc)
            return sharedResponseTypes.NOT_FOUND(
                res,
                {},
                `${sentenceCaseModelName} with ID: "${docId}" not found`
            );

        // Populate referenced fields
        updatedDoc = await model.findById(docId).populate(refFields);

        const successMessage = `${sentenceCaseModelName} updated with ID: "${docId}"`;

        logger.info(successMessage);

        return sharedResponseTypes.OK(res, {}, successMessage, updatedDoc);
    };

    const deleteADocument = async (req, res) => {
        const docId = req.params.id;
        const deletedDoc = await model.findByIdAndDelete(docId);

        if (!deletedDoc)
            sharedResponseTypes.NOT_FOUND(
                res,
                {},
                `${sentenceCaseModelName} with ID: "${docId}" not found`
            );

        const successMessage = `${sentenceCaseModelName} with ID: ${docId} deleted successfully`;

        logger.info(successMessage);

        return sharedResponseTypes.OK(res, {}, successMessage);
    };

    const deleteDocumentList = async (req, res) => {
        // Validate the request using Zod
        const validationResult = schema.idsSchema.safeParse(req.query);
        if (!validationResult.success) {
            return sharedResponseTypes.BAD_REQUEST(
                res,
                {},
                validationResult.error.errors[0].message
            );
        }

        const docIds = req.query.ids.split(',');

        // Check if all documents exist
        const existingDocs = await model.find({ _id: { $in: docIds } });

        if (existingDocs.length !== docIds.length) {
            return sharedResponseTypes.NOT_FOUND(
                res,
                {},
                `Some ${sentenceCaseModelName} IDs do not exist. Deletion aborted.`
            );
        }

        // If all exist, delete them
        await model.deleteMany({ _id: { $in: docIds } });

        const successMessage = `${sentenceCaseModelName} with IDs: ${docIds.join(', ')} deleted successfully`;

        logger.info(successMessage);

        return sharedResponseTypes.OK(res, {}, successMessage);
    };

    // Create
    router.post('/', validate(zodSchema), asyncHandler(createDocument));
    router.post('/create', validate(zodSchema), asyncHandler(createDocument));
    router.post('/new', validate(zodSchema), asyncHandler(createDocument));

    // Read All
    router.get('/', validate(zodSchema), asyncHandler(getDocumentsList));
    router.get('/all', validate(zodSchema), asyncHandler(getDocumentsList));
    router.get('/list', validate(zodSchema), asyncHandler(getDocumentsList));
    router.get('/read', validate(zodSchema), asyncHandler(getDocumentsList));
    router.get('/show', validate(zodSchema), asyncHandler(getDocumentsList));
    router.get('/view', validate(zodSchema), asyncHandler(getDocumentsList));

    // Read One
    router.get('/:id', validate(zodSchema), asyncHandler(getADocument));
    router.get('/read/:id', validate(zodSchema), asyncHandler(getADocument));
    router.get('/show/:id', validate(zodSchema), asyncHandler(getADocument));
    router.get('/view/:id', validate(zodSchema), asyncHandler(getADocument));

    // Update One
    router.patch('/:id', validate(zodSchema), asyncHandler(updateADocument));
    router.patch(
        '/edit/:id',
        validate(zodSchema),
        asyncHandler(updateADocument)
    );
    router.patch(
        '/update/:id',
        validate(zodSchema),
        asyncHandler(updateADocument)
    );

    // Delete One
    router.delete('/:id', validate(zodSchema), asyncHandler(deleteADocument));
    router.delete(
        '/delete/:id',
        validate(zodSchema),
        asyncHandler(deleteADocument)
    );
    router.delete(
        '/destroy/:id',
        validate(zodSchema),
        asyncHandler(deleteADocument)
    );

    // Delete List
    router.delete('/', validate(zodSchema), asyncHandler(deleteDocumentList));
    router.delete(
        '/delete-list',
        validate(zodSchema),
        asyncHandler(deleteDocumentList)
    );
    router.delete(
        '/delete-by-list',
        validate(zodSchema),
        asyncHandler(deleteDocumentList)
    );
    router.delete(
        '/destroy-list',
        validate(zodSchema),
        asyncHandler(deleteDocumentList)
    );
    router.delete(
        '/destroy-by-list',
        validate(zodSchema),
        asyncHandler(deleteDocumentList)
    );

    return router;
};

export default createCrudRoutes;
