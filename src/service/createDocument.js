import logger from '../lib/logger.js';
import sharedResponseTypes from '../utils/responseTypes.js';

const createDocument = async (
    req,
    res,
    model,
    uniqueFields,
    sentenceCaseModelName,
    getPopulatedDoc
) => {
    // Check for uniqueness constraints.
    for (const field of uniqueFields) {
        if (req.body[field]) {
            const existingDoc = await model.findOne({
                [field]: req.body[field],
            });
            if (existingDoc) {
                const msg = `Conflict: ${sentenceCaseModelName} with ${field} "${req.body[field]}" already exists.`;
                logger.warn(msg);
                return sharedResponseTypes.CONFLICT(req, res, {}, msg);
            }
        }
    }

    // Create the new document.
    let doc = await model.create(req.body);
    doc = await getPopulatedDoc(doc._id);

    const msg = `Success: New ${sentenceCaseModelName} created with ID "${doc._id}".`;
    logger.info(msg);
    return sharedResponseTypes.CREATED(req, res, {}, msg, doc);
};

export default createDocument;
