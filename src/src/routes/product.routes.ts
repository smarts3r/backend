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
} from "@/middlewares/authMiddleware.ts";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);

router.post("/", authenticateToken, authorizeRoles("ADMIN"), createProduct);
router.put("/:id", authenticateToken, authorizeRoles("ADMIN"), updateProduct);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  deleteProduct,
);

export default router;
