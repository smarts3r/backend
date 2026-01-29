import { Readable } from "node:stream";
import csvParser from "csv-parser";
import { Parser } from "json2csv";
import { prisma } from "../lib/prisma";

export interface ProductImportData {
  name: string;
  price: number;
  category: string;
  img?: string;
  stock?: number;
  description?: string;
}

export class AdminService {
  getDashboard() {
    return { title: "Admin Dashboard", message: "Welcome to admin panel" };
  }

  generateTemplateCSV() {
    const fields = [
      "name",
      "price",
      "old_price",
      "category",
      "img",
      "stock",
      "description",
      "sku",
      "created_at",
      "updated_at",
    ];
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse([]);
  }

  async exportProductsToCSV() {
    try {
      const products = await prisma.product.findMany({
        select: {
          name: true,
          price: true,
          old_price: true,
          category: true,
          img: true,
          stock: true,
          description: true,
          sku: true,
          created_at: true,
          updated_at: true,
        },
      });

      const fields = [
        "name",
        "price",
        "old_price",
        "category",
        "img",
        "stock",
        "description",
        "sku",
        "created_at",
        "updated_at",
      ];
      const json2csvParser = new Parser({ fields });
      return json2csvParser.parse(products);
    } catch (error) {
      console.error("Export error:", error);
      throw new Error("Error exporting products");
    }
  }

  async processCSVImport(buffer: Buffer): Promise<{ message: string }> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          try {
            if (results.length === 0) {
              return reject(new Error("CSV file is empty"));
            }

            const values = results.map((p) => ({
              name: p.name,
              price: parseFloat(p.price) || 0,
              category: p.category,
              img: p.img || "/img/product-placeholder.png",
              stock: parseInt(p.stock, 10) || 0,
              description: p.description || "",
            }));

            await prisma.product.createMany({
              data: values as any,
              skipDuplicates: true,
            });

            resolve({
              message: `Successfully imported ${results.length} products.`,
            });
          } catch (error: any) {
            console.error("Import process error:", error);
            reject(new Error(`Error processing CSV data: ${error.message}`));
          }
        })
        .on("error", (error) => {
          reject(new Error(`Error reading CSV: ${error.message}`));
        });
    });
  }
}
