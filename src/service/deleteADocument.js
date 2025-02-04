import sharedResponseTypes from '../utils/responseTypes.js';
import logger from '../lib/logger.js';

const deleteADocument = async (
    req,
    res,
    model,
    uniqueFields,
    sentenceCaseModelName,
    getPopulatedDoc,
    refFields
) => {
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

export default deleteADocument;
