import sharedResponseTypes from '../utils/responseTypes.js';

const createDocument = async (
    req,
    res,
    model,
    uniqueFields,
    modelNameInSentenceCase,
    getPopulatedDocument,
    referenceFields,
    responsePipeline
) => {
    // 🔹 Check for uniqueness constraints before creation
    for (const field of uniqueFields) {
        if (req.body[field]) {
            const existingDoc = await model.findOne({
                [field]: req.body[field],
            });
            if (existingDoc) {
                const msg = `Conflict: ${modelNameInSentenceCase} with ${field} "${req.body[field]}" already exists.`;
                return sharedResponseTypes.CONFLICT(req, res, {}, msg);
            }
        }
    }

    // 🔹 Create the new document
    let doc = await model.create(req.body);

    // 🔹 If responsePipeline is provided, use aggregation
    if (responsePipeline) {
        const pipeline = [...responsePipeline];

        // Ensure filtering by _id
        const matchIndex = pipeline.findIndex((stage) => stage.$match);
        if (matchIndex !== -1) {
            // Modify existing $match to include _id filtering
            pipeline[matchIndex].$match._id = doc._id;
        } else {
            // Prepend a new $match stage if none exists
            pipeline.unshift({ $match: { _id: doc._id } });
        }

        // Execute aggregation pipeline
        const aggregatedResult = await model.aggregate(pipeline);
        doc = aggregatedResult.length ? aggregatedResult[0] : null;
    } else {
        // 🔹 Populate the document normally
        doc = await getPopulatedDocument(doc._id);
    }

    if (!doc) {
        const msg = `Error: Failed to retrieve ${modelNameInSentenceCase} after creation.`;
        return sharedResponseTypes.INTERNAL_SERVER_ERROR(req, res, {}, msg);
    }

    const msg = `Success: New ${modelNameInSentenceCase} created with ID "${doc._id}".`;
    return sharedResponseTypes.CREATED(req, res, {}, msg, doc);
};

export default createDocument;
