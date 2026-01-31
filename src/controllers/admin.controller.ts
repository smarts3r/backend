import type { Request, Response } from "express";
import { AdminService } from "../services/admin.service";

const adminService = new AdminService();

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const dashboard = await adminService.getDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Error fetching dashboard",
    });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Error fetching stats",
    });
  }
};

export const downloadTemplate = (_req: Request, res: Response) => {
  const csv = adminService.generateTemplateCSV();

  res.header("Content-Type", "text/csv");
  res.attachment("products_template.csv");
  return res.send(csv);
};

export const exportProducts = async (_req: Request, res: Response) => {
  try {
    const csv = await adminService.exportProductsToCSV();

    res.header("Content-Type", "text/csv");
    res.attachment("all_products.csv");
    return res.send(csv);
  } catch (error) {
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Error exporting products",
      });
  }
};

export const importProducts = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No CSV file uploaded" });
  }

  try {
    const result = await adminService.processCSVImport(req.file.buffer);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Error processing CSV data",
    });
  }
};
