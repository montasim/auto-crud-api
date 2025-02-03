import httpStatus from 'http-status-lite';
import { z } from 'zod';
import mongoose from 'mongoose';

export const ZodError = z.ZodError;
export const mongooseError = mongoose.Error;

export class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
        this.status = httpStatus.BAD_REQUEST;
    }
}

export class BadRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BadRequestError';
        this.status = httpStatus.BAD_REQUEST;
    }
}

export class CryptoError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CryptoError';
        this.status = httpStatus.INTERNAL_SERVER_ERROR;
    }
}

export class UnsupportedContentTypeError extends Error {
    constructor(contentType) {
        super(`Unsupported Content-Type: ${contentType}`);
        this.name = 'UnsupportedContentTypeError';
        this.contentType = contentType;
        this.status = httpStatus.UNSUPPORTED_MEDIA_TYPE;
    }
}
