import { Schema, Types } from 'mongoose';
import contentTypes from 'content-types-lite';

import constants from './src/constants/constants.js';
import httpMethods from './src/constants/httpMethods.js';

import createDocument from './src/service/createDocument.js';
import createDummyDocuments from './src/service/createDummyDocuments.js';
import getDocumentsList from './src/service/getDocumentsList.js';
import getADocument from './src/service/getADocument.js';
import updateADocument from './src/service/updateADocument.js';
import deleteADocument from './src/service/deleteADocument.js';
import deleteDocumentList from './src/service/deleteDocumentList.js';

const routesConfig = {
    users: {
        schema: {
            name: {
                type: String,
                required: [true, 'Name is required'],
                match: [
                    /^[A-Za-z\s]{3,50}$/,
                    'Name must be between 3 and 50 characters and contain only letters and spaces',
                ],
                minlength: [3, 'Name must be at least 3 characters'],
                maxlength: [50, 'Name cannot exceed 50 characters'],
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
                minlength: [10, 'NID must be at least 10 digits'],
                maxlength: [17, 'NID cannot exceed 17 digits'],
            },
            phone: {
                type: String,
                unique: true,
                match: [
                    /^\+?(88)?01[3-9]\d{8}$/,
                    'Phone number must be a valid Bangladeshi number (+880 or 01XXXXXXXXX)',
                ],
                minlength: [11, 'Phone number must be at least 11 digits'],
                maxlength: [14, 'Phone number cannot exceed 14 digits'],
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
                match: [
                    /^https?:\/\/(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+\/?.*$/,
                    'Portfolio must be a valid URL',
                ],
                minlength: [10, 'Portfolio must be at least 10 characters'],
                maxlength: [100, 'Portfolio cannot exceed 100 characters'],
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
        routes: [
            {
                paths: ['/', '/create', '/new'],
                method: httpMethods.POST,
                handler: createDocument,
            },
            {
                paths: [
                    '/create/dummy',
                    '/create-dummy',
                    '/create-dummy-data',
                    '/create-fake',
                    '/create-fake-data',
                    '/create-sample',
                    '/create-sample-data',
                    '/generate-sample',
                    '/generate-sample-data',
                ],
                method: httpMethods.POST,
                handler: createDummyDocuments,
                dataValidation: false,
            },
            {
                paths: ['/', '/all', '/list', '/read', '/show', '/view'],
                method: httpMethods.GET,
                handler: getDocumentsList,
            },
            {
                paths: ['/:id', '/read/:id', '/show/:id', '/view/:id'],
                method: httpMethods.GET,
                handler: getADocument,
            },
            {
                paths: ['/:id', '/edit/:id', '/update/:id'],
                method: httpMethods.PATCH,
                handler: updateADocument,
            },
            {
                paths: ['/:id', '/delete/:id', '/destroy/:id'],
                method: httpMethods.DELETE,
                handler: deleteADocument,
            },
            {
                paths: [
                    '/',
                    '/delete-list',
                    '/delete-by-list',
                    '/destroy-list',
                    '/destroy-by-list',
                ],
                method: httpMethods.DELETE,
                handler: deleteDocumentList,
            },
        ],
    },

    admins: {
        schema: {
            name: {
                type: String,
                required: [true, 'Name is required'],
                match: [
                    /^[A-Za-z\s]{3,50}$/,
                    'Name must be between 3 and 50 characters and contain only letters and spaces',
                ],
                minlength: [3, 'Name must be at least 3 characters'],
                maxlength: [50, 'Name cannot exceed 50 characters'],
            },
            email: {
                type: String,
                required: [true, 'Email is required'],
                unique: true,
                match: [constants.emailRegex, 'Invalid email format'],
            },
            isActive: {
                type: Boolean,
                default: true,
            },
        },
        schemaRules: {},
        routes: [
            {
                paths: ['/'],
                method: httpMethods.POST,
                handler: createDocument,
                rules: {
                    request: {
                        contentType: contentTypes.JSON,
                    },
                },
            },
            {
                paths: ['/', '/all', '/list'],
                method: httpMethods.GET,
                handler: getDocumentsList,
                rules: {
                    request: {},
                    response: {
                        contentType: contentTypes.JSON,
                        pipeline: [],
                    },
                },
            },
            {
                paths: ['/:id'],
                method: httpMethods.GET,
                handler: getADocument,
                responsePipeline: [
                    { $match: {} },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
            },
            {
                paths: ['/:id'],
                method: httpMethods.PATCH,
                handler: updateADocument,
                rules: {
                    request: {
                        contentType: contentTypes.JSON,
                    },
                },
            },
            {
                paths: ['/:id'],
                method: httpMethods.DELETE,
                handler: deleteADocument,
            },
            {
                paths: [
                    '/',
                    '/delete-list',
                    '/delete-by-list',
                    '/destroy-list',
                    '/destroy-by-list',
                ],
                method: httpMethods.DELETE,
                handler: deleteDocumentList,
            },
        ],
    },

    adminsNew: {
        schema: {
            name: {
                type: String,
                required: [true, 'Name is required'],
                match: [
                    /^[A-Za-z\s]{3,50}$/,
                    'Name must be between 3 and 50 characters and contain only letters and spaces',
                ],
                minlength: [3, 'Name must be at least 3 characters'],
                maxlength: [50, 'Name cannot exceed 50 characters'],
            },
            image: {
                id: {
                    type: String,
                },
                link: {
                    type: String,
                },
            },
            email: {
                type: String,
                required: [true, 'Email is required'],
                unique: true,
                match: [constants.emailRegex, 'Invalid email format'],
            },
            isActive: {
                type: Boolean,
                default: true,
            },
        },
        schemaRules: {
            image: {
                allowedMimeType: ['image/jpeg', 'image/png'],
                minSize: 100, // 100 KB
                maxSize: 1024, // 1 MB
            },
        },
        routes: [
            {
                paths: ['/'],
                method: httpMethods.POST,
                handler: createDocument,
                rules: {
                    request: {
                        contentType: contentTypes.JSON,
                    },
                    response: {
                        contentType: contentTypes.JSON,
                        pipeline: [],
                    },
                },
            },
            {
                paths: ['/', '/all', '/list'],
                method: httpMethods.GET,
                handler: getDocumentsList,
                rules: {
                    request: {},
                    response: {
                        contentType: contentTypes.JSON,
                        pipeline: [{ $match: { isActive: false } }],
                    },
                },
            },
            {
                paths: ['/:id'],
                method: httpMethods.GET,
                handler: getADocument,
                responsePipeline: [
                    { $match: {} },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
            },
            {
                paths: ['/:id'],
                method: httpMethods.PATCH,
                handler: updateADocument,
            },
            {
                paths: ['/:id'],
                method: httpMethods.DELETE,
                handler: deleteADocument,
            },
            {
                paths: [
                    '/',
                    '/delete-list',
                    '/delete-by-list',
                    '/destroy-list',
                    '/destroy-by-list',
                ],
                method: httpMethods.DELETE,
                handler: deleteDocumentList,
            },
        ],
    },

    products: {
        schema: {
            name: {
                type: String,
                required: [true, 'Product name is required'],
                minlength: [3, 'Product name must be at least 3 characters'],
                maxlength: [100, 'Product name cannot exceed 100 characters'],
                match: [
                    /^[A-Za-z0-9\s\-,.&()]{3,100}$/,
                    'Product name must be between 3 and 100 characters and contain only valid characters',
                ],
            },
            price: {
                type: Number,
                required: [true, 'Product price is required'],
                min: [0, 'Price cannot be negative'],
                max: [1000000, 'Price cannot exceed 1,000,000'],
            },
            stock: {
                type: Number,
                required: [true, 'Stock quantity is required'],
                min: [0, 'Stock quantity cannot be negative'],
                max: [100000, 'Stock quantity cannot exceed 100,000'],
            },
            category: {
                type: String,
                required: [true, 'Category is required'],
                match: [
                    /^[A-Za-z\s-]{3,50}$/,
                    'Category must be between 3 and 50 characters and contain only letters and spaces',
                ],
            },
        },
        routes: [
            {
                paths: ['/', '/create', '/new'],
                method: httpMethods.POST,
                handler: createDocument,
            },
            {
                paths: ['/', '/all', '/list', '/read', '/show', '/view'],
                method: httpMethods.GET,
                handler: getDocumentsList,
            },
            {
                paths: ['/:id', '/read/:id', '/show/:id', '/view/:id'],
                method: httpMethods.GET,
                handler: getADocument,
            },
            {
                paths: ['/:id', '/edit/:id', '/update/:id'],
                method: httpMethods.PATCH,
                handler: updateADocument,
            },
            {
                paths: ['/:id', '/delete/:id', '/destroy/:id'],
                method: httpMethods.DELETE,
                handler: deleteADocument,
            },
            {
                paths: [
                    '/',
                    '/delete-list',
                    '/delete-by-list',
                    '/destroy-list',
                    '/destroy-by-list',
                ],
                method: httpMethods.DELETE,
                handler: deleteDocumentList,
            },
        ],
    },

    orders: {
        schema: {
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'users',
                required: [true, 'User ID is required'],
                validate: {
                    validator(v) {
                        return Types.ObjectId.isValid(v);
                    },
                    message: 'Invalid User ID format',
                },
            },
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'products',
                required: [true, 'Product ID is required'],
                validate: {
                    validator(v) {
                        return Types.ObjectId.isValid(v);
                    },
                    message: 'Invalid Product ID format',
                },
            },
            quantity: {
                type: Number,
                required: [true, 'Order quantity is required'],
                min: [1, 'Order quantity must be at least 1'],
                max: [1000, 'Order quantity cannot exceed 1000'],
            },
            total: {
                type: Number,
                required: [true, 'Total amount is required'],
                min: [1, 'Total amount must be at least 1'],
            },
        },
        routes: [
            {
                paths: ['/', '/create', '/new'],
                method: httpMethods.POST,
                handler: createDocument,
            },
            {
                paths: ['/', '/all', '/list', '/read', '/show', '/view'],
                method: httpMethods.GET,
                handler: getDocumentsList,
            },
            {
                paths: ['/:id', '/read/:id', '/show/:id', '/view/:id'],
                method: httpMethods.GET,
                handler: getADocument,
            },
            {
                paths: ['/:id', '/edit/:id', '/update/:id'],
                method: httpMethods.PATCH,
                handler: updateADocument,
            },
            {
                paths: ['/:id', '/delete/:id', '/destroy/:id'],
                method: httpMethods.DELETE,
                handler: deleteADocument,
            },
            {
                paths: [
                    '/',
                    '/delete-list',
                    '/delete-by-list',
                    '/destroy-list',
                    '/destroy-by-list',
                ],
                method: httpMethods.DELETE,
                handler: deleteDocumentList,
            },
        ],
    },
};

export default routesConfig;
