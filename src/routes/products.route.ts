import { Router, Request, Response } from 'express';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware';
import { schemas } from '../validators';
import { logger } from '../utils/logger';
import { ProductService } from '../services/product.service';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();
const productService = new ProductService();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', validateQuery(schemas.paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, sortBy, sortOrder } = req.query as {
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const products = await productService.getAllProducts(pageNum, limitNum, sortBy || 'id', sortOrder || 'asc');

    res.json({
      success: true,
      data: products.data,
      pagination: products.pagination,
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
    });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
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
 *       404:
 *         description: Product not found
 */
router.get('/:id', validateParams(schemas.productIdSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(Array.isArray(id) ? id[0] : id, 10);

    const product = await productService.getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
    });
  }
});

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
 */
router.post('/', authenticateToken, authorizeRoles("ADMIN"), validateBody(schemas.createProductSchema), async (req: Request, res: Response) => {
  try {
    const productData = req.body;

    const newProduct = await productService.createProduct(productData);

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
    });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Wireless Headphones"
 *               price:
 *                 type: number
 *                 example: 89.99
 *               old_price:
 *                 type: number
 *                 example: 119.99
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               img:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               stock:
 *                 type: integer
 *                 example: 15
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 */
router.put('/:id',
  authenticateToken,
  authorizeRoles("ADMIN"),
  validateParams(schemas.productIdSchema),
  validateBody(schemas.updateProductSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const productId = parseInt(Array.isArray(id) ? id[0] : id, 10);
      const productData = req.body;

      const updatedProduct = await productService.updateProduct(productId, productData);

      res.json({
        success: true,
        data: updatedProduct,
      });
    } catch (error) {
      logger.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating product',
      });
    }
  });

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
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
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product deleted successfully"
 */
router.delete('/:id', authenticateToken, authorizeRoles("ADMIN"), validateParams(schemas.productIdSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(Array.isArray(id) ? id[0] : id, 10);

    await productService.deleteProduct(productId);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
    });
  }
});

export default router;