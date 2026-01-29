import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "@/controllers/product.controller.ts";
import {
  authenticateToken,
  authorizeRoles,
} from "@/middlewares/authMiddleware";
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateIdParam,
  validatePagination,
} from "@/middlewares/validationMiddleware";

const router = express.Router();

router.get("/", validatePagination, getAllProducts);
router.get("/:id", validateIdParam, getProductById);

router.post("/", authenticateToken, authorizeRoles("ADMIN"), validateCreateProduct, createProduct);
router.put("/:id", authenticateToken, authorizeRoles("ADMIN"), validateUpdateProduct, updateProduct);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  validateIdParam,
  deleteProduct,
);

export default router;
