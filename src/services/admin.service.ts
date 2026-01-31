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
  async getDashboard() {
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    
    const orders = await prisma.order.findMany({
      include: {
        orderItems: true,
      },
    });
    
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + order.orderItems.reduce((itemSum, item) => {
        return itemSum + (item.unit_price * item.quantity);
      }, 0);
    }, 0);

    const monthlySales = await this.getMonthlySales();

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      monthlySales,
    };
  }

  private async getMonthlySales() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: sixMonthsAgo,
        },
      },
      include: {
        orderItems: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    const monthlyData: { [key: string]: number } = {};
    
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('en-US', { month: 'short' });
      monthlyData[key] = 0;
    }

    orders.forEach(order => {
      const month = new Date(order.created_at).toLocaleString('en-US', { month: 'short' });
      const orderTotal = order.orderItems.reduce((sum, item) => {
        return sum + (item.unit_price * item.quantity);
      }, 0);
      
      if (monthlyData[month] !== undefined) {
        monthlyData[month] += orderTotal;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, sales]) => ({ month, sales }))
      .reverse();
  }

  async getStats() {
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    
    const orders = await prisma.order.findMany({
      include: {
        orderItems: true,
      },
    });
    
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + order.orderItems.reduce((itemSum, item) => {
        return itemSum + (item.unit_price * item.quantity);
      }, 0);
    }, 0);

    const activeNow = await prisma.user.count({
      where: {
        updated_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      totalRevenue,
      totalProducts,
      totalSales: totalOrders,
      activeNow,
    };
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
