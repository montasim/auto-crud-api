import { faker } from '@faker-js/faker';
import RandExp from 'randexp';
import { Types } from 'mongoose';
import contentTypes from 'content-types-lite';

import sharedResponseTypes from '../utils/responseTypes.js';

import getIntValue from '../utils/getIntValue.js';

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
            } else if (regexStr.includes('^\\d') || regexStr.includes('\\d+')) {
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
 * @param model
 * @returns {Promise<Array>} - An array of dummy data objects.
 */
const generateDummyData = async (count, model) => {
    const dummyData = [];
    for (let i = 0; i < count; i++) {
        const record = {};
        // Iterate over each field in the schema.
        for (const [key, fieldSchema] of Object.entries(model?.schema?.paths)) {
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

const createDummyDocuments = async (
    req,
    res,
    model,
    uniqueFields,
    modelNameInSentenceCase,
    getPopulatedDocument,
    referenceFields,
    rules
) => {
    const responsePipeline = rules?.response?.pipeline || [];
    const contentType = rules?.response?.contentType || contentTypes.JSON;
    const { count = 1 } = req.query;
    const parsedCount = getIntValue(count);

    // 🔹 Validate 'count' parameter
    if (isNaN(parsedCount) || parsedCount <= 0) {
        const msg = `Bad Request: The "count" parameter must be a positive integer.`;
        return sharedResponseTypes.BAD_REQUEST(req, res, contentType, msg);
    }

    // 🔹 Generate dummy data based on the model schema
    const dummyData = await generateDummyData(parsedCount, model);

    // 🔹 Insert dummy documents
    const insertedDocs = await model.insertMany(dummyData, { ordered: false });

    let finalDocs;
    if (responsePipeline) {
        // Ensure $match filters by newly inserted IDs
        const insertedIds = insertedDocs.map((doc) => doc._id);
        const pipeline = [...responsePipeline];

        const matchIndex = pipeline.findIndex((stage) => stage.$match);
        if (matchIndex !== -1) {
            pipeline[matchIndex].$match = {
                ...pipeline[matchIndex].$match,
                _id: { $in: insertedIds },
            };
        } else {
            pipeline.unshift({ $match: { _id: { $in: insertedIds } } });
        }

        // Fetch newly created documents using aggregation
        finalDocs = await model.aggregate(pipeline);
    } else {
        // Fetch populated documents normally
        finalDocs = await model
            .find({ _id: { $in: insertedDocs.map((doc) => doc._id) } })
            .populate(referenceFields);
    }

    const msg = `Success: ${parsedCount} ${modelNameInSentenceCase}${parsedCount !== 1 ? 's' : ''} created with dummy data.`;
    return sharedResponseTypes.CREATED(req, res, contentType, msg, finalDocs);
};

export default createDummyDocuments;
