import responseTypes from '../utils/responseTypes.js';

const validateRequestBody = (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        const contentType = req.headers['content-type'];
        return responseTypes.BAD_REQUEST(
            req,
            res,
            {},
            `Request body cannot be empty for ${contentType} content type.`
        );
    }

    next();
};

export default validateRequestBody;
