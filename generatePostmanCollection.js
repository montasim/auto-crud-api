import axios from 'axios';
import fs from 'fs';
import pkg from 'postman-collection';

const { Collection } = pkg;

// Set your SERVER_URL (you can also set this via an environment variable)
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

// The API endpoint that provides the dynamic routes info
const routesInfoUrl = `${SERVER_URL}/api/routes-info`;

// Function to replace dynamic URL parameters (like :id) with placeholder values
const replaceDynamicSegments = (url, placeholder = '1') =>
    url.replace(/:([a-zA-Z]+)/g, placeholder);

const generatePostmanCollection = async () => {
    try {
        // Fetch the dynamic routes from the API
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

        // Iterate over each resource group (e.g., "users", "admins")
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
                    // Replace dynamic segments (e.g., ":id") with a placeholder value (here, "1")
                    const parsedEndpoint = replaceDynamicSegments(
                        endpoint,
                        '1'
                    );

                    // Construct the full URL
                    const fullUrl = `${SERVER_URL}${parsedEndpoint}`;

                    // Use Node's URL class to parse the full URL and build a proper URL object for Postman.
                    const urlInstance = new URL(fullUrl);
                    const urlObject = {
                        raw: `{{SERVER_URL}}${parsedEndpoint}`,
                        // protocol: urlInstance.protocol.replace(':', ''),
                        host: `{{SERVER_URL}}`,
                        // port: urlInstance.port,
                        // Split the pathname into segments, filtering out any empty segments.
                        path: urlInstance.pathname
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

                    // For methods that require a body, add a dummy JSON payload
                    if (['POST', 'PATCH'].includes(httpMethod)) {
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

                    // Add the request to the HTTP method folder
                    methodFolder.item.push(requestItem);
                });

                // Add the method folder to the resource folder
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
