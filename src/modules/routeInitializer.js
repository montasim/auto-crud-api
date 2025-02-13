import { CriticalError } from '../lib/customErrors.js';

import createMongooseModel from '../models/SchemaFactory.js';
import createZodSchema from '../validators/ZodFactory.js';
import buildCrudRoutes from '../routes/CrudFactory.js';

import defaultRoutesRules from '../rules/defaultRoutesRules.js';
import HTTP_METHODS from '../constants/httpMethods.js';
import logger from '../lib/logger.js';
import configuration from '../configuration/configuration.js';

const initializeRoutes = (app) => {
    Object.entries(configuration.routes).forEach(
        ([name, { schema, routes }]) => {
            if (!name || !schema || !routes) {
                throw new CriticalError(
                    `Invalid route configuration for: ${name}, ${schema}, ${routes}`
                );
            }

            logger.info(`Creating routes for: ${name}`);

            if (!Array.isArray(routes) || routes.length === 0) {
                logger.warn(
                    `No routes defined for ${name}. Applying default rules.`
                );
                routes = defaultRoutesRules.routes; // Apply default rules if not defined
            }

            const model = createMongooseModel(name, schema);
            const zodSchema = createZodSchema(name, schema, routes);

            if (!model || !zodSchema) {
                throw new CriticalError(
                    `Failed to create model or schema for: ${name}`
                );
            }

            const router = buildCrudRoutes(name, model, zodSchema, routes);

            routes.forEach((route) => {
                const paths =
                    route.paths && route.paths.length > 0 ? route.paths : ['/'];
                const method = route.method || HTTP_METHODS.ALL;
                const rules =
                    route.rules ||
                    defaultRoutesRules.routes.find(
                        (defaultRoute) => defaultRoute.method === method
                    )?.rules ||
                    {};

                if (!route.paths || route.paths.length === 0) {
                    logger.warn(
                        `No paths defined for ${name} with method ${method}. Using default path '/'`
                    );
                }

                paths.forEach((path) => {
                    logger.debug(
                        `Route Created: [${method.toUpperCase()}] /api/${name}${path}`
                    );
                });

                // Apply the route with default rules if not defined
                router[method.toLowerCase()](paths, (req, res, next) => {
                    req.rules = rules;
                    next();
                });
            });

            app.use(`/api/${name}`, router);
        }
    );
};

export default initializeRoutes;
