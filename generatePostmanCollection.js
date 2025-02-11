import axios from 'axios';
import fs from 'fs';
import pkg from 'postman-collection';

import routesConfig from './routes.config.mjs';
import configuration from './src/configuration/configuration.js';

const { Collection } = pkg;

// Set your SERVER_URL (you can also set this via an environment variable)
const SERVER_URL = configuration.server.url;

// The API endpoint that provides the dynamic routes info
const routesInfoUrl = `${SERVER_URL}/api/routes-info`;

// Function to replace dynamic URL parameters (like :id) with a placeholder value (here, "1")
const replaceDynamicSegments = (url, placeholder = '1') =>
    url.replace(/:([a-zA-Z]+)/g, placeholder);

/**
 * Helper function to generate dummy data based on a Mongoose-like schema.
 * This function inspects the field name and type and returns a sample value.
 */
function generateDummyData(schema) {
    const dummyData = {};
    for (const key in schema) {
        const field = schema[key];
        if (field.type === String) {
            switch (key) {
                case 'name':
                    dummyData[key] = 'John Doe';
                    break;
                case 'email':
                    dummyData[key] = 'john@example20.com';
                    break;
                case 'nid':
                    dummyData[key] = '1234567890'; // 10-digit sample
                    break;
                case 'phone':
                    dummyData[key] = '+8801700000000'; // dummy Bangladeshi number
                    break;
                case 'bio':
                    dummyData[key] = 'This is a sample bio.';
                    break;
                case 'portfolio':
                    dummyData[key] = 'http://example.com';
                    break;
                case 'avatarUrl':
                    dummyData[key] = 'http://example.com/avatar.png';
                    break;
                default:
                    dummyData[key] = 'sample text';
            }
        } else if (field.type === Number) {
            if (key === 'age') {
                dummyData[key] = 30;
            } else {
                dummyData[key] = 0;
            }
        } else if (field.type === Boolean) {
            dummyData[key] = true;
        } else {
            dummyData[key] = null;
        }
    }
    return dummyData;
}

const generatePostmanCollection = async () => {
    try {
        // Fetch the dynamic routes from your API
        const response = await axios.get(routesInfoUrl);
        const data = response.data;

        if (!data.data) {
            console.error('No route data found in the response.');
            return;
        }

        const routesData = data.data;

        // Create a new Postman Collection
        const collection = new Collection({
            info: {
                name: 'auto-crud-api',
                description:
                    'A collection generated from dynamic API routes grouped by HTTP method.',
            },
        });

        // Iterate over each resource group (e.g. "users", "admins")
        Object.keys(routesData).forEach((resourceName) => {
            const resourceRoutes = routesData[resourceName];

            // Create a folder for the resource
            const resourceFolder = {
                name: resourceName,
                description: `Dynamic routes for ${resourceName}`,
                item: [], // This folder will contain sub-folders for each HTTP method.
            };

            // Iterate over each HTTP method (POST, GET, PATCH, DELETE, etc.)
            Object.keys(resourceRoutes).forEach((httpMethod) => {
                // Create a sub-folder for the HTTP method within this resource
                const methodFolder = {
                    name: httpMethod,
                    description: `Routes for ${httpMethod} requests for ${resourceName}`,
                    item: [],
                };

                const endpoints = resourceRoutes[httpMethod];

                endpoints.forEach((endpoint) => {
                    // Replace dynamic segments (e.g., ":id") with a placeholder value ("1")
                    const parsedEndpoint = replaceDynamicSegments(
                        endpoint,
                        '{{user_id}}'
                    );

                    // Build the URL string. We use the Postman variable for the server URL.
                    // For example: '{{SERVER_URL}}/api/users/'
                    const rawUrl = `{{SERVER_URL}}${parsedEndpoint}`;

                    // Build a URL object that uses the variable placeholder.
                    // (We avoid parsing with new URL() so that the variable remains intact.)
                    const urlObject = {
                        raw: rawUrl,
                        // For display purposes, we set "host" to the variable string.
                        host: '{{SERVER_URL}}',
                        // Set the path by removing the base URL from the full URL.
                        path: parsedEndpoint
                            .split('/')
                            .filter((segment) => segment !== ''),
                    };

                    // Create a request item for the collection
                    const requestItem = {
                        name: `${httpMethod} ${parsedEndpoint}`,
                        request: {
                            method: httpMethod,
                            header: [
                                {
                                    key: 'Content-Type',
                                    value: 'application/json',
                                },
                            ],
                            url: urlObject,
                        },
                    };

                    // For methods that require a request body, add dummy data if applicable.
                    // Here we generate dummy data only for routes that are not for dummy creation
                    // (i.e. those whose endpoint does not include "dummy", "fake", or "sample")
                    if (['POST', 'PATCH'].includes(httpMethod)) {
                        if (
                            routesConfig[resourceName] &&
                            routesConfig[resourceName].schema &&
                            !/dummy|fake|sample/i.test(parsedEndpoint)
                        ) {
                            const dummyData = generateDummyData(
                                routesConfig[resourceName].schema
                            );
                            requestItem.request.body = {
                                mode: 'raw',
                                raw: JSON.stringify(dummyData, null, 2),
                                options: {
                                    raw: {
                                        language: 'json',
                                    },
                                },
                            };
                        } else {
                            // For routes that are meant for dummy creation or non-JSON data, leave an empty JSON object.
                            requestItem.request.body = {
                                mode: 'raw',
                                raw: '{}',
                                options: {
                                    raw: {
                                        language: 'json',
                                    },
                                },
                            };
                        }
                    }

                    // Add the request item to the HTTP method folder
                    methodFolder.item.push(requestItem);
                });

                // Add the HTTP method folder to the resource folder
                resourceFolder.item.push(methodFolder);
            });

            // Add the resource folder to the collection
            collection.items.add(resourceFolder);
        });

        // Convert the collection to JSON and write it to a file
        const collectionJSON = collection.toJSON();
        const outputFileName = 'Postman_Collection.json';
        fs.writeFileSync(
            outputFileName,
            JSON.stringify(collectionJSON, null, 2)
        );

        console.log(`Postman collection generated: ${outputFileName}`);
    } catch (error) {
        console.error('Error fetching dynamic routes:', error);
    }
};

// Run the collection generation
generatePostmanCollection();
