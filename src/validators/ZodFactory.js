import { z } from 'zod';
import mongoose from 'mongoose';
import schema from '../lib/schema.js';

const { isValidObjectId, idSchema } = schema;

/**
 * Generates a Zod validation schema based on Mongoose schema and additional schema rules.
 */
const createZodSchemas = (name, schemaDefinition, schemaRules = {}) => {
    const createSchema = {};
    const updateSchema = {};

    for (const [key, value] of Object.entries(schemaDefinition)) {
        let schema;

        // Define base type mapping
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

        // Apply constraints from schema definition
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

        // Handle array fields
        if (Array.isArray(value.type)) {
            schema = z.array(z.string()).nonempty({
                message: `${key} of ${name} must be a non-empty array`,
            });
        }

        // Apply file validation if present in schemaRules
        if (schemaRules[key]) {
            const { allowedMimeType, maxFile, minSize, maxSize } =
                schemaRules[key];

            schema = z.object({
                mimetype: z
                    .string()
                    .refine((type) => allowedMimeType.includes(type), {
                        message: `${key} must be one of: ${allowedMimeType.join(', ')}`,
                    }),
                size: z
                    .number()
                    .min(minSize * 1024, {
                        message: `${key} must be at least ${minSize} KB`,
                    })
                    .max(maxSize * 1024, {
                        message: `${key} cannot exceed ${maxSize} KB`,
                    }),
                fileCount: z.number().max(maxFile, {
                    message: `Only ${maxFile} file(s) allowed for ${key}`,
                }),
            });
        }

        // Assign schemas based on method (Create, Update)
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

export default createZodSchemas;
