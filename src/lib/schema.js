import { z } from 'zod';
import { Types } from 'mongoose';

// Reusable validation function for MongoDB ObjectIds
const isValidObjectId = (val) => Types.ObjectId.isValid(val);

// Schema for a single ObjectId
const idSchema = z.string().refine(isValidObjectId, {
    message: 'ID must be a valid MongoDB ObjectId',
});

// Base schema for objects that require an ID
const idBaseSchema = z.object({ id: idSchema });

// Schema for multiple ObjectIds (accepts both comma-separated string & array)
const idsSchema = z.object({
    ids: z.preprocess(
        (val) => (typeof val === 'string' ? val.split(',') : val),
        z.array(idSchema).nonempty({ message: 'At least one ID is required' })
    ),
});

const schema = { isValidObjectId, idBaseSchema, idSchema, idsSchema };

export default schema;
