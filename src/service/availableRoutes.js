import contentTypes from 'content-types-lite';

import configuration from '../configuration/configuration.js';
import sharedResponseTypes from '../utils/responseTypes.js';

const availableRoutes = (req, res) => {
    // Create an object to group routes by base name and then by HTTP method.
    const groupedRoutes = {};

    // Iterate over each route group defined in the configuration.
    Object.entries(configuration.routes).forEach(([name, routeConfig]) => {
        // Initialize the group for the current route name as an empty object.
        groupedRoutes[name] = {};

        // Get the array of route definitions from the configuration.
        let routes = routeConfig.routes;
        if (!Array.isArray(routes) || routes.length === 0) {
            // Optionally, you can fall back to default routes if needed.
            routes = [];
        }

        // For each route definition, group each available path by HTTP method.
        routes.forEach((route) => {
            // Determine the HTTP method; default to 'ALL' if not defined.
            const method = route.method ? route.method.toUpperCase() : 'ALL';
            // If no paths are defined, default to ['/'].
            const paths =
                route.paths && route.paths.length > 0 ? route.paths : ['/'];

            paths.forEach((path) => {
                // If the method group doesn't exist yet, initialize it as an array.
                if (!groupedRoutes[name][method]) {
                    groupedRoutes[name][method] = [];
                }
                // Combine the base name and the path, e.g. '/api/user' + '/custom'.
                groupedRoutes[name][method].push(`/api/${name}${path}`);
            });
        });
    });

    // Return the compiled, grouped list of routes as JSON.
    return sharedResponseTypes.OK(req, res, contentTypes.JSON, groupedRoutes);
};

export default availableRoutes;
