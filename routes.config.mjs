import contentTypes from 'content-types-lite';
import mimeTypes from 'mime-types-lite';

import APP_CONSTANTS from './src/constants/constants.js';
import HTTP_METHODS from './src/constants/httpMethods.js';

import createDocument from './src/service/createDocument.js';
import createDummyDocuments from './src/service/createDummyDocuments.js';
import getDocumentsList from './src/service/getDocumentsList.js';
import getADocument from './src/service/getADocument.js';
import updateADocument from './src/service/updateADocument.js';
import deleteADocument from './src/service/deleteADocument.js';
import deleteDocumentList from './src/service/deleteDocumentList.js';
import deleteAllDocuments from './src/service/deleteAllDocuments.js';

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
            avatarUrl: {
                type: String,
            },
            email: {
                type: String,
                required: [true, 'Email is required'],
                unique: true,
                match: [APP_CONSTANTS.emailRegex, 'Invalid email format'],
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
                method: HTTP_METHODS.POST,
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
                method: HTTP_METHODS.POST,
                handler: createDummyDocuments,
                dataValidation: false,
                rules: {
                    request: {
                        contentType: contentTypes.JSON,
                        upload: {
                            avatar: {
                                multiple: true,
                                maxFiles: 10,
                                minSize: 100, // in KB
                                maxSize: 500, // in KB
                                allowedTypes: [mimeTypes.JPG, mimeTypes.PNG],
                            },
                        },
                    },
                },
            },
            {
                paths: ['/', '/all', '/list', '/read', '/show', '/view'],
                method: HTTP_METHODS.GET,
                handler: getDocumentsList,
            },
            {
                paths: ['/:id', '/read/:id', '/show/:id', '/view/:id'],
                method: HTTP_METHODS.GET,
                handler: getADocument,
            },
            {
                paths: ['/:id', '/edit/:id', '/update/:id'],
                method: HTTP_METHODS.PATCH,
                handler: updateADocument,
                rules: {
                    request: {
                        contentType: contentTypes.JSON,
                        upload: {
                            avatar: {
                                multiple: false,
                                maxFiles: 1,
                                minSize: 100, // in KB
                                maxSize: 500, // in KB
                                allowedTypes: [mimeTypes.JPG, mimeTypes.PNG],
                            },
                        },
                    },
                    response: {
                        contentType: contentTypes.JSON,
                        pipeline: [
                            { $match: {} },
                            {
                                $project: {
                                    __v: 0,
                                    createdAt: 0,
                                },
                            },
                        ],
                    },
                },
            },
            {
                paths: [
                    '/delete/all',
                    '/delete-all',
                    '/destroy/all',
                    '/destroy-all',
                ],
                method: HTTP_METHODS.DELETE,
                handler: deleteAllDocuments,
            },
            {
                paths: [
                    '/',
                    '/delete-list',
                    '/delete-by-list',
                    '/destroy-list',
                    '/destroy-by-list',
                ],
                method: HTTP_METHODS.DELETE,
                handler: deleteDocumentList,
            },
            {
                paths: ['/:id', '/delete/:id', '/destroy/:id'],
                method: HTTP_METHODS.DELETE,
                handler: deleteADocument,
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
                match: [APP_CONSTANTS.emailRegex, 'Invalid email format'],
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
                method: HTTP_METHODS.POST,
                handler: createDocument,
                rules: {
                    request: {
                        contentType: contentTypes.JSON,
                    },
                },
            },
            {
                paths: ['/', '/all', '/list'],
                method: HTTP_METHODS.GET,
                handler: getDocumentsList,
                rules: {
                    request: {},
                    response: {
                        contentType: contentTypes.JSON,
                        pipeline: [
                            { $match: {} },
                            {
                                $project: {
                                    __v: 0,
                                },
                            },
                        ],
                    },
                },
            },
            {
                paths: ['/:id'],
                method: HTTP_METHODS.GET,
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
                method: HTTP_METHODS.PATCH,
                handler: updateADocument,
                rules: {
                    request: {
                        contentType: contentTypes.JSON,
                    },
                },
            },
            {
                paths: [
                    '/delete/all',
                    '/delete-all',
                    '/destroy/all',
                    '/destroy-all',
                ],
                method: HTTP_METHODS.DELETE,
                handler: deleteAllDocuments,
            },
            {
                paths: [
                    '/',
                    '/delete-list',
                    '/delete-by-list',
                    '/destroy-list',
                    '/destroy-by-list',
                ],
                method: HTTP_METHODS.DELETE,
                handler: deleteDocumentList,
            },
            {
                paths: ['/:id'],
                method: HTTP_METHODS.DELETE,
                handler: deleteADocument,
            },
        ],
    },
};

export default routesConfig;
