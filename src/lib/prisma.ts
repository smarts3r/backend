import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

// Load the database URL with fallback
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Determine if we're using PostgreSQL or SQLite
const isPostgreSQL = connectionString.includes('postgresql://') || connectionString.includes('postgres://');
const isSQLite = connectionString.startsWith('file:');

let prisma: PrismaClient;

if (isPostgreSQL) {
  // Use PostgreSQL adapter
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient;
  };

  prisma = globalForPrisma.prisma || new PrismaClient({
    adapter
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
} else if (isSQLite) {
  // Use direct SQLite client (no adapter needed)
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient;
  };

  prisma = globalForPrisma.prisma || new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
} else {
  throw new Error(`Unsupported database type for connection string: ${connectionString}`);
}

export { prisma };

export default prisma;