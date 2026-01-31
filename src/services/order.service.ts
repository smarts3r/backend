import { OrderStatus } from "@prisma/client";
import { Parser } from "json2csv";
import { prisma } from "../lib/prisma";

const ALLOWED_ORDER_SORT_FIELDS = [
  "created_at",
  "updated_at",
  "total_amount",
  "status",
  "order_number",
] as const;

type SortField = (typeof ALLOWED_ORDER_SORT_FIELDS)[number];

export interface OrderQuery {
  page?: string;
  limit?: string;
  status?: string;
  paymentStatus?: string;
  userId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: string;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  payment_status?: string;
  notes?: string;
  cancelled_at?: string | Date;
}

export interface BulkUpdateData {
  orderIds: (string | number)[];
  status: OrderStatus;
}

export class OrderService {
  async getOrders(query: OrderQuery) {
    try {
      const {
        page = "1",
        limit = "20",
        status,
        paymentStatus,
        userId,
        search,
        sortBy = "created_at",
        sortDir = "desc",
      } = query;

      const pageNum = Math.max(1, Number(page));
      const take = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * take;

      const where: any = {};

      if (
        status &&
        Object.values(OrderStatus).includes(status as OrderStatus)
      ) {
        where.status = status;
      }

      if (paymentStatus && typeof paymentStatus === "string") {
        where.payment_status = paymentStatus.trim();
      }

      if (userId && !isNaN(Number(userId))) {
        where.user_id = Number(userId);
      }

      if (search && typeof search === "string" && search.trim()) {
        where.OR = [
          { order_number: { contains: search.trim(), mode: "insensitive" } },
          { user: { email: { contains: search.trim(), mode: "insensitive" } } },
        ];
      }

      const safeSortBy = ALLOWED_ORDER_SORT_FIELDS.includes(sortBy as SortField)
        ? (sortBy as SortField)
        : "created_at";

      const safeSortDir = sortDir === "asc" ? "asc" : "desc";

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          take,
          skip,
          orderBy: { [safeSortBy]: safeSortDir },
          select: {
            id: true,
            order_number: true,
            total_amount: true,
            status: true,
            payment_status: true,
            payment_method: true,
            created_at: true,
            updated_at: true,
            cancelled_at: true,
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
            _count: {
              select: { orderItems: true },
            },
          },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        success: true,
        data: orders,
        pagination: {
          page: pageNum,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      console.error("[getOrders] Error:", error);
      throw new Error("Failed to fetch orders");
    }
  }

  async getOrderById(id: number) {
    try {
      if (!id || isNaN(id)) {
        throw new Error("Invalid order ID");
      }

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              profile: {
                select: {
                  first_name: true,
                  last_name: true,
                  phone: true,
                  address: true,
                  city: true,
                  state: true,
                  zip_code: true,
                  country: true,
                },
              },
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  img: true,
                  sku: true,
                  price: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      return { success: true, data: order };
    } catch (error) {
      console.error("[getOrderById] Error:", error);
      throw error instanceof Error ? error : new Error("Failed to fetch order");
    }
  }

  async updateOrder(id: number, updateData: UpdateOrderData) {
    try {
      if (isNaN(id)) {
        throw new Error("Invalid order ID");
      }

      const { status, payment_status, notes, cancelled_at } = updateData;

      const current = await prisma.order.findUnique({
        where: { id },
        select: { status: true, cancelled_at: true },
      });

      if (!current) {
        throw new Error("Order not found");
      }

      const allowedTransitions: Record<string, string[]> = {
        PENDING: ["PROCESSING", "PAID", "CANCELLED"],
        PAID: ["PROCESSING", "CANCELLED"],
        PROCESSING: ["SHIPPED", "CANCELLED"],
        SHIPPED: ["DELIVERED", "CANCELLED"],
        DELIVERED: [],
        CANCELLED: [],
      };

      let finalStatus = current.status;
      if (status && status !== current.status) {
        if (!allowedTransitions[current.status].includes(status)) {
          throw new Error(
            `Invalid status transition: ${current.status} → ${status}`,
          );
        }
        finalStatus = status as OrderStatus;
      }

      const data: any = {
        status: finalStatus as any,
        updated_at: new Date(),
      };

      if (payment_status !== undefined) {
        data.payment_status = String(payment_status).trim();
      }
      if (notes !== undefined) {
        data.notes = String(notes).trim() || null;
      }

      if (cancelled_at) {
        const cancelDate = new Date(cancelled_at);
        if (!isNaN(cancelDate.getTime())) {
          data.cancelled_at = cancelDate;
        }
      } else if (finalStatus === "CANCELLED" && !current.cancelled_at) {
        data.cancelled_at = new Date();
      }

      const updated = await prisma.order.update({
        where: { id },
        data,
        include: {
          user: { select: { email: true, username: true } },
        },
      });

      return {
        success: true,
        message: "Order updated",
        data: updated,
      };
    } catch (error) {
      console.error("[updateOrder] Error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to update order");
    }
  }

  async bulkUpdateOrderStatus(bulkData: BulkUpdateData) {
    try {
      const { orderIds, status } = bulkData;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new Error("orderIds must be a non-empty array of numbers");
      }

      if (!Object.values(OrderStatus).includes(status)) {
        throw new Error(
          `Invalid status. Allowed values: ${Object.values(OrderStatus).join(", ")}`,
        );
      }

      const validOrderIds = [
        ...new Set(
          orderIds
            .map((id: any) => Number(id))
            .filter((id: number) => !isNaN(id) && id > 0),
        ),
      ];

      if (validOrderIds.length === 0) {
        throw new Error("No valid order IDs provided");
      }

      const preventableStatuses = ["DELIVERED", "CANCELLED"] as OrderStatus[];

      const result = await prisma.order.updateMany({
        where: {
          id: { in: validOrderIds },
          status: { notIn: preventableStatuses },
        },
        data: {
          status: status as OrderStatus,
          ...(status === "CANCELLED" ? { cancelled_at: new Date() } : {}),
        },
      });

      return {
        success: true,
        message:
          result.count === 0
            ? "No eligible orders were updated (possibly already delivered/cancelled)"
            : `Successfully updated ${result.count} order(s) to ${status}`,
        updatedCount: result.count,
      };
    } catch (error) {
      console.error("[bulkUpdateOrderStatus] Error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to perform bulk status update");
    }
  }

  async exportOrdersToCSV() {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              email: true,
              username: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (orders.length === 0) {
        return {
          success: true,
          message: "No orders found to export",
          csvContent: null,
        };
      }

      const flatRows = orders.flatMap((order) =>
        order.orderItems.map((item) => ({
          order_id: order.id,
          order_number: order.order_number,
          created_at: order.created_at.toISOString(),
          status: order.status,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
          total_amount: order.total_amount,
          user_email: order.user.email,
          user_username: order.user.username || "",
          product_name: item.product.name,
          product_sku: item.product.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          shipping_address: order.shipping_address,
        })),
      );

      const fields = [
        "order_id",
        "order_number",
        "created_at",
        "status",
        "payment_status",
        "payment_method",
        "total_amount",
        "user_email",
        "user_username",
        "product_name",
        "product_sku",
        "quantity",
        "unit_price",
        "subtotal",
        "shipping_address",
      ];

      const parser = new Parser({ fields, header: true });
      const csvContent = parser.parse(flatRows);

      return {
        success: true,
        csvContent,
        filename: `orders-export-${new Date().toISOString().split("T")[0]}.csv`,
      };
    } catch (error) {
      console.error("[exportOrders] Error:", error);
      throw new Error("Failed to generate orders export");
    }
  }
}
