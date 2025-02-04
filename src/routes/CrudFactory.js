import express from 'express';
import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import RandExp from 'randexp';

import logger from '../lib/logger.js';
import schema from '../lib/schema.js';
import sharedResponseTypes from '../utils/responseTypes.js';

import asyncHandler from '../utils/asyncHandler.js';
import validate from '../utils/validate.js';
import toSentenceCase from '../utils/toSentenceCase.js';
import getIntValue from '../utils/getIntValue.js';

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

    // ----------------------------------------------------------------------------------
    // Dummy Data Generation Helpers
    // ----------------------------------------------------------------------------------

    /**
     * Generates a dummy value for a given field based on its type and schema settings.
     * - For string fields: if a regex (match) is provided in the schema options, it uses RandExp to generate
     *   a value that matches the regex; otherwise, it generates lorem text that respects minlength and maxlength.
     * - For other types, it uses the appropriate faker methods.
     *
     * @param {string} key - The field name.
     * @param {object} fieldSchema - The Mongoose schema field definition.
     * @returns {*} - A dummy value.
     */
    const generateFieldValue = (key, fieldSchema) => {
        const lowerKey = key.toLowerCase();

        // For String fields, we generate human-readable data based on the defined schema options.
        if (fieldSchema.instance === 'String') {
            // If a match rule is provided, inspect the regex string.
            if (fieldSchema.options && fieldSchema.options.match) {
                const regex = fieldSchema.options.match[0];
                const regexStr = regex.toString();

                // Heuristics based on the regex pattern:
                if (regexStr.includes('@')) {
                    // Likely an email.
                    return faker.internet.email().toLowerCase();
                } else if (regexStr.includes('https?:\\')) {
                    // Generate a valid URL that meets the minlength and maxlength constraints.
                    // Here we use a fixed base URL and a small random slug.
                    const baseUrl = 'https://example.com/';
                    // Ensure that baseUrl is already long enough (e.g. 20 characters).
                    // Then append a short random slug so that the total length is within [10, 100].
                    const slug = faker.string.alphanumeric({ length: 5 });
                    const url = baseUrl + slug;
                    // Optionally, if you want to be extra sure, you can trim if too long:
                    return url.length > 100 ? url.slice(0, 100) : url;
                } else if (
                    regexStr.includes('^\\d') ||
                    regexStr.includes('\\d+')
                ) {
                    // Likely a numeric string.
                    const minLength = fieldSchema.options.minlength
                        ? fieldSchema.options.minlength[0]
                        : 5;
                    // Generate a numeric string of the minimum required length.
                    return faker.string.numeric({ length: minLength });
                } else if (
                    regexStr.includes('[A-Za-z') &&
                    regexStr.includes('\\s')
                ) {
                    // Likely a name or text field with letters and spaces.
                    // We'll generate lorem text using length constraints.
                    const minLength = fieldSchema.options.minlength
                        ? fieldSchema.options.minlength[0]
                        : 5;
                    const maxLength = fieldSchema.options.maxlength
                        ? fieldSchema.options.maxlength[0]
                        : 20;
                    let text = faker.lorem.sentence();
                    while (text.length < minLength) {
                        text += ` ${faker.lorem.sentence()}`;
                    }
                    if (text.length > maxLength) {
                        text = text.substring(0, maxLength);
                        const lastSpace = text.lastIndexOf(' ');
                        if (lastSpace > 0) {
                            text = text.substring(0, lastSpace);
                        }
                    }
                    return text.substring(0, maxLength / 3);
                } else {
                    // Fallback: use RandExp to generate a value that matches the regex.
                    return new RandExp(regex).gen();
                }
            } else {
                // No regex provided: generate human-readable lorem text using minlength and maxlength.
                const minLength =
                    fieldSchema.options && fieldSchema.options.minlength
                        ? fieldSchema.options.minlength[0]
                        : 5;
                const maxLength =
                    fieldSchema.options && fieldSchema.options.maxlength
                        ? fieldSchema.options.maxlength[0]
                        : 20;
                let text = faker.lorem.sentence();
                while (text.length < minLength) {
                    text += ` ${faker.lorem.sentence()}`;
                }
                if (text.length > maxLength) {
                    text = text.substring(0, maxLength);
                    const lastSpace = text.lastIndexOf(' ');
                    if (lastSpace > 0) {
                        text = text.substring(0, lastSpace);
                    }
                }
                return text;
            }
        } else if (fieldSchema.instance === 'Number') {
            const min =
                fieldSchema.options && fieldSchema.options.min
                    ? fieldSchema.options.min[0]
                    : 0;
            const max =
                fieldSchema.options && fieldSchema.options.max
                    ? fieldSchema.options.max[0]
                    : 100;
            return faker.number.int({ min, max });
        } else if (fieldSchema.instance === 'Boolean') {
            return faker.datatype.boolean();
        } else if (fieldSchema.instance === 'Date') {
            return faker.date.past();
        } else if (
            fieldSchema.instance === 'ObjectId' ||
            fieldSchema.instance === 'ObjectID'
        ) {
            return new Types.ObjectId();
        } else {
            return null;
        }
    };

    /**
     * Generates an array of dummy data objects based on the model's schema.
     *
     * @param {number} count - Number of dummy records to generate.
     * @returns {Promise<Array>} - An array of dummy data objects.
     */
    const generateDummyData = async (count) => {
        const dummyData = [];
        for (let i = 0; i < count; i++) {
            const record = {};
            // Iterate over each field in the schema.
            for (const [key, fieldSchema] of Object.entries(
                model.schema.paths
            )) {
                // Skip internal fields such as __v.
                if (key === '__v') continue;
                record[key] = generateFieldValue(key, fieldSchema);
            }
            dummyData.push(record);
        }
        return dummyData;
    };

    // ----------------------------------------------------------------------------------
    // Route Handler: Create Dummy Data
    // ----------------------------------------------------------------------------------

    /**
     * Route handler to create dummy documents.
     * Expects a query parameter "count" indicating how many dummy records to generate.
     */
    const createDummyDocuments = async (req, res) => {
        const { count = 1 } = req.query;
        const parsedCount = getIntValue(count);
        if (isNaN(parsedCount) || parsedCount <= 0) {
            const msg = `Bad Request: The "count" parameter must be a positive integer.`;
            logger.warn(msg);
            return sharedResponseTypes.BAD_REQUEST(req, res, {}, msg);
        }
        // Generate dummy data based on the schema.
        const dummyData = await generateDummyData(parsedCount);
        // Insert the dummy records into the database.
        await model.insertMany(dummyData);
        const msg = `Success: ${parsedCount} ${sentenceCaseModelName}${
            parsedCount !== 1 ? 's' : ''
        } created with dummy data.`;
        logger.info(msg);
        return sharedResponseTypes.CREATED(req, res, {}, msg, dummyData);
    };

    // ----------------------------------------------------------------------------------
    // (Existing CRUD route handlers remain unchanged)
    // ----------------------------------------------------------------------------------

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
        router.post(path, validate(zodSchema), asyncHandler(createDocument));
    });

    // Create Dummy (POST)
    createDummyDocumentPaths.forEach((path) => {
        router.post(path, asyncHandler(createDummyDocuments));
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
