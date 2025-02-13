// convert-postman-to-swagger.mjs
import fs from 'fs';

// Read the generated Postman collection JSON file.
const postmanCollection = JSON.parse(
    fs.readFileSync('Postman_Collection.json', 'utf8')
);

// Initialize the basic structure of the OpenAPI document.
const swaggerDoc = {
    openapi: '3.0.0',
    info: {
        title: postmanCollection.info.name || 'API Documentation',
        version: '1.0.0',
        description:
            postmanCollection.info.description ||
            'Swagger API documentation generated from the Postman Collection',
    },
    servers: [
        {
            // The Postman collection uses the variable "{{SERVER_URL}}". In your Swagger file, you can do the same.
            url: '{{SERVER_URL}}',
        },
    ],
    paths: {},
};

// Helper function: Convert Postman URL format to Swagger-compliant path.
// It removes the server variable and converts any double-curly placeholders (e.g. {{user_id}})
// into Swagger’s curly braces notation (e.g. {user_id}).
const convertUrlToPath = (rawUrl) => {
    // Remove the server variable from the raw URL.
    let pathUrl = rawUrl.replace('{{SERVER_URL}}', '');
    // Convert placeholders from {{param}} to {param}.
    pathUrl = pathUrl.replace(/{{(.*?)}}/g, '{$1}');
    // Ensure the path starts with a "/".
    if (!pathUrl.startsWith('/')) {
        pathUrl = `/${pathUrl}`;
    }
    return pathUrl;
};

// Process the Postman collection folders.
// The collection structure is assumed to be:
// - A top-level array of resource folders (each with a "name" and an "item" array).
// - Each resource folder contains HTTP method folders (e.g. GET, POST, etc.).
// - Each method folder contains one or more request items.
postmanCollection.item.forEach((resourceFolder) => {
    // For each HTTP method folder under the resource
    resourceFolder.item.forEach((methodFolder) => {
        // Each request item represents an endpoint.
        methodFolder.item.forEach((requestItem) => {
            const req = requestItem.request;
            // Lower-case the method name for OpenAPI (e.g. get, post).
            const method = req.method.toLowerCase();

            // Derive the path from the Postman URL.
            const rawUrl = req.url.raw; // e.g. "{{SERVER_URL}}/users/{{user_id}}"
            const pathUrl = convertUrlToPath(rawUrl);

            // Initialize the path in the swagger document if it does not exist.
            if (!swaggerDoc.paths[pathUrl]) {
                swaggerDoc.paths[pathUrl] = {};
            }

            // Build an operation object for this endpoint.
            const operation = {
                summary: requestItem.name,
                description: `Endpoint generated from Postman request: ${requestItem.name}`,
                parameters: [],
                responses: {
                    200: {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                // In a more detailed implementation you might derive a schema
                                // from your resource schema, here we use a generic object.
                                schema: {
                                    type: 'object',
                                },
                            },
                        },
                    },
                },
            };

            // If the path has dynamic segments (e.g. {user_id}), add them as path parameters.
            const pathParamMatches = pathUrl.match(/{(.*?)}/g);
            if (pathParamMatches) {
                pathParamMatches.forEach((param) => {
                    const paramName = param.replace(/[{}]/g, '');
                    operation.parameters.push({
                        name: paramName,
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                        },
                    });
                });
            }

            // For POST and PATCH methods, include a requestBody if one is defined.
            if (
                (method === 'post' || method === 'patch') &&
                req.body &&
                req.body.raw
            ) {
                let example;
                try {
                    example = JSON.parse(req.body.raw);
                } catch (error) {
                    console.error(error);

                    example = {};
                }
                operation.requestBody = {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                            },
                            example,
                        },
                    },
                };
            }

            // Attach the operation to the swagger document under the corresponding HTTP method.
            swaggerDoc.paths[pathUrl][method] = operation;
        });
    });
});

// Write the generated Swagger document to a JSON file.
fs.writeFileSync('swagger.json', JSON.stringify(swaggerDoc, null, 2), 'utf8');
console.info('Swagger documentation generated as swagger.json');
