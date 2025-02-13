import axios from 'axios';
import fs from 'fs';
import pkg from 'postman-collection';

import routesConfig from './routes.config.mjs';
import defaultRoutesRules from './src/rules/defaultRoutesRules.js';
import configuration from './src/configuration/configuration.js';

const { Collection } = pkg;

// Singleton instance of the Postman Collection Generator
let postmanCollectionInstance = null;

class PostmanCollectionGenerator {
    constructor() {
        if (!postmanCollectionInstance) {
            this.collection = new Collection({
                info: {
                    name: 'auto-crud-api',
                    description:
                        'A collection generated from dynamic API routes grouped by HTTP method.',
                },
            });
            postmanCollectionInstance = this;
        }
        return postmanCollectionInstance;
    }

    async generate() {
        try {
            const SERVER_URL = configuration.server.url;
            const routesInfoUrl = `${SERVER_URL}/api/routes-info`;
            const response = await axios.get(routesInfoUrl);
            const data = response.data;

            if (!data.data) {
                console.error('No route data found in the response.');
                return;
            }
            // routesData from the server is not used in this merging example.
            // You might use it to further modify your collection.
            // const routesData = data.data;

            /*
               Merge the default routes (from defaultRoutesRules.js) with the
               resource‑specific routes (from routes.config.mjs). In this example,
               every resource inherits the default routes.
            */
            const mergedRoutesConfig = {};

            // Optionally add a “default” group if you want generic routes available:
            mergedRoutesConfig.default = {
                schemaRules: defaultRoutesRules.schemaRules,
                routes: defaultRoutesRules.routes,
            };

            // For every resource defined in routes.config.mjs, merge the default routes
            // with the resource-specific ones.
            for (const resource in routesConfig) {
                mergedRoutesConfig[resource] = {
                    schema: routesConfig[resource].schema,
                    schemaRules:
                        routesConfig[resource].schemaRules ||
                        defaultRoutesRules.schemaRules,
                    routes: [
                        ...defaultRoutesRules.routes, // add generic default routes first
                        ...routesConfig[resource].routes, // then append resource-specific routes
                    ],
                };
            }

            // Generate Postman folders and requests from the merged configuration
            Object.keys(mergedRoutesConfig).forEach((resourceName) => {
                const resourceConfig = mergedRoutesConfig[resourceName];
                const resourceFolder = {
                    name: resourceName,
                    description: `Routes for ${resourceName}`,
                    item: [],
                };

                // Group routes by HTTP method
                resourceConfig.routes.forEach((route) => {
                    const httpMethod = route.method;
                    const paths = route.paths;
                    if (!httpMethod || !paths) return;

                    // Find or create a folder for the current HTTP method
                    let methodFolder = resourceFolder.item.find(
                        (folder) => folder.name === httpMethod
                    );
                    if (!methodFolder) {
                        methodFolder = {
                            name: httpMethod,
                            description: `Routes for ${httpMethod} requests for ${resourceName}`,
                            item: [],
                        };
                        resourceFolder.item.push(methodFolder);
                    }

                    // Create a Postman request item for each defined path
                    paths.forEach((path) => {
                        const parsedEndpoint = this.replaceDynamicSegments(
                            path,
                            '{{user_id}}'
                        );
                        const rawUrl = `{{SERVER_URL}}${parsedEndpoint}`;

                        const urlObject = {
                            raw: rawUrl,
                            host: ['{{SERVER_URL}}'],
                            path: parsedEndpoint
                                .split('/')
                                .filter((segment) => segment !== ''),
                        };

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

                        // For POST and PATCH requests, generate a dummy request body (if a schema exists)
                        if (['POST', 'PATCH'].includes(httpMethod)) {
                            if (
                                resourceConfig.schema &&
                                !/dummy|fake|sample/i.test(parsedEndpoint)
                            ) {
                                const dummyData = this.generateDummyData(
                                    resourceConfig.schema
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

                        methodFolder.item.push(requestItem);
                    });
                });

                this.collection.items.add(resourceFolder);
            });

            // Write the generated Postman collection to a JSON file
            const collectionJSON = this.collection.toJSON();
            const outputFileName = 'Postman_Collection.json';
            fs.writeFileSync(
                outputFileName,
                JSON.stringify(collectionJSON, null, 2)
            );
            console.info(`Postman collection generated: ${outputFileName}`);
        } catch (error) {
            console.error('Error generating Postman collection:', error);
        }
    }

    replaceDynamicSegments(url, placeholder = '1') {
        // Replace colon-prefixed dynamic segments (e.g. :id) with a placeholder value
        return url.replace(/:([a-zA-Z]+)/g, placeholder);
    }

    generateDummyData(schema) {
        // Create dummy data based on the resource schema
        const dummyData = {};
        for (const key in schema) {
            const field = schema[key];
            if (field.type === String) {
                switch (key) {
                    case 'name':
                        dummyData[key] = 'John Doe';
                        break;
                    case 'email':
                        dummyData[key] = 'john@example.com';
                        break;
                    case 'nid':
                        dummyData[key] = '1234567890';
                        break;
                    case 'phone':
                        dummyData[key] = '+8801700000000';
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
                dummyData[key] = key === 'age' ? 30 : 0;
            } else if (field.type === Boolean) {
                dummyData[key] = true;
            } else {
                dummyData[key] = null;
            }
        }
        return dummyData;
    }
}

const generator = new PostmanCollectionGenerator();
await generator.generate();
