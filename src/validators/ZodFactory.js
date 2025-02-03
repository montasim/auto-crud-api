import { z } from 'zod';
import mongoose from 'mongoose';

const createZodSchemas = (name, schemaDefinition) => {
    const createSchema = {};
    const updateSchema = {};
    const readSchema = {};
    const deleteSchema = {
        id: z.string().regex(/^[a-fA-F0-9]{24}$/, {
            message: `${name} ID must be a valid MongoDB ObjectId`,
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
        } else if (value.type === Number) {
            schema = z.number({
                required_error: value.required
                    ? value.required[1]
                    : `${key} of ${name} must be a number`,
            });
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
            schema = z.string().regex(/^[a-fA-F0-9]{24}$/, {
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
