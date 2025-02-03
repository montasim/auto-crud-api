import { z } from 'zod';
import mongoose from 'mongoose';

const createZodSchemas = (name, schemaDefinition) => {
    const createSchema = {};
    const updateSchema = {};
    const readSchema = {
        id: z
            .string()
            .refine((val) => mongoose.Types.ObjectId.isValid(val), {
                message: 'ID must be a valid MongoDB ObjectId',
            })
            .optional(),
    };
    const deleteSchema = {
        id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: 'ID must be a valid MongoDB ObjectId',
        }),
    };

    for (const [key, value] of Object.entries(schemaDefinition)) {
        let schema;

        if (value.type === String) {
            schema = z.string({
                required_error: value.required
                    ? value.required[1]
                    : `${key} of ${name} must be a string`,
            });

            if (value.match) {
                schema = schema.regex(value.match[0], {
                    message: value.match[1],
                });
            }

            if (value.minlength) {
                schema = schema.min(value.minlength[0], {
                    message: value.minlength[1],
                });
            }

            if (value.maxlength) {
                schema = schema.max(value.maxlength[0], {
                    message: value.maxlength[1],
                });
            }
        } else if (value.type === Number) {
            schema = z.number({
                required_error: value.required
                    ? value.required[1]
                    : `${key} of ${name} must be a number`,
            });

            if (value.min) {
                schema = schema.min(value.min[0], { message: value.min[1] });
            }

            if (value.max) {
                schema = schema.max(value.max[0], { message: value.max[1] });
            }
        } else if (value.type === Boolean) {
            schema = z.boolean({
                required_error: value.required
                    ? value.required[1]
                    : `${key} of ${name} must be a boolean`,
            });
        } else if (value.type === Date) {
            schema = z.date({
                required_error: value.required
                    ? value.required[1]
                    : `${key} of ${name} must be a valid date`,
            });
        } else if (Array.isArray(value.type)) {
            schema = z.array(z.string(), {
                required_error: `${key} of ${name} must be an array of strings`,
            });
        } else if (value.type === mongoose.Schema.Types.ObjectId) {
            schema = z
                .string()
                .refine((val) => mongoose.Types.ObjectId.isValid(val), {
                    message: `${key} of ${name} must be a valid MongoDB ObjectId`,
                });
        } else {
            schema = z.any();
        }

        // Apply validation based on method:
        if (value.required && value.required[0]) {
            createSchema[key] = schema; // Required in Create
        } else {
            createSchema[key] = schema.optional(); // Optional in Create
        }

        updateSchema[key] = schema.optional(); // Optional in Update
        readSchema[key] = schema.optional(); // Optional in Read
    }

    return {
        create: z.object(createSchema).strict(),
        update: z.object(updateSchema).strict(),
        read: z.object(readSchema).strict(),
        delete: z.object(deleteSchema).strict(),
    };
};

export default createZodSchemas;
