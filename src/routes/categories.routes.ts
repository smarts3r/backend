import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/controllers/category.controller";
import {
  authenticateToken,
  authorizeRoles,
} from "@/middlewares/authMiddleware";
import {
  validateCreateCategory,
  validateIdParam,
  validatePagination,
  validateUpdateCategory,
} from "@/middlewares/validationMiddleware";

const router = Router();

router.get("/", validatePagination, getCategories);

router.post("/", authenticateToken, authorizeRoles("ADMIN"), validateCreateCategory, createCategory);
router.put("/:id", authenticateToken, authorizeRoles("ADMIN"), validateIdParam, validateUpdateCategory, updateCategory);
router.delete("/:id", authenticateToken, authorizeRoles("ADMIN"), validateIdParam, deleteCategory);

export default router;
