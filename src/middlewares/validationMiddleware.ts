import type { NextFunction, Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { CustomError } from "./errorMiddleware";

export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return next(new CustomError(errorMessages.join(", "), 400));
  }
  next();
};

// Auth validations
export const validateRegister = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase, one uppercase, and one number",
    ),
  body("username")
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),
  body("name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Product validations
export const validateCreateProduct = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Product name must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("categoryId")
    .isInt({ min: 1 })
    .withMessage("Valid category ID is required"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  handleValidationErrors,
];

export const validateUpdateProduct = [
  param("id").isInt({ min: 1 }).withMessage("Valid product ID is required"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Product name must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Valid category ID is required"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  handleValidationErrors,
];

// Category validations
export const validateCreateCategory = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Category name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  handleValidationErrors,
];

export const validateUpdateCategory = [
  param("id").isInt({ min: 1 }).withMessage("Valid category ID is required"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Category name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  handleValidationErrors,
];

// Pagination validations
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .isIn(["name", "price", "createdAt", "updatedAt"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
  handleValidationErrors,
];

// ID parameter validation
export const validateIdParam = [
  param("id").isInt({ min: 1 }).withMessage("Valid ID is required"),
  handleValidationErrors,
];

// ! login identifier validation
export const validateLoginIdentifier = [
  body("loginIdentifier")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Login identifier is required"),
  handleValidationErrors,
];

// ! password validation
export const validatePassword = [
  body("password")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Password is required"),
  handleValidationErrors,
];

// Cart validations
export const validateAddToCart = [
  body("productId")
    .isInt({ min: 1 })
    .withMessage("Valid product ID is required"),
  body("quantity")
    .optional()
    .isInt({ min: 1, max: 99 })
    .withMessage("Quantity must be between 1 and 99"),
  handleValidationErrors,
];

export const validateUpdateCartItem = [
  param("id").isInt({ min: 1 }).withMessage("Valid cart item ID is required"),
  body("quantity")
    .isInt({ min: 0, max: 99 })
    .withMessage("Quantity must be between 0 and 99"),
  handleValidationErrors,
];

// Wishlist validations
export const validateToggleWishlist = [
  body("productId")
    .isInt({ min: 1 })
    .withMessage("Valid product ID is required"),
  handleValidationErrors,
];

// Order validations
export const validateCreateOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.productId")
    .isInt({ min: 1 })
    .withMessage("Valid product ID is required for each item"),
  body("items.*.quantity")
    .isInt({ min: 1, max: 99 })
    .withMessage("Quantity must be between 1 and 99 for each item"),
  body("shippingAddress")
    .isObject()
    .withMessage("Shipping address is required and must be an object"),
  body("phoneNumber")
    .isString()
    .isLength({ min: 8, max: 20 })
    .withMessage("Phone number must be between 8 and 20 characters"),
  body("notes")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
  handleValidationErrors,
];

export const validateConfirmDelivery = [
  param("id").isInt({ min: 1 }).withMessage("Valid order ID is required"),
  body("paymentReceived")
    .optional()
    .isBoolean()
    .withMessage("Payment received must be a boolean value"),
  handleValidationErrors,
];

// User profile validations
export const validateUpdateProfile = [
  body("username")
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),
  body("name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .isString()
    .isLength({ min: 8, max: 20 })
    .withMessage("Phone number must be between 8 and 20 characters"),
  handleValidationErrors,
];

// Bulk order update validation
export const validateBulkOrderUpdate = [
  body("orderIds")
    .isArray({ min: 1 })
    .withMessage("At least one order ID is required"),
  body("orderIds.*")
    .isInt({ min: 1 })
    .withMessage("Each order ID must be a positive integer"),
  body("status")
    .isString()
    .isIn(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .withMessage("Status must be one of: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED"),
  handleValidationErrors,
];

