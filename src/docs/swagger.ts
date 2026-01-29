import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

export const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartS3R Backend API',
      version: '1.0.0',
      description: 'A high-performance Express API backend with TypeScript, Prisma, Swagger, Zod, and Winston',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
      {
        url: `https://api.smarts3r.com`,
        description: 'Production server',
      },
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
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Something went wrong',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email format',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/docs/*.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
  const swaggerUIOptions = {
    explorer: true,
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUIOptions));

  app.get('/', (_req, res) => {
    res.redirect('/api-docs/');
  });

  return specs;
};

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Single product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - price
 *         - category_id
 *         - img
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the product
 *           example: 1
 *         name:
 *           type: string
 *           description: Product name
 *           example: "Wireless Headphones"
 *         price:
 *           type: number
 *           description: Product price
 *           example: 99.99
 *         old_price:
 *           type: number
 *           description: Original price (optional)
 *           example: 129.99
 *         category_id:
 *           type: integer
 *           description: Category ID
 *           example: 1
 *         img:
 *           type: string
 *           description: Image URL
 *           example: "https://example.com/image.jpg"
 *         stock:
 *           type: integer
 *           description: Available stock
 *           example: 10
 *         description:
 *           type: string
 *           description: Product description
 *           example: "High-quality wireless headphones with noise cancellation"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2023-01-01T00:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2023-01-01T00:00:00.000Z"
 *     CreateProductInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category_id
 *         - img
 *       properties:
 *         name:
 *           type: string
 *           description: Product name
 *           example: "Wireless Headphones"
 *         price:
 *           type: number
 *           description: Product price
 *           example: 99.99
 *         old_price:
 *           type: number
 *           description: Original price (optional)
 *           example: 129.99
 *         category_id:
 *           type: integer
 *           description: Category ID
 *           example: 1
 *         img:
 *           type: string
 *           description: Image URL
 *           example: "https://example.com/image.jpg"
 *         stock:
 *           type: integer
 *           description: Available stock (defaults to 10)
 *           example: 10
 *         description:
 *           type: string
 *           description: Product description (defaults to name)
 *           example: "High-quality wireless headphones with noise cancellation"
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 10
 */