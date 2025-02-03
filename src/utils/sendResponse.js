const sendResponse = (res, headers, status, success, message, data, errors) =>
    res.status(status).set(headers).json({
        success,
        message,
        data,
        errors,
    });

export default sendResponse;
