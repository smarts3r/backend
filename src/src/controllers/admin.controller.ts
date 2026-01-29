import { Readable } from "node:stream";
import csvParser from "csv-parser";
import type { Request, Response } from "express";
import { Parser } from "json2csv";
import { prisma } from "@/lib/prisma.ts";

export const getDashboard = (_req: Request, res: Response) => {
  res.json({ title: "Admin Dashboard", message: "Welcome to admin panel" });
};

export const downloadTemplate = (_req: Request, res: Response) => {
  const fields = ["name", "price", "category", "img", "stock", "description"];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse([]);

  res.header("Content-Type", "text/csv");
  res.attachment("products_template.csv");
  return res.send(csv);
};

export const exportProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        price: true,
        category: true,
        img: true,
        stock: true,
        description: true,
      },
    });

    const fields = ["name", "price", "category", "img", "stock", "description"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(products);

    res.header("Content-Type", "text/csv");
    res.attachment("all_products.csv");
    return res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Error exporting products" });
  }
};

export const importProducts = async (
  req: Request & { file?: Express.Multer.File },
  res: Response,
) => {
  if (!req.file) {
    return res.status(400).json({ message: "No CSV file uploaded" });
  }

  const results: any[] = [];
  const stream = Readable.from(req.file.buffer);

  stream
    .pipe(csvParser())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        if (results.length === 0) {
          return res.status(400).json({ message: "CSV file is empty" });
        }

        // Map CSV rows to Prisma createMany input
        const values = results.map((p) => ({
          name: p.name,
          price: parseInt(p.price, 10) || 0,
          category: p.category,
          img: p.img || "/img/product-placeholder.png",
          stock: parseInt(p.stock, 10) || 0,
          description: p.description || "",
        }));

        await prisma.product.createMany({
          data: values,
        });

        res.json({
          message: `Successfully imported ${results.length} products.`,
        });
      } catch (error: any) {
        console.error("Import process error:", error);
        res.status(500).json({
          message: "Error processing CSV data",
          error: error.message,
        });
      }
    });
};
