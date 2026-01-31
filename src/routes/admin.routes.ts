import express, { type Request, type Response } from "express";
import multer from "multer";
import {
  bulkUpdateOrderStatus,
  exportOrders,
  getOrderById,
  getOrders,
  updateOrder,
} from "@/controllers/order.controller";
import {
  downloadTemplate,
  exportProducts,
  getDashboard,
  getStats,
  importProducts,
} from "../controllers/admin.controller";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/authMiddleware";
import {
  validatePagination,
  validateIdParam,
  validateBulkOrderUpdate,
} from "../middlewares/validationMiddleware";
import type { ImageUploadResult } from "../types/imageUploadResult.types";
import { uploadImage } from "../utils/uploadImages";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.use(authenticateToken);
router.use(authorizeRoles("ADMIN"));
/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get("/dashboard", getDashboard);

router.get("/stats", getStats);

/**
 * @swagger
 * /api/admin/csv/template:
 *   get:
 *     summary: Download product CSV template
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV template file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/csv/template", downloadTemplate);

/**
 * @swagger
 * /api/admin/csv/export:
 *   get:
 *     summary: Export all products to CSV
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/csv/export", exportProducts);

/**
 * @swagger
 * /api/admin/csv/import:
 *   post:
 *     summary: Import products from CSV
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csvFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import result
 */
router.post("/csv/import", upload.single("csvFile"), importProducts);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin, Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of orders
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
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get("/orders", validatePagination, getOrders);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Admin, Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 */
router.get("/orders/:id", validateIdParam, getOrderById);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   patch:
 *     summary: Update order status
 *     tags: [Admin, Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order updated
 */
router.patch("/orders/:id", validateIdParam, updateOrder);

/**
 * @swagger
 * /api/admin/orders/bulk-status:
 *   patch:
 *     summary: Bulk update order status
 *     tags: [Admin, Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIds
 *               - status
 *             properties:
 *               orderIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Bulk update result
 */
router.patch("/orders/bulk-status", validateBulkOrderUpdate, bulkUpdateOrderStatus);

/**
 * @swagger
 * /api/admin/orders/export:
 *   get:
 *     summary: Export orders to CSV
 *     tags: [Admin, Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/orders/export", exportOrders);

/**
 * @swagger
 * /api/admin/upload:
 *   post:
 *     summary: Upload an image
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 url:
 *                   type: string
 *                 public_id:
 *                   type: string
 */
router.post(
  "/upload",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          message: "No file uploaded",
        });
      }

      const result: ImageUploadResult | null = await uploadImage(file.buffer);

      if (!result) {
        return res.status(500).json({
          message: "Failed to upload image",
        });
      }

      return res.status(200).json({
        message: "Image uploaded successfully",
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (error: unknown) {
      console.error("[UPLOAD ERROR]:", error);

      return res.status(500).json({
        message: "Internal server error during upload",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
