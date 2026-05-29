/**
 * config/swagger.js — Configuration Swagger / OpenAPI 3.0
 */
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MediCare BJ API',
      version: '1.0.0',
      description: 'API REST du carnet de soins numérique MediCare BJ — Bénin',
      contact: { name: 'MediCare BJ', email: 'dev@medicarebi.bj' },
    },
    servers: [
      { url: 'http://localhost:5000/api/v1', description: 'Développement' },
      { url: 'https://api.medicarebi.bj/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'MediCare BJ API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1A6B8A; }',
  }));
  app.get('/api/v1/docs.json', (req, res) => res.json(swaggerSpec));
}

module.exports = { setupSwagger };
