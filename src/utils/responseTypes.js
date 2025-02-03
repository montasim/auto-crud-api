import httpStatus from 'http-status-lite';

import sendResponse from './sendResponse.js';

const CREATED = (res, headers = {}, message, data = {}) =>
    sendResponse(res, headers, httpStatus.CREATED, true, message, data);

const OK = (res, headers = {}, message, data = {}) =>
    sendResponse(res, headers, httpStatus.OK, true, message, data);

const NOT_FOUND = (res, headers = {}, message) =>
    sendResponse(res, headers, httpStatus.NOT_FOUND, false, message, {});

const CONFLICT = (res, headers = {}, message) =>
    sendResponse(res, headers, httpStatus.CONFLICT, false, message, {});

const sharedResponseTypes = {
    CREATED,
    OK,
    NOT_FOUND,
    CONFLICT,
};

export default sharedResponseTypes;
