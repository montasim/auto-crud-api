import httpStatus from 'http-status-lite';

import sendResponse from './sendResponse.js';

const CREATED = (req, res, headers = {}, message, data = {}) =>
    sendResponse(
        req,
        res,
        headers,
        httpStatus.CREATED,
        true,
        message,
        data,
        {},
        {}
    );

const OK = (req, res, headers = {}, message, data = {}, pagination = {}) =>
    sendResponse(
        req,
        res,
        headers,
        httpStatus.OK,
        true,
        message,
        data,
        pagination,
        {}
    );

const NOT_FOUND = (req, res, headers = {}, message) =>
    sendResponse(
        req,
        res,
        headers,
        httpStatus.NOT_FOUND,
        false,
        message,
        {},
        {},
        {}
    );

const CONFLICT = (req, res, headers = {}, message) =>
    sendResponse(
        req,
        res,
        headers,
        httpStatus.CONFLICT,
        false,
        message,
        {},
        {},
        {}
    );

const BAD_REQUEST = (req, res, headers = {}, message) =>
    sendResponse(
        req,
        res,
        headers,
        httpStatus.BAD_REQUEST,
        false,
        message,
        {},
        {},
        {}
    );

const INTERNAL_SERVER_ERROR = (req, res, headers = {}, message) =>
    sendResponse(
        req,
        res,
        headers,
        httpStatus.INTERNAL_SERVER_ERROR,
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
};

export default responseTypes;
