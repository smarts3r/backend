// routes/user.routes.ts
import { Router } from "express";
import {
    // Order controllers
    getMyOrders,
    getMyOrderById,
    createOrder,
    cancelMyOrder,
    confirmDelivery,
    getOrderSummary,

    // Product controllers
    getAvailableProducts,
    getProductById,

    // User dashboard
    getUserProfile,

    // Cart controllers
    getMyCart,
    addToCart,
    updateCartItem,
    clearCart,

    // Wishlist controllers
    getMyWishlist,
    toggleWishlist
} from "../controllers/user.controller";
import { authenticateToken } from "@/middlewares/authMiddleware";
import {
    validatePagination,
    validateIdParam,
    validateCreateOrder,
    validateAddToCart,
    validateUpdateCartItem,
    validateToggleWishlist
} from "@/middlewares/validationMiddleware";


const router = Router();


router.use(authenticateToken);


router.get("/products", validatePagination, getAvailableProducts);
router.get("/products/:id", validateIdParam, getProductById);

router.get("/orders", validatePagination, getMyOrders);
router.get("/orders/:id", validateIdParam, getMyOrderById);
router.post("/orders", validateCreateOrder, createOrder);
router.post("/orders/:id/cancel", validateIdParam, cancelMyOrder);
router.post("/orders/:id/confirm-delivery", validateIdParam, confirmDelivery);
router.get("/orders/summary", getOrderSummary);

router.get("/profile", getUserProfile);

router.get("/cart", getMyCart);
router.post("/cart", validateAddToCart, addToCart);
router.put("/cart/:id", validateIdParam, validateUpdateCartItem, updateCartItem);
router.delete("/cart", clearCart);


router.get("/wishlist", getMyWishlist);
router.post("/wishlist/toggle", validateToggleWishlist, toggleWishlist);

export default router;