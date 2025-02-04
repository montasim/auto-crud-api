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
            req,
            res,
            {},
            `Bad Request: ${validationResult.error.errors[0].message}`
        );
    }

    // Expect a comma-separated list of IDs.
    const docIds = req.query.ids.split(',');

    // Find existing documents.
    const existingDocs = await model.find({ _id: { $in: docIds } });
    const existingDocIds = existingDocs.map((doc) => doc._id.toString());

    // Identify missing IDs
    const missingIds = docIds.filter((id) => !existingDocIds.includes(id));

    if (missingIds.length > 0) {
        return sharedResponseTypes.NOT_FOUND(
            req,
            res,
            {},
            `Not Found: The following ${sentenceCaseModelName} ${missingIds.length < 1 ? 'IDs do' : 'ID does'} not exist: ${missingIds.join(', ')}. Deletion aborted.`
        );
    }

    // Delete all matching documents.
    await model.deleteMany({ _id: { $in: docIds } });
    const msg = `Success: ${sentenceCaseModelName} with ${docIds.length < 1 ? 'IDs' : 'ID'}: ${docIds.join(', ')} deleted successfully.`;
    logger.info(msg);
    return sharedResponseTypes.OK(req, res, {}, msg);
};

export default deleteDocumentList;
