import { Request, Response, NextFunction } from "express";
import { CartService } from "../services/cart.service";
import { CheckoutService } from "../services/checkout.service";
import { PaymentService, PaymentRequest } from "../services/payment.service";

const cartService = new CartService();
const checkoutService = new CheckoutService();
const paymentService = new PaymentService();

export const getCart = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await cartService.getCart(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await cartService.addToCart(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const result = await cartService.updateCartItem(req.user.id, Number(id), req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const result = await cartService.removeFromCart(req.user.id, Number(id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await cartService.clearCart(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCartCount = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await cartService.getCartCount(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await checkoutService.createOrderFromCart(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { page = "1", limit = "20" } = req.query;
    const result = await checkoutService.getUserOrders(req.user.id, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserOrderById = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const result = await checkoutService.getUserOrderById(req.user.id, Number(id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orderNumber = Array.isArray(req.params.orderNumber) ? req.params.orderNumber[0] : req.params.orderNumber;
    const result = await checkoutService.cancelOrder(req.user.id, orderNumber);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const processPayment = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { orderNumber, paymentMethod, cardNumber, expiryDate, cvv, forceSuccess } = req.body;

    const validation = paymentService.validatePaymentDetails({
      orderNumber,
      amount: 0,
      paymentMethod,
      cardNumber,
      expiryDate,
      cvv,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment details",
        errors: validation.errors,
      });
    }

    const paymentRequest: PaymentRequest = {
      orderNumber,
      amount: 0,
      paymentMethod,
      cardNumber,
      expiryDate,
      cvv,
    };

    const paymentResult = await paymentService.processPaymentWithSuccess(paymentRequest, forceSuccess);

    if (!paymentResult.success) {
      return res.status(400).json(paymentResult);
    }

    const orderUpdateResult = await checkoutService.confirmPayment(orderNumber);
    res.json(orderUpdateResult);
  } catch (error) {
    next(error);
  }
};
