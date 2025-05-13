const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Academic Research API',
      version: '1.0.0',
    },
  },
  apis: ['./app.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
