import type { Request, Response } from "express";
import { prisma } from "@/lib/prisma.ts";

export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, price, old_price, category, img, stock, description } =
    req.body;
  try {
    const product = await prisma.product.create({
      data: {
        name,
        price,
        old_price: old_price ?? null,
        category,
        img,
        stock: stock ?? 10,
        description: description ?? name,
      },
    });
    res.status(201).json({
      id: product.id,
      name: product.name,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Error creating product" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price, old_price, category, img, stock, description } =
    req.body;
  try {
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        price,
        old_price: old_price ?? null,
        category,
        img,
        stock: stock ?? 10,
        description: description ?? name,
      },
    });
    res.json({
      id: product.id,
      name: product.name,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({
      where: { id: Number(id) },
    });
    res.json({ id, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
};
