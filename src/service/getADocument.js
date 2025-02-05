import contentTypes from 'content-types-lite';

import sharedResponseTypes from '../utils/responseTypes.js';

import convertToMongooseObjectId from '../utils/convertToMongooseObjectId.js';

const getADocument = async (
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
    const docId = convertToMongooseObjectId(req.params.id);
    let doc = {};

    if (responsePipeline) {
        // Clone the pipeline to avoid modifying the original reference
        const pipeline = [...responsePipeline];

        // Check if a $match condition exists
        const matchIndex = pipeline.findIndex((stage) => stage.$match);

        if (matchIndex !== -1) {
            // Modify the existing $match stage to filter by ID
            pipeline[matchIndex].$match._id = docId;
        } else {
            // If no $match exists, add one to filter by ID
            pipeline.unshift({ $match: { _id: docId } });
        }

        // Execute aggregation pipeline
        doc = await model.aggregate(pipeline);
    } else {
        doc = await getPopulatedDocument(docId);
    }

    if (!doc || (Array.isArray(doc) && doc.length === 0)) {
        const msg = `Not Found: ${modelNameInSentenceCase} with ID "${docId}" does not exist.`;
        return sharedResponseTypes.NOT_FOUND(req, res, contentType, msg);
    }

    const msg = `Success: ${modelNameInSentenceCase} with ID "${docId}" fetched with populated references.`;
    return sharedResponseTypes.OK(
        req,
        res,
        contentType,
        msg,
        Array.isArray(doc) ? doc[0] : doc
    );
};

export default getADocument;
