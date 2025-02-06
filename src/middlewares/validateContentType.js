import responseTypes from '../utils/responseTypes.js';

const validateContentType = (req, res, next, expectedContentType) => {
    const contentType = req.headers['content-type'];

    if (!contentType) {
        return responseTypes.UNSUPPORTED_MEDIA_TYPE(
            req,
            res,
            expectedContentType,
            'Content-Type header is missing.'
        );
    }

    if (!contentType.includes(expectedContentType)) {
        return responseTypes.UNSUPPORTED_MEDIA_TYPE(
            req,
            res,
            expectedContentType,
            `Unsupported Media Type. Expected Content-Type: ${expectedContentType}`
        );
    }

    next();
};

export default validateContentType;
