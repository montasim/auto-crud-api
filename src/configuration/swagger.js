const swaggerConfiguration = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Auto CRUD API',
            version: '1.0.0',
        },
    },
    apis: ['./routes/*.js'],
};

export default swaggerConfiguration;
