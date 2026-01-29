import asyncHandler from "express-async-handler";
import { prisma } from "../lib/prisma.js";

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = asyncHandler(async (req, res) => {
  const totalProducts = await prisma.product.count();
  const totalUsers = await prisma.user.count();

  // Calculate total inventory value
  const products = await prisma.product.findMany({
    select: {
      price: true,
      stock: true,
    },
  });

  const totalRevenue = products.reduce((acc, product) => {
    return acc + product.price * (product.stock || 0);
  }, 0);

  // Mock active users and sales growth for now, until we have real sessions/orders
  const activeNow = await prisma.user.count({
    where: {
      updated_at: {
        gte: new Date(Date.now() - 1000 * 60 * 60), // Active in last hour (mock logic)
      },
    },
  });

  res.json({
    totalRevenue,
    totalProducts,
    totalSales: 0, // Placeholder until Order model is fully integrated
    activeNow: Math.max(activeNow, 1), // Always show at least 1 (the admin themselves)
  });
});
