import { CriticalError } from '../lib/customErrors.js';

import createMongooseModel from '../factories/mongooseModelFactory.js';
import createZodSchema from '../factories/zodSchemaFactory.js';
import crudRoutesFactory from '../factories/crudRoutesFactory.js';

import defaultRoutesRules from '../rules/defaultRoutesRules.js';
import logger from '../lib/logger.js';
import configuration from '../configuration/configuration.js';

const initializeRoutes = (app) => {
    Object.entries(configuration.routes).forEach(
        ([entityName, { schema, routes: routeConfigs }]) => {
            if (!entityName || !schema || !routeConfigs) {
                throw new CriticalError(
                    `Invalid route configuration for: ${entityName}, ${schema}, ${routeConfigs}`
                );
            }

            logger.info(`Creating routes for: ${entityName}`);

            const finalRouteConfigs =
                Array.isArray(routeConfigs) && routeConfigs.length > 0
                    ? routeConfigs
                    : defaultRoutesRules.routes;

            if (!(Array.isArray(routeConfigs) && routeConfigs.length > 0)) {
                logger.warn(
                    `No routes defined for ${entityName}. Applying default rules.`
                );
            }

            finalRouteConfigs.forEach(
                ({ paths: routePaths, method, handler, rules: routeRules }) => {
                    // Create model, Zod schema, and router once per entity
                    const model = createMongooseModel(entityName, schema);
                    const zodSchema = createZodSchema(
                        entityName,
                        schema,
                        handler
                    );

                    if (!model || !zodSchema) {
                        throw new CriticalError(
                            `Failed to create model or schema for: ${entityName}`
                        );
                    }

                    const router = crudRoutesFactory(
                        entityName,
                        model,
                        zodSchema,
                        finalRouteConfigs
                    );

                    // If no paths provided, use default path '/'
                    const finalPaths =
                        Array.isArray(routePaths) && routePaths.length > 0
                            ? routePaths
                            : ['/'];

                    if (!Array.isArray(routePaths) || routePaths.length === 0) {
                        logger.warn(
                            `No paths defined for ${entityName} with method ${method}. Using default path '/'`
                        );
                    }

                    const rules =
                        routeRules ||
                        defaultRoutesRules.routes.find(
                            (defaultRoute) => defaultRoute.method === method
                        )?.rules ||
                        {};

                    finalPaths.forEach((path) => {
                        logger.debug(
                            `Route Created: [${method.toUpperCase()}] /api/${entityName}${path}`
                        );
                    });

                    // Apply the route with default rules if not defined
                    router[method.toLowerCase()](
                        finalPaths,
                        (req, res, next) => {
                            req.rules = rules;
                            next();
                        }
                    );

                    app.use(`/api/${entityName}`, router);
                }
            );
        }
    );
};

export default initializeRoutes;
