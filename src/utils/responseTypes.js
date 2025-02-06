import httpStatus from 'http-status-lite';

import sendResponse from './sendResponse.js';

const CREATED = (req, res, contentType = {}, message, data = {}) =>
    sendResponse(
        req,
        res,
        contentType,
        httpStatus.CREATED,
        true,
        message,
        data,
        {},
        {}
    );

const OK = (req, res, contentType = {}, message, data = {}, pagination = {}) =>
    sendResponse(
        req,
        res,
        contentType,
        httpStatus.OK,
        true,
        message,
        data,
        pagination,
        {}
    );

const NOT_FOUND = (req, res, contentType = {}, message) =>
    sendResponse(
        req,
        res,
        contentType,
        httpStatus.NOT_FOUND,
        false,
        message,
        {},
        {},
        {}
    );

const CONFLICT = (req, res, contentType = {}, message) =>
    sendResponse(
        req,
        res,
        contentType,
        httpStatus.CONFLICT,
        false,
        message,
        {},
        {},
        {}
    );

const BAD_REQUEST = (req, res, contentType = {}, message) =>
    sendResponse(
        req,
        res,
        contentType,
        httpStatus.BAD_REQUEST,
        false,
        message,
        {},
        {},
        {}
    );

const INTERNAL_SERVER_ERROR = (req, res, contentType = {}, message) =>
    sendResponse(
        req,
        res,
        contentType,
        httpStatus.INTERNAL_SERVER_ERROR,
        false,
        message,
        {},
        {},
        {}
    );

const UNSUPPORTED_MEDIA_TYPE = (req, res, contentType = {}, message) =>
    sendResponse(
        req,
        res,
        contentType,
        httpStatus.UNSUPPORTED_MEDIA_TYPE,
        false,
        message,
        {},
        {},
        {}
    );

const responseTypes = {
    CREATED,
    OK,
    NOT_FOUND,
    CONFLICT,
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    UNSUPPORTED_MEDIA_TYPE,
};

export default responseTypes;
