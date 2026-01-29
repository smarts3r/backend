import type { Request, Response } from "express";
import { ProductService } from "../services/product.service";

const productService = new ProductService();

export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Error fetching products",
      });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductById(Number(req.params.id));
    res.json(product);
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
      return res.status(404).json({ message: "Product not found" });
    }
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Error fetching product",
      });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const result = await productService.createProduct(req.body);
    res.status(201).json(result);
  } catch (error) {
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Error creating product",
      });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const result = await productService.updateProduct(
      Number(req.params.id),
      req.body,
    );
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Error updating product",
      });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const result = await productService.deleteProduct(Number(req.params.id));
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Error deleting product",
      });
  }
};
