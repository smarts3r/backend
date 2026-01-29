import { apiReference } from "@scalar/express-api-reference";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import errorhandler from "errorhandler";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "@/lib/prisma.ts";
import adminRoutes from "@/routes/admin.routes";
import authRoutes from "@/routes/auth.routes";
import categoryRoutes from "@/routes/categories.routes";
import productRoutes from "@/routes/product.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

console.log("====== API SERVER INITIALIZING ======");
console.log(`Current NODE_ENV: ${process.env.NODE_ENV}`);
// Sanitize log to avoid leaking secrets if it was a real URL, but strictly logging for debug now as it's a file path
console.log(`DATABASE_URL in process: ${process.env.DATABASE_URL}`);
try {
  const { PrismaClient } = require("@prisma/client");
  const tempPrisma = new PrismaClient();
  // @ts-expect-error
  console.log(
    "Prisma Client Datasource Provider:",
    tempPrisma._engineConfig?.datamodelPath ? "Available" : "Unknown",
  );
} catch (e) {
  console.log("Error inspecting Prisma Client:", e);
}

import cors from "cors";

// ... imports

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Allow frontend
    credentials: true,
  }),
);
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  "/scalar",
  apiReference({
    spec: {
      url: "/openapi.json",
    },
    theme: "purple",
  }),
);

// Health check endpoint for Docker/Podman
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.use("/api/auth/", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  app.use(errorhandler());
} else {
  app.use(morgan("common"));
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });
}

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Connected to database via Prisma");
    console.log("====== API SERVER STARTED ======");
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server due to database error:", err);
    process.exit(1);
  }
}

startServer();

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
