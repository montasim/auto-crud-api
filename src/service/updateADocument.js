import sharedResponseTypes from '../utils/responseTypes.js';

const updateADocument = async (
    req,
    res,
    model,
    uniqueFields,
    modelNameInSentenceCase,
    getPopulatedDocument,
    referenceFields,
    responsePipeline
) => {
    const docId = req.params.id;

    // 🔹 Ensure the document exists before updating
    const existingDoc = await model.findById(docId);
    if (!existingDoc) {
        const msg = `Not Found: ${modelNameInSentenceCase} with ID "${docId}" does not exist.`;
        return sharedResponseTypes.NOT_FOUND(req, res, {}, msg);
    }

    // 🔹 Check uniqueness constraints before updating
    for (const field of uniqueFields) {
        if (req.body[field]) {
            const conflictingDoc = await model.findOne({
                [field]: req.body[field],
            });

            if (conflictingDoc && conflictingDoc._id.toString() !== docId) {
                const msg = `Conflict: ${modelNameInSentenceCase} with ${field} "${req.body[field]}" already exists.`;
                return sharedResponseTypes.CONFLICT(req, res, {}, msg);
            }
        }
    }

    // 🔹 Perform the update operation
    await model.updateOne({ _id: docId }, req.body);

    let updatedDoc;
    if (responsePipeline) {
        // Ensure `$match` stage filters by updated document ID
        const pipeline = [...responsePipeline];

        const matchIndex = pipeline.findIndex((stage) => stage.$match);
        if (matchIndex !== -1) {
            pipeline[matchIndex].$match = {
                ...pipeline[matchIndex].$match,
                _id: docId,
            };
        } else {
            pipeline.unshift({ $match: { _id: docId } });
        }

        // Fetch the updated document using aggregation
        const result = await model.aggregate(pipeline);
        updatedDoc = result.length > 0 ? result[0] : null;
    } else {
        // Fetch the updated document with populated references
        updatedDoc = await getPopulatedDocument(docId);
    }

    if (!updatedDoc) {
        const msg = `Not Found: ${modelNameInSentenceCase} with ID "${docId}" does not exist after update.`;
        return sharedResponseTypes.NOT_FOUND(req, res, {}, msg);
    }

    const msg = `Success: ${modelNameInSentenceCase} updated with ID "${docId}".`;
    return sharedResponseTypes.OK(req, res, {}, msg, updatedDoc);
};

export default updateADocument;
