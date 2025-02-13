import { z } from 'zod';
import mongoose from 'mongoose';

import schema from '../lib/schema.js';

import { CriticalError } from '../lib/customErrors.js';

const { isValidObjectId, idSchema, idsSchema } = schema;

const zodSchemaFactory = (name, schemaDefinition, handler) => {
    const createSchema = {};
    const readSchema = {};
    const updateSchema = {};
    const deleteSchema = {};

    if (['createDocument', 'updateADocument'].includes(handler.name)) {
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
                schema = schema.regex(value.match[0], {
                    message: value.match[1],
                });
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
            createSchema[key] = value.required?.[0]
                ? schema
                : schema.optional();
            updateSchema[key] = schema.optional();
        }
    } else if (handler.name === 'createDummyDocuments') {
        readSchema.count = z.number();
    } else if (handler.name === 'getADocument') {
        readSchema.id = idSchema;
    } else if (handler.name === 'getDocumentsList') {
        readSchema.ids = idsSchema;
    } else if (handler.name === 'deleteADocument') {
        deleteSchema.id = idSchema;
    } else if (handler.name === 'deleteDocumentList') {
        deleteSchema.ids = idsSchema;
    } else if (handler.name === 'deleteAllDocuments') {
        // No additional schema required for deleteAllDocuments.
        // An empty object schema will be returned.
    } else {
        throw new CriticalError(`Invalid handler: ${handler.name}`);
    }

    return {
        create: z.object(createSchema).strict(),
        update: z.object(updateSchema).strict(),
        read: z.object(readSchema).strict(),
        delete: z.object(deleteSchema).strict(),
    };
};

export default zodSchemaFactory;
