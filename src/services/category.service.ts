import { prisma } from "../lib/prisma";

export interface CreateCategoryData {
  name: string;
}

export interface UpdateCategoryData {
  name: string;
}

export class CategoryService {
  async getAllCategories() {
    try {
      const categories = await prisma.category.findMany({
        include: {
          products: {
            take: 10,
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Format the response to match the required structure
      return categories.map(category => ({
        id: category.id,
        name: category.name,
        products: category.products
      }));
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Error fetching categories");
    }
  }

  async createCategory(categoryData: CreateCategoryData) {
    try {
      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
        },
      });
      return category;
    } catch (error) {
      console.error("Error creating category:", error);
      throw new Error("Error creating category");
    }
  }

  async updateCategory(id: number, categoryData: UpdateCategoryData) {
    try {
      const category = await prisma.category.update({
        where: { id },
        data: {
          name: categoryData.name,
        },
      });
      return category;
    } catch (error) {
      console.error("Error updating category:", error);
      throw new Error("Error updating category");
    }
  }

  async deleteCategory(id: number) {
    try {
      const category = await prisma.category.delete({
        where: { id },
      });
      return category;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw new Error("Error deleting category");
    }
  }
}
