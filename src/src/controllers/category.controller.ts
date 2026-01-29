import type { Request, Response } from "express";
import { prisma } from "@/lib/prisma.ts";

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    const uniqueCategories = categories.map((item) => item.category);
    res.json(uniqueCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};
