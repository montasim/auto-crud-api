import logger from '../lib/logger.js';
import sharedResponseTypes from '../utils/responseTypes.js';

const getDocumentsList = async (
    req,
    res,
    model,
    uniqueFields,
    sentenceCaseModelName,
    getPopulatedDoc,
    refFields
) => {
    // Destructure pagination and sorting parameters, and capture the rest as filters.
    const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;

    // Detect invalid keys (e.g., keys that start with '?').
    const invalidKeys = Object.keys(filters).filter((key) =>
        key.startsWith('?')
    );
    if (invalidKeys.length > 0) {
        const msg = `Bad Request: Invalid query parameter(s) detected: ${invalidKeys.join(', ')}.`;
        logger.warn(msg);
        return sharedResponseTypes.BAD_REQUEST(req, res, {}, msg);
    }

    // Build a filter query by including only non-empty filter values.
    const filterQuery = {};
    Object.keys(filters).forEach((key) => {
        if (filters[key] !== '') {
            filterQuery[key] = filters[key];
        }
    });

    // Convert filter values to numbers for numeric fields.
    Object.keys(filterQuery).forEach((key) => {
        const schemaPath = model.schema.paths[key];
        if (schemaPath && schemaPath.instance === 'Number') {
            filterQuery[key] = Number(filterQuery[key]);
        }
    });

    // Execute the query with filtering, sorting, and pagination.
    const docs = await model
        .find(filterQuery)
        .populate(refFields) // Dynamically populate referenced fields.
        .sort(sort)
        .skip((page - 1) * Number(limit))
        .limit(Number(limit));
    if (!docs.length)
        return sharedResponseTypes.NOT_FOUND(
            res,
            {},
            `Not Found: no ${sentenceCaseModelName} exist right now.`
        );

    // Get the total count of documents matching the filter conditions (without pagination).
    const totalCount = docs?.length;

    // Build a condition string for the response message.
    const conditionStr = Object.keys(filterQuery).length
        ? JSON.stringify(filterQuery)
        : 'No filters applied';

    const msg = `Success: ${totalCount} ${sentenceCaseModelName}${totalCount !== 1 ? 's' : ''} fetched with filters: ${conditionStr}, sorted by '${sort}', page ${page}, and limit ${limit}.`;
    logger.info(msg);

    // Return both the total count and the documents.
    return sharedResponseTypes.OK(req, res, {}, msg, docs, totalCount);
};

export default getDocumentsList;
