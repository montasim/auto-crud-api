class AppError extends Error {
    constructor(message, statusCode = 500, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ZodValidationError extends AppError {
    constructor(errors) {
        super('Validation failed', 400, {
            validationErrors: errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }
}

class MongooseValidationError extends AppError {
    constructor(errors) {
        super('Database validation failed', 400, {
            validationErrors: Object.values(errors).map((e) => ({
                field: e.path,
                message: e.message,
            })),
        });
    }
}

class DuplicateKeyError extends AppError {
    constructor(field, value) {
        super(`Duplicate value error: ${field} already exists`, 409, {
            field,
            value,
        });
    }
}

class InvalidObjectIdError extends AppError {
    constructor(path, value) {
        super(`Invalid ${path}: ${value}`, 400);
    }
}

export {
    AppError,
    ZodValidationError,
    MongooseValidationError,
    DuplicateKeyError,
    InvalidObjectIdError,
};
