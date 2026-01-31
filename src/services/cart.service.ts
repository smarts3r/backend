import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

export interface AddToCartData {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

export class CartService {
  async getCart(userId: number) {
    try {
      const cartItems = await prisma.cart.findMany({
        where: { user_id: userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              old_price: true,
              img: true,
              stock: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      const total = cartItems.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0);

      return {
        success: true,
        data: cartItems,
        total,
        itemCount: cartItems.length,
      };
    } catch (error) {
      logger.error("[getCart] Error:", error);
      throw new Error("Failed to fetch cart");
    }
  }

  async addToCart(userId: number, productData: AddToCartData) {
    try {
      const { product_id, quantity } = productData;

      if (quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      const product = await prisma.product.findUnique({
        where: { id: product_id },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      const existingCartItem = await prisma.cart.findFirst({
        where: {
          user_id: userId,
          product_id,
        },
      });

      let cartItem: any;

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + quantity;

        if (product.stock < newQuantity) {
          throw new Error("Insufficient stock");
        }

        cartItem = await prisma.cart.update({
          where: { id: existingCartItem.id },
          data: { quantity: newQuantity },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                old_price: true,
                img: true,
                stock: true,
              },
            },
          },
        });
      } else {
        cartItem = await prisma.cart.create({
          data: {
            user_id: userId,
            product_id,
            quantity,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                old_price: true,
                img: true,
                stock: true,
              },
            },
          },
        });
      }

      logger.info(`Product ${product_id} added to cart for user ${userId}`);

      return {
        success: true,
        data: cartItem,
        message: "Product added to cart",
      };
    } catch (error) {
      logger.error("[addToCart] Error:", error);
      throw error instanceof Error ? error : new Error("Failed to add to cart");
    }
  }

  async updateCartItem(userId: number, cartItemId: number, updateData: UpdateCartItemData) {
    try {
      const { quantity } = updateData;

      if (quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      const cartItem = await prisma.cart.findUnique({
        where: { id: cartItemId },
        include: { product: true },
      });

      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      if (cartItem.user_id !== userId) {
        throw new Error("Unauthorized");
      }

      if (cartItem.product.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      const updatedCartItem = await prisma.cart.update({
        where: { id: cartItemId },
        data: { quantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              old_price: true,
              img: true,
              stock: true,
            },
          },
        },
      });

      logger.info(`Cart item ${cartItemId} updated for user ${userId}`);

      return {
        success: true,
        data: updatedCartItem,
        message: "Cart item updated",
      };
    } catch (error) {
      logger.error("[updateCartItem] Error:", error);
      throw error instanceof Error ? error : new Error("Failed to update cart item");
    }
  }

  async removeFromCart(userId: number, cartItemId: number) {
    try {
      const cartItem = await prisma.cart.findUnique({
        where: { id: cartItemId },
      });

      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      if (cartItem.user_id !== userId) {
        throw new Error("Unauthorized");
      }

      await prisma.cart.delete({
        where: { id: cartItemId },
      });

      logger.info(`Cart item ${cartItemId} removed for user ${userId}`);

      return {
        success: true,
        message: "Item removed from cart",
      };
    } catch (error) {
      logger.error("[removeFromCart] Error:", error);
      throw error instanceof Error ? error : new Error("Failed to remove from cart");
    }
  }

  async clearCart(userId: number) {
    try {
      await prisma.cart.deleteMany({
        where: { user_id: userId },
      });

      logger.info(`Cart cleared for user ${userId}`);

      return {
        success: true,
        message: "Cart cleared",
      };
    } catch (error) {
      logger.error("[clearCart] Error:", error);
      throw new Error("Failed to clear cart");
    }
  }

  async getCartCount(userId: number) {
    try {
      const count = await prisma.cart.count({
        where: { user_id: userId },
      });

      return {
        success: true,
        count,
      };
    } catch (error) {
      logger.error("[getCartCount] Error:", error);
      throw new Error("Failed to get cart count");
    }
  }
}
