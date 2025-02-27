import contentTypes from 'content-types-lite';

import sharedResponseTypes from '../utils/responseTypes.js';

import convertToMongooseObjectId from '../utils/convertToMongooseObjectId.js';

const updateADocument = async (
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
    const docId = req.params.id;

    // 🔹 Ensure the document exists before updating
    const existingDoc = await model.findById(docId);
    if (!existingDoc) {
        const msg = `Not Found: ${modelNameInSentenceCase} with ID "${docId}" does not exist.`;
        return sharedResponseTypes.NOT_FOUND(req, res, contentType, msg);
    }

    // 🔹 Check uniqueness constraints before updating
    for (const field of uniqueFields) {
        if (req.body[field]) {
            const conflictingDoc = await model.findOne({
                [field]: req.body[field],
            });

            if (
                conflictingDoc ||
                (conflictingDoc?.length &&
                    conflictingDoc._id.toString() !== docId)
            ) {
                const msg = `Conflict: ${modelNameInSentenceCase} with ${field} "${req.body[field]}" already exists.`;
                return sharedResponseTypes.CONFLICT(req, res, contentType, msg);
            }
        }
    }

    // 🔹 Perform the update operation
    await model.updateOne({ _id: docId }, req.body);

    let updatedDoc;
    if (responsePipeline) {
        const pipeline = [...responsePipeline];

        const matchIndex = pipeline.findIndex((stage) => stage.$match);
        if (matchIndex !== -1) {
            pipeline[matchIndex].$match = {
                ...pipeline[matchIndex].$match,
                _id: convertToMongooseObjectId(docId),
            };
        } else {
            pipeline.unshift({
                $match: { _id: convertToMongooseObjectId(docId) },
            });
        }

        const result = await model.aggregate(pipeline);
        updatedDoc = result.length > 0 ? result[0] : null;
    } else {
        // Fetch the updated document with populated references
        updatedDoc = await getPopulatedDocument(docId);
    }

    if (!updatedDoc) {
        const msg = `Not Found: ${modelNameInSentenceCase} with ID "${docId}" does not exist after update.`;
        return sharedResponseTypes.NOT_FOUND(req, res, contentType, msg);
    }

    const msg = `Success: ${modelNameInSentenceCase} updated with ID "${docId}".`;
    return sharedResponseTypes.OK(req, res, contentType, msg, updatedDoc);
};

export default updateADocument;
