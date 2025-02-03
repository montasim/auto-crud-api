import { Schema } from 'mongoose';

// Define multiple schemas
const schemas = {
    users: {
        name: {
            type: String,
            required: [true, 'Name is required'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
        },
        age: {
            type: Number,
            required: [true, 'Age is required'],
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
