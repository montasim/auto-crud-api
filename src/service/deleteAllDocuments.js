import contentTypes from 'content-types-lite';

import sharedResponseTypes from '../utils/responseTypes.js';

const deleteAllDocuments = async (
    req,
    res,
    model,
    uniqueFields,
    modelNameInSentenceCase,
    getPopulatedDocument,
    referenceFields,
    rules
) => {
    const contentType = rules?.response?.contentType || contentTypes.JSON;

    // Retrieve existing documents
    const existingDocuments = await model.find();
    if (!existingDocuments.length) {
        return sharedResponseTypes.NOT_FOUND(
            req,
            res,
            contentType,
            `Not Found: No ${modelNameInSentenceCase} found.`
        );
    }

    // Delete all documents and check the deletion result
    const deletionResult = await model.deleteMany();
    if (
        !deletionResult ||
        deletionResult.deletedCount !== existingDocuments.length
    ) {
        return sharedResponseTypes.INTERNAL_SERVER_ERROR(
            req,
            res,
            contentType,
            `Error: Failed to delete all ${modelNameInSentenceCase}.`
        );
    }

    const message = `Success: ${modelNameInSentenceCase} deleted successfully.`;
    return sharedResponseTypes.OK(req, res, contentType, message);
};

export default deleteAllDocuments;
