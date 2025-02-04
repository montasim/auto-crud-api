import schema from '../lib/schema.js';
import sharedResponseTypes from '../utils/responseTypes.js';
import logger from '../lib/logger.js';

const deleteDocumentList = async (
    req,
    res,
    model,
    uniqueFields,
    sentenceCaseModelName
) => {
    // Validate the request using Zod.
    const validationResult = schema.idsSchema.safeParse(req.query);
    if (!validationResult.success) {
        return sharedResponseTypes.BAD_REQUEST(
            res,
            {},
            `Bad Request: ${validationResult.error.errors[0].message}`
        );
    }

    // Expect a comma-separated list of IDs.
    const docIds = req.query.ids.split(',');

    // Ensure that all provided IDs exist.
    const existingDocs = await model.find({ _id: { $in: docIds } });
    if (existingDocs.length !== docIds.length) {
        return sharedResponseTypes.NOT_FOUND(
            req,
            res,
            {},
            `Not Found: Some ${sentenceCaseModelName} IDs do not exist. Deletion aborted.`
        );
    }

    // Delete all matching documents.
    await model.deleteMany({ _id: { $in: docIds } });
    const msg = `Success: ${sentenceCaseModelName} with IDs: ${docIds.join(', ')} deleted successfully.`;
    logger.info(msg);
    return sharedResponseTypes.OK(req, res, {}, msg);
};

export default deleteDocumentList;
