import type { Request, Response } from "express";
import { OrderService } from "../services/order.service";

const orderService = new OrderService();

export const getOrders = async (req: Request, res: Response) => {
  try {
    const result = await orderService.getOrders(req.query as any);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch orders",
    });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const result = await orderService.getOrderById(Number(req.params.id));
    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid order ID") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }
    if (error instanceof Error && error.message === "Order not found") {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch order",
    });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const result = await orderService.updateOrder(
      Number(req.params.id),
      req.body,
    );
    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid order ID") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }
    if (error instanceof Error && error.message === "Order not found") {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update order",
    });
  }
};

export const bulkUpdateOrderStatus = async (req: Request, res: Response) => {
  try {
    const result = await orderService.bulkUpdateOrderStatus(req.body);

    if (result.updatedCount === 0) {
      return res.status(200).json(result);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to perform bulk status update",
    });
  }
};

export const exportOrders = async (_req: Request, res: Response) => {
  try {
    const result = await orderService.exportOrdersToCSV();

    if (!result.csvContent) {
      return res.status(200).json({
        success: true,
        message: "No orders found to export",
      });
    }

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
    res.header("Cache-Control", "no-cache");

    res.send("\uFEFF" + result.csvContent);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate orders export",
    });
  }
};
