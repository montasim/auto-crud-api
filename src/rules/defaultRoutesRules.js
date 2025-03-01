import contentTypes from 'content-types-lite';

import HTTP_METHODS from '../constants/httpMethods.js';

const defaultRequestContentType = contentTypes.JSON;
const defaultResponseContentType = contentTypes.JSON;

const defaultRoutesRules = {
    schemaRules: {},
    routes: [
        {
            paths: ['/', '/create', '/add', '/new', '/insert'],
            method: HTTP_METHODS.POST,
            rules: {
                request: {
                    contentType: defaultRequestContentType,
                },
                response: {
                    contentType: defaultResponseContentType,
                    pipeline: [],
                },
            },
        },
        {
            paths: [
                '/create/dummy',
                '/add/dummy',
                '/new/dummy',
                '/insert/dummy',
                '/create-fake',
                '/add-fake',
                '/new-fake',
                '/insert-fake',
                '/create-mock',
                '/add-mock',
                '/new-mock',
                '/insert-mock',
                '/create-test',
                '/add-test',
                '/new-test',
                '/insert-test',
            ],
            method: HTTP_METHODS.POST,
            rules: {
                request: {
                    contentType: defaultRequestContentType,
                },
                response: {
                    contentType: defaultResponseContentType,
                    pipeline: [],
                },
            },
        },
        {
            paths: [
                '/',
                '/list',
                '/all',
                '/find',
                '/get',
                '/read',
                '/fetch',
                '/retrieve',
                '/search',
                '/query',
            ],
            method: HTTP_METHODS.GET,
            rules: {
                request: {
                    contentType: 'undefined',
                },
                response: {
                    contentType: defaultResponseContentType,
                    pipeline: [],
                },
            },
        },
        {
            paths: [
                '/:id',
                '/find-by-id/:id',
                '/get-by-id/:id',
                '/read-by-id/:id',
                '/fetch-by-id/:id',
                '/retrieve-by-id/:id',
                '/search-by-id/:id',
                '/query-by-id/:id',
            ],
            method: HTTP_METHODS.GET,
            rules: {
                request: {
                    contentType: 'undefined',
                },
                response: {
                    contentType: defaultResponseContentType,
                    pipeline: [],
                },
            },
        },
        {
            paths: [
                '/:id',
                '/update/:id',
                '/edit/:id',
                '/modify/:id',
                '/change/:id',
                '/patch/:id',
                '/put/:id',
                '/replace/:id',
                '/set/:id',
                '/save/:id',
                '/store/:id',
            ],
            method: HTTP_METHODS.PATCH,
            rules: {
                request: {
                    contentType: defaultRequestContentType,
                },
                response: {
                    contentType: defaultResponseContentType,
                    pipeline: [],
                },
            },
        },
        {
            paths: [
                '/:id',
                '/delete/:id',
                '/remove/:id',
                '/destroy/:id',
                '/erase/:id',
                '/trash/:id',
                '/unstore/:id',
                '/unsave/:id',
                '/unset/:id',
                '/unpatch/:id',
                '/unmodify/:id',
                '/unedit/:id',
                '/unupdate/:id',
            ],
            method: HTTP_METHODS.DELETE,
            rules: {
                request: {
                    contentType: 'undefined',
                },
                response: {
                    contentType: defaultResponseContentType,
                    pipeline: [],
                },
            },
        },
        {
            paths: [
                '/',
                '/delete-list',
                '/delete-by-list',
                '/destroy-list',
                '/destroy-by-list',
                '/remove-list',
                '/remove-by-list',
                '/erase-list',
                '/erase-by-list',
                '/trash-list',
                '/trash-by-list',
                '/unstore-list',
                '/unstore-by-list',
                '/unsave-list',
                '/unsave-by-list',
                '/unset-list',
                '/unset-by-list',
                '/unpatch-list',
                '/unpatch-by-list',
                '/unmodify-list',
                '/unmodify-by-list',
            ],
            method: HTTP_METHODS.DELETE,
            rules: {
                request: {
                    contentType: 'undefined',
                },
                response: {
                    contentType: defaultResponseContentType,
                    pipeline: [],
                },
            },
        },
        // ✅ Default Route
        {
            paths: ['*'], // Matches all undefined routes
            method: HTTP_METHODS.ALL,
            rules: {
                request: {
                    contentType: defaultRequestContentType,
                },
                response: {
                    contentType: defaultResponseContentType,
                    pipeline: [],
                },
            },
        },
    ],
};

export default defaultRoutesRules;
