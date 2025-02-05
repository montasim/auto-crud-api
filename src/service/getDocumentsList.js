import sharedResponseTypes from '../utils/responseTypes.js';

const getDocumentsList = async (
    req,
    res,
    model,
    uniqueFields,
    modelNameInSentenceCase,
    getPopulatedDocument,
    referenceFields,
    responsePipeline
) => {
    // Destructure pagination, sorting, and filters from query parameters
    const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;
    const parsedPage = Math.max(1, Number(page)); // Ensure page is at least 1
    const parsedLimit = Math.max(1, Number(limit)); // Ensure limit is at least 1

    // 🔹 Detect invalid query parameters
    const invalidKeys = Object.keys(filters).filter((key) =>
        key.startsWith('?')
    );
    if (invalidKeys.length > 0) {
        const msg = `Bad Request: Invalid query parameter(s) detected: ${invalidKeys.join(', ')}.`;
        return sharedResponseTypes.BAD_REQUEST(req, res, {}, msg);
    }

    // 🔹 Build a filter query including only valid non-empty filter values
    const filterQuery = {};
    Object.keys(filters).forEach((key) => {
        if (filters[key] !== '') {
            filterQuery[key] = filters[key];
        }
    });

    // Convert filter values to numbers for numeric fields
    Object.keys(filterQuery).forEach((key) => {
        const schemaPath = model.schema.paths[key];
        if (schemaPath && schemaPath.instance === 'Number') {
            filterQuery[key] = Number(filterQuery[key]);
        }
    });

    let docs = [];
    let totalCount = 0;

    if (responsePipeline) {
        // 🔹 Optimize aggregation pipeline to include pagination & sorting
        const pipeline = [...responsePipeline];

        // Ensure existing `$match` stage includes filters
        const matchIndex = pipeline.findIndex((stage) => stage.$match);
        if (matchIndex !== -1) {
            pipeline[matchIndex].$match = {
                ...pipeline[matchIndex].$match,
                ...filterQuery,
            };
        } else {
            pipeline.unshift({ $match: filterQuery });
        }

        // Sorting stage (if applicable)
        if (sort) {
            const sortObj = {};
            sort.split(',').forEach((field) => {
                const order = field.startsWith('-') ? -1 : 1;
                sortObj[field.replace('-', '')] = order;
            });
            pipeline.push({ $sort: sortObj });
        }

        // Pagination stage
        pipeline.push(
            { $skip: (parsedPage - 1) * parsedLimit },
            { $limit: parsedLimit }
        );

        // Count stage (optional)
        pipeline.push({
            $facet: {
                data: pipeline,
                totalCount: [{ $count: 'count' }],
            },
        });

        // Execute aggregation pipeline
        const result = await model.aggregate(pipeline);
        docs = result[0]?.data || [];
        totalCount = result[0]?.totalCount?.[0]?.count || 0;
    } else {
        // 🔹 Query the database with filtering, sorting, pagination
        docs = await model
            .find(filterQuery)
            .populate(referenceFields)
            .sort(sort)
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit);

        // Get the total count of documents matching the filter conditions
        totalCount = await model.countDocuments(filterQuery);
    }

    if (!docs.length) {
        const msg = `Not Found: No ${modelNameInSentenceCase}s exist with the given filters.`;
        return sharedResponseTypes.NOT_FOUND(req, res, {}, msg);
    }

    // 🔹 Build a filter condition string for logging
    const conditionStr = Object.keys(filterQuery).length
        ? JSON.stringify(filterQuery)
        : 'No filters applied';

    const msg = `Success: ${totalCount} ${modelNameInSentenceCase}${totalCount !== 1 ? 's' : ''} fetched with filters: ${conditionStr}, sorted by '${sort}', page ${parsedPage}, and limit ${parsedLimit}.`;
    // Return both the total count and the documents
    return sharedResponseTypes.OK(req, res, {}, msg, docs, totalCount);
};

export default getDocumentsList;
