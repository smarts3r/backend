import type { Request, Response } from "express";
import { CategoryService } from "../services/category.service";

const categoryService = new CategoryService();

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error in getCategories controller:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Error creating category",
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const category = await categoryService.updateCategory(id, req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Error updating category",
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const category = await categoryService.deleteCategory(id);
    res.json(category);
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Error deleting category",
    });
  }
};
