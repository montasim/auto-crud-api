import httpStatus from 'http-status-lite';

const validate = (schemas) => (req, res, next) => {
    let schema;

    switch (req.method) {
        case 'POST':
            schema = schemas.create;
            break;
        case 'PUT':
            schema = schemas.update;
            break;
        case 'GET':
            schema = schemas.read;
            break;
        case 'DELETE':
            schema = schemas.delete;
            break;
        default:
            return next(); // No validation needed
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'Validation failed',
            errors: result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }

    next();
};

export default validate;
