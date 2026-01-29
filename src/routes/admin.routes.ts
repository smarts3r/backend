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
router.get("/dashboard", getDashboard);
router.get("/csv/template", downloadTemplate);
router.get("/csv/export", exportProducts);
router.post("/csv/import", upload.single("csvFile"), importProducts);
router.get("/orders", validatePagination, getOrders);
router.get("/orders/:id", validateIdParam, getOrderById);
router.patch("/orders/:id", validateIdParam, updateOrder);
router.patch("/orders/bulk-status", validateBulkOrderUpdate, bulkUpdateOrderStatus);
router.get("/orders/export", exportOrders);

// ! upload image
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
