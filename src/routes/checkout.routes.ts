import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { body } from "express-validator";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  createOrder,
  getUserOrders,
  getUserOrderById,
  cancelOrder,
  processPayment,
} from "../controllers/checkout.controller";

const router = Router();

router.use(authenticateToken);

const validateAddToCart = [
  body("product_id").isInt().withMessage("Valid product ID is required"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

const validateUpdateCartItem = [
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

const validateCreateOrder = [
  body("shipping_address").notEmpty().withMessage("Shipping address is required"),
  body("billing_address").notEmpty().withMessage("Billing address is required"),
  body("payment_method")
    .isIn(["card", "cash_on_delivery", "bank_transfer"])
    .withMessage("Valid payment method is required"),
  body("notes").optional().isString(),
];

const validatePayment = [
  body("orderNumber").notEmpty().withMessage("Order number is required"),
  body("payment_method")
    .isIn(["card", "cash_on_delivery", "bank_transfer"])
    .withMessage("Valid payment method is required"),
  body("cardNumber").optional().isString(),
  body("expiryDate").optional().isString(),
  body("cvv").optional().isString().isLength({ min: 3, max: 4 }),
];

router.get("/cart", getCart);
router.post("/cart", validateAddToCart, addToCart);
router.put("/cart/:id", validateUpdateCartItem, updateCartItem);
router.delete("/cart/:id", removeFromCart);
router.delete("/cart", clearCart);
router.get("/cart/count", getCartCount);

router.post("/orders", validateCreateOrder, createOrder);
router.get("/orders", getUserOrders);
router.get("/orders/:id", getUserOrderById);
router.post("/orders/:orderNumber/cancel", cancelOrder);
router.post("/payments/checkout", validatePayment, processPayment);

export default router;
