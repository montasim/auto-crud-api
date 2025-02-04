import sharedResponseTypes from '../utils/responseTypes.js';
import logger from '../lib/logger.js';

const getADocument = async (
    req,
    res,
    model,
    uniqueFields,
    sentenceCaseModelName,
    getPopulatedDoc,
    refFields
) => {
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

export default getADocument;
