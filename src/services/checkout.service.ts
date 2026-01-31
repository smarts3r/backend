import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { OrderStatus } from "@prisma/client";

export interface CreateOrderData {
  shipping_address: string;
  billing_address: string;
  payment_method: string;
  notes?: string;
}

export interface CheckoutResult {
  success: boolean;
  data?: any;
  message?: string;
}

export class CheckoutService {
  async createOrderFromCart(userId: number, orderData: CreateOrderData): Promise<CheckoutResult> {
    try {
      const { shipping_address, billing_address, payment_method, notes } = orderData;

      if (!shipping_address || !billing_address || !payment_method) {
        throw new Error("Missing required order fields");
      }

      const cartItems = await prisma.cart.findMany({
        where: { user_id: userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        throw new Error("Cart is empty");
      }

      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.product.name}`);
        }
      }

      let total_amount = 0;
      const orderItemsData = cartItems.map((item) => {
        const unit_price = item.product.price;
        const subtotal = unit_price * item.quantity;
        total_amount += subtotal;

        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price,
          subtotal,
        };
      });

      const order = await prisma.order.create({
        data: {
          user_id: userId,
          total_amount,
          shipping_address,
          billing_address,
          payment_method,
          payment_status: "pending",
          status: "PENDING",
          notes,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  img: true,
                },
              },
            },
          },
        },
      });

      logger.info(`Order ${order.order_number} created for user ${userId}`);

      return {
        success: true,
        data: order,
        message: "Order created successfully",
      };
    } catch (error) {
      logger.error("[createOrderFromCart] Error:", error);
      throw error instanceof Error ? error : new Error("Failed to create order");
    }
  }

  async confirmPayment(orderNumber: string): Promise<CheckoutResult> {
    try {
      const order = await prisma.order.findUnique({
        where: { order_number: orderNumber },
        include: { orderItems: true },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.payment_status === "paid") {
        throw new Error("Order already paid");
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new Error("Cannot pay for cancelled order");
      }

      for (const item of order.orderItems) {
        const product = await prisma.product.findUnique({
          where: { id: item.product_id },
        });

        if (!product) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        await prisma.product.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const updatedOrder = await prisma.order.update({
        where: { order_number: orderNumber },
        data: {
          payment_status: "paid",
          status: "PAID" as any,
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  img: true,
                },
              },
            },
          },
        },
      });

      await prisma.cart.deleteMany({
        where: { user_id: order.user_id },
      });

      logger.info(`Payment confirmed for order ${orderNumber}`);

      return {
        success: true,
        data: updatedOrder,
        message: "Payment successful",
      };
    } catch (error) {
      logger.error("[confirmPayment] Error:", error);
      throw error instanceof Error ? error : new Error("Failed to confirm payment");
    }
  }

  async getUserOrderById(userId: number, orderId: number) {
    try {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          user_id: userId,
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  img: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      return {
        success: true,
        data: order,
      };
    } catch (error) {
      logger.error("[getUserOrderById] Error:", error);
      throw error instanceof Error ? error : new Error("Failed to fetch order");
    }
  }

  async getUserOrders(userId: number, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { user_id: userId },
          take: limit,
          skip,
          orderBy: { created_at: "desc" },
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    img: true,
                  },
                },
              },
            },
          },
        }),
        prisma.order.count({ where: { user_id: userId } }),
      ]);

      return {
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("[getUserOrders] Error:", error);
      throw new Error("Failed to fetch user orders");
    }
  }

  async cancelOrder(userId: number, orderNumber: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { order_number: orderNumber },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.user_id !== userId) {
        throw new Error("Unauthorized");
      }

      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        throw new Error("Cannot cancel this order");
      }

      const updatedOrder = await prisma.order.update({
        where: { order_number: orderNumber },
        data: {
          status: OrderStatus.CANCELLED,
          cancelled_at: new Date(),
        },
      });

      logger.info(`Order ${orderNumber} cancelled by user ${userId}`);

      return {
        success: true,
        data: updatedOrder,
        message: "Order cancelled successfully",
      };
    } catch (error) {
      logger.error("[cancelOrder] Error:", error);
      throw error instanceof Error ? error : new Error("Failed to cancel order");
    }
  }
}
