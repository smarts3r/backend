import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prisma } from "../src/lib/prisma.ts";
import { hashPassword } from "../src/utils/authUtilities.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  /* -------------------- ADMIN USER -------------------- */
  const adminEmail = "dev@email.com";
  const adminPassword = "dev123";

  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        username: "ADMIN",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("✅ Admin user created");
  } else {
    console.log("ℹ️ Admin already exists");
  }

  /* -------------------- CATEGORIES -------------------- */
  console.log("📦 Seeding categories...");

  const categoriesPath = path.join(__dirname, "../public/categories.json");
  const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));

  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  });

  const dbCategories = await prisma.category.findMany();

  const categoryMap: Record<string, number> = Object.fromEntries(
    dbCategories.map((c) => [c.name, c.id])
  );

  console.log("✅ Categories seeded:", categoryMap);

  /* -------------------- PRODUCTS -------------------- */
  console.log("🛒 Seeding products...");

  const productsPath = path.join(__dirname, "../public/products.json");
  const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

  await prisma.product.deleteMany();

  const productsData = products.map((product: any) => {
    if (!categoryMap[product.category]) {
      throw new Error(`❌ Unknown category: ${product.category}`);
    }

    return {
      img: product.img,
      name: product.name,
      price: product.price,
      old_price: product.old_price ?? null,
      stock: product.stock ?? 10,
      description: product.description ?? product.name,
      category_id: categoryMap[product.category],
    };
  });

  await prisma.product.createMany({
    data: productsData,
    skipDuplicates: true,
  });

  console.log(`✅ Seeded ${productsData.length} products`);

  /* -------------------- FINAL CHECK -------------------- */
  const userCount = await prisma.user.count();
  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  console.log("📊 Final DB state:");
  console.log(`- Users: ${userCount}`);
  console.log(`- Categories: ${categoryCount}`);
  console.log(`- Products: ${productCount}`);

  console.log("🎉 Seeding completed successfully");
}

seedDatabase()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("💥 Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
