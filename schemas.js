import { Schema } from 'mongoose';

import constants from './src/constants/constants.js';

// Define multiple schemas
const schemas = {
    users: {
        name: {
            type: String,
            required: [true, 'Name is required'],
            match: [
                /^[A-Za-z\s]{3,50}$/,
                'Name must be between 3 and 50 characters and contain only letters and spaces',
            ],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            match: [constants.emailRegex, 'Invalid email format'],
        },
        nid: {
            type: String,
            unique: true,
            match: [/^\d{10,17}$/, 'NID must be between 10 and 17 digits'],
        },
        phone: {
            type: String,
            unique: true,
            match: [
                /^\+?(88)?01[3-9]\d{8}$/,
                'Phone number must be a valid Bangladeshi number (+880 or 01)',
            ],
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
            match: [
                /^[A-Za-z0-9\s.,!?'-]{10,500}$/,
                'Bio must be between 10 and 500 characters and contain valid characters',
            ],
        },
        portfolio: {
            type: String,
            validate: {
                validator(v) {
                    return /^https?:\/\/(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+\/?.*$/.test(
                        v
                    );
                },
                message: 'Portfolio must be a valid URL',
            },
        },
        age: {
            type: Number,
            required: [true, 'Age is required'],
            min: [18, 'Age must be at least 18'],
            max: [120, 'Age must be below 120'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },

    products: {
        name: {
            type: String,
            required: [true, 'Product name is required'],
        },
        price: {
            type: Number,
            required: [true, 'Product price is required'],
        },
        stock: {
            type: Number,
            required: [true, 'Stock quantity is required'],
        },
        category: {
            type: String,
        },
    },

    orders: {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: [true, 'User ID is required'],
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'products',
            required: [true, 'Product ID is required'],
        },
        quantity: {
            type: Number,
            required: [true, 'Order quantity is required'],
        },
        total: {
            type: Number,
            required: [true, 'Total amount is required'],
        },
    },
};

export default schemas;
