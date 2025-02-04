import sharedResponseTypes from '../utils/responseTypes.js';
import logger from '../lib/logger.js';

const updateADocument = async (
    req,
    res,
    model,
    uniqueFields,
    sentenceCaseModelName,
    getPopulatedDoc,
    refFields
) => {
    const docId = req.params.id;

    // Check uniqueness constraints.
    for (const field of uniqueFields) {
        if (req.body[field]) {
            const existingDoc = await model.findOne({
                [field]: req.body[field],
            });
            if (existingDoc && existingDoc._id.toString() !== docId) {
                const msg = `Conflict: ${sentenceCaseModelName} with ${field} "${req.body[field]}" already exists.`;
                return sharedResponseTypes.CONFLICT(req, res, {}, msg);
            }
        }
    }

    let updatedDoc = await model.findByIdAndUpdate(docId, req.body, {
        new: true,
    });
    if (!updatedDoc)
        return sharedResponseTypes.NOT_FOUND(
            res,
            {},
            `Not Found: ${sentenceCaseModelName} with ID "${docId}" does not exist.`
        );

    updatedDoc = await getPopulatedDoc(docId);
    const msg = `Success: ${sentenceCaseModelName} updated with ID "${docId}".`;
    logger.info(msg);
    return sharedResponseTypes.OK(req, res, {}, msg, updatedDoc);
};

export default updateADocument;
