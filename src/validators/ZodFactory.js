import { z } from 'zod';
import mongoose from 'mongoose';

import schema from '../lib/schema.js';

const { isValidObjectId, idSchema } = schema;

const buildZodSchemas = (name, schemaDefinition, routes) => {
    const createSchema = {};
    const updateSchema = {};

    for (const [key, value] of Object.entries(schemaDefinition)) {
        let schema;

        // Define common data type mappings
        const typeMap = {
            [String]: z.string(),
            [Number]: z.number(),
            [Boolean]: z.boolean(),
            [Date]: z.date(),
            [mongoose.Schema.Types.ObjectId]: z
                .string()
                .refine(isValidObjectId, {
                    message: `${key} of ${name} must be a valid MongoDB ObjectId`,
                }),
        };

        // Assign base schema type
        schema = typeMap[value.type] || z.any();

        // Apply additional validations
        if (value.match)
            schema = schema.regex(value.match[0], { message: value.match[1] });
        if (value.minlength)
            schema = schema.min(value.minlength[0], {
                message: value.minlength[1],
            });
        if (value.maxlength)
            schema = schema.max(value.maxlength[0], {
                message: value.maxlength[1],
            });
        if (value.min)
            schema = schema.min(value.min[0], { message: value.min[1] });
        if (value.max)
            schema = schema.max(value.max[0], { message: value.max[1] });

        // Handle arrays separately
        if (Array.isArray(value.type)) {
            schema = z.array(z.string()).nonempty({
                message: `${key} of ${name} must be a non-empty array`,
            });
        }

        // Assign schemas based on method
        createSchema[key] = value.required?.[0] ? schema : schema.optional();
        updateSchema[key] = schema.optional();
    }

    return {
        create: z.object(createSchema).strict(),
        update: z.object(updateSchema).strict(),
        read: z
            .object({ id: idSchema, ...updateSchema })
            .strict()
            .partial(),
        delete: z.object({ id: idSchema }).strict().partial(),
    };
};

export default buildZodSchemas;
