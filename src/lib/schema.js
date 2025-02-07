import { z } from 'zod';
import { Schema, Types } from 'mongoose';

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

const stringField = (fieldName = '', isRequired = false, unique = false) => ({
    type: String,
    ...(isRequired && { required: [isRequired, `${fieldName} is required.`] }),
    trim: true,
    ...(unique && { unique: true }),
});

const stringEnumField = (
    fieldName = '',
    isRequired = false,
    unique = false,
    allowedOptions = []
) => ({
    ...stringField(fieldName, isRequired, unique),
    enum: {
        values: allowedOptions,
        message: `${fieldName} must be one of the following: ${allowedOptions.join(', ')}`,
    },
});

const refField = (refModel, fieldName, required = false) => ({
    type: Schema.Types.ObjectId,
    ref: refModel,
    ...(required && { required: [true, `${fieldName} is required`] }),
});

const dateField = (fieldName = '', isRequired = false) => ({
    type: Date,
    ...(isRequired && { required: [true, `${fieldName} is required.`] }),
});

const booleanField = (fieldName = '', defaultValue = false) => ({
    type: Boolean,
    default: defaultValue,
});

const numberField = (
    fieldName = '',
    isRequired = false,
    defaultValue = 0,
    minValue = 0,
    customValidation = null
) => ({
    type: Number,
    ...(isRequired && { required: [true, `${fieldName} is required.`] }),
    default: defaultValue,
    min: [
        minValue,
        `${fieldName} must be greater than or equal to ${minValue}.`,
    ],
    ...(customValidation && { validate: customValidation }),
});

const passwordField = (
    fieldName = '',
    isRequired = false,
    minValue = 8,
    maxValue = 200,
    customValidation = {
        validator(value) {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value);
        },
        message:
            'Password must contain an uppercase letter, lowercase letter, number, and special character',
    }
) => ({
    ...stringField(fieldName, isRequired),
    minlength: [minValue, `Password must be at least ${minValue} characters`],
    maxLength: [maxValue, `Password can not exceed ${maxValue} characters`],
    validate: customValidation,
});

const fileSchema = (fieldName = '') =>
    new Schema({
        id: stringField(`${fieldName} ID`, true),
        link: stringField(`${fieldName} link`, true),
    });

const fileWithNameSchema = (fieldName = '') =>
    new Schema({
        name: stringField(`${fieldName} name`, true),
        ...fileSchema,
    });

const linkWithNameSchema = (fieldName = '') =>
    new Schema({
        name: stringField(`${fieldName} name`, true),
        link: stringField(`${fieldName} link`, true),
    });

const addressSchema = (fieldName = '') =>
    new Schema({
        village: stringField(`${fieldName} Village`, true),
        postOffice: stringField(`${fieldName} Post Office`, true),
        subdistrict: stringField(`${fieldName} Sub District`, true),
        district: stringField(`${fieldName} District`, true),
    });

const schema = {
    isValidObjectId,
    idBaseSchema,
    idSchema,
    idsSchema,
    stringField,
    stringEnumField,
    refField,
    dateField,
    booleanField,
    numberField,
    passwordField,

    fileSchema,
    fileWithNameSchema,
    linkWithNameSchema,
    addressSchema,
};

export default schema;
