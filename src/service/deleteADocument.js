import sharedResponseTypes from '../utils/responseTypes.js';

const deleteADocument = async (
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
    const deletedDoc = await model.findByIdAndDelete(docId);
    if (!deletedDoc)
        return sharedResponseTypes.NOT_FOUND(
            req,
            res,
            {},
            `Not Found: ${modelNameInSentenceCase} with ID "${docId}" does not exist.`
        );

    const msg = `Success: ${modelNameInSentenceCase} with ID "${docId}" deleted successfully.`;
    return sharedResponseTypes.OK(req, res, {}, msg);
};

export default deleteADocument;
