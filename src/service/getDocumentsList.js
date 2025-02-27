import contentTypes from 'content-types-lite';

import sharedResponseTypes from '../utils/responseTypes.js';

const getDocumentsList = async (
    req,
    res,
    model,
    uniqueFields,
    modelNameInSentenceCase,
    getPopulatedDocument,
    referenceFields,
    rules
) => {
    const responsePipeline = rules?.response?.pipeline || [];
    const contentType = rules?.response?.contentType || contentTypes.JSON;

    // 🔹 Extract pagination, sorting, and filters from query parameters
    const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;
    const parsedPage = Math.max(1, Number(page));
    const parsedLimit = Math.max(1, Number(limit));

    // 🔹 Validate query parameters to prevent errors
    const invalidKeys = Object.keys(filters).filter((key) =>
        key.startsWith('?')
    );
    if (invalidKeys.length > 0) {
        return sharedResponseTypes.BAD_REQUEST(
            req,
            res,
            contentType,
            `Bad Request: Invalid query parameter(s): ${invalidKeys.join(', ')}.`
        );
    }

    // 🔹 Build a valid filter query
    const filterQuery = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
    );

    // Convert numeric filters to proper number types
    for (const key in filterQuery) {
        const schemaPath = model.schema.paths[key];
        if (schemaPath?.instance === 'Number') {
            filterQuery[key] = Number(filterQuery[key]);
        }
    }

    let docs = [],
        totalCount = 0;

    if (responsePipeline.length) {
        // ✅ Clone the pipeline to avoid modifying the original reference
        const pipeline = JSON.parse(JSON.stringify(responsePipeline));

        // ✅ Ensure a `$match` stage exists or add one
        const matchStage = pipeline.find((stage) => stage.$match);
        if (matchStage) {
            Object.assign(matchStage.$match, filterQuery);
        } else {
            pipeline.unshift({ $match: filterQuery });
        }

        // ✅ Add sorting
        if (sort) {
            const sortObj = sort.split(',').reduce((acc, field) => {
                acc[field.replace('-', '')] = field.startsWith('-') ? -1 : 1;
                return acc;
            }, {});
            pipeline.push({ $sort: sortObj });
        }

        // ✅ Apply pagination
        pipeline.push(
            { $skip: (parsedPage - 1) * parsedLimit },
            { $limit: parsedLimit }
        );

        // ✅ Separate pipeline for total count (avoids modifying original pipeline)
        const totalCountPipeline = [...pipeline, { $count: 'totalCount' }];

        // ✅ Execute both pipelines concurrently
        const [docsResult, totalCountResult] = await Promise.all([
            model.aggregate(pipeline),
            model.aggregate(totalCountPipeline),
        ]);

        docs = docsResult;
        totalCount = totalCountResult?.[0]?.totalCount || 0;
    } else {
        // ✅ Standard MongoDB query for non-aggregated cases
        docs = await model
            .find(filterQuery)
            .populate(referenceFields)
            .sort(sort)
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit);

        totalCount = await model.countDocuments(filterQuery);
    }

    const searchFilters = Object.keys(filterQuery).length
        ? JSON.stringify(filterQuery)
        : 'None';
    // ✅ Handle no results found
    if (!docs.length) {
        return sharedResponseTypes.NOT_FOUND(
            req,
            res,
            contentType,
            `Not Found: No ${modelNameInSentenceCase}s exist with the given filters: ${searchFilters}.`
        );
    }

    // ✅ Log success message
    const totalPages = Math.ceil(totalCount / parsedLimit);
    const msg = `Success: ${totalCount} ${modelNameInSentenceCase}${totalCount !== 1 ? 's' : ''} found with filters: ${searchFilters}, sorted by '${sort}', page ${parsedPage} of ${totalPages}, limit ${parsedLimit}.`;

    totalCount = {
        total: totalCount,
        totalPages,
        currentPage: page,
    };

    return sharedResponseTypes.OK(req, res, contentType, msg, docs, totalCount);
};

export default getDocumentsList;
