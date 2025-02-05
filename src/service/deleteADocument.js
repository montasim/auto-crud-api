import contentTypes from 'content-types-lite';

import sharedResponseTypes from '../utils/responseTypes.js';

const deleteADocument = async (
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
    const docId = req.params.id;
    const deletedDoc = await model.findByIdAndDelete(docId);
    if (!deletedDoc)
        return sharedResponseTypes.NOT_FOUND(
            req,
            res,
            contentType,
            `Not Found: ${modelNameInSentenceCase} with ID "${docId}" does not exist.`
        );

    const msg = `Success: ${modelNameInSentenceCase} with ID "${docId}" deleted successfully.`;
    return sharedResponseTypes.OK(req, res, contentType, msg);
};

export default deleteADocument;
