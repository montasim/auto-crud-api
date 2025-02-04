import httpStatus from 'http-status-lite';

class AppError extends Error {
    constructor(
        message,
        statusCode = httpStatus.INTERNAL_SERVER_ERROR,
        details = {}
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ZodValidationError extends AppError {
    constructor(errors) {
        super('Validation failed', httpStatus.BAD_REQUEST, {
            validationErrors: errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }
}

class MongooseValidationError extends AppError {
    constructor(errors) {
        super('Database validation failed', httpStatus.BAD_REQUEST, {
            validationErrors: Object.values(errors).map((e) => ({
                field: e.path,
                message: e.message,
            })),
        });
    }
}

class DuplicateKeyError extends AppError {
    constructor(field, value) {
        super(
            `Duplicate value error: ${field} already exists`,
            httpStatus.CONFLICT,
            {
                field,
                value,
            }
        );
    }
}

class InvalidObjectIdError extends AppError {
    constructor(path, value) {
        super(`Invalid ${path}: ${value}`, httpStatus.BAD_REQUEST);
    }
}

class CriticalError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CriticalError';
    }
}

class EnvironmentVariableError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EnvironmentVariableError';
    }
}

class ConfigurationError extends Error {
    constructor(
        message,
        statusCode = httpStatus.INTERNAL_SERVER_ERROR,
        details = {}
    ) {
        super(message);
        this.name = 'ConfigurationError';
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export {
    AppError,
    ZodValidationError,
    MongooseValidationError,
    DuplicateKeyError,
    InvalidObjectIdError,
    CriticalError,
    EnvironmentVariableError,
    ConfigurationError,
};
