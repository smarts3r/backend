import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Test script to verify the Prisma client initialization works correctly
async function testPrismaInitialization() {
  console.log("Testing Prisma client initialization...");
  
  // Load the database URL with fallback
  const connectionString = process.env.DATABASE_URL || 'file:./fallback.db';

  console.log(`Using database URL: ${connectionString}`);
  
  // Determine if we're using PostgreSQL or SQLite
  const isPostgreSQL = connectionString.includes('postgresql://') || connectionString.includes('postgres://');
  const isSQLite = connectionString.startsWith('file:');

  console.log(`Database type detected: ${isPostgreSQL ? 'PostgreSQL' : isSQLite ? 'SQLite' : 'Unknown'}`);

  let prisma: PrismaClient;

  if (isPostgreSQL) {
    console.log("Initializing with PostgreSQL adapter...");
    // Use PostgreSQL adapter
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    prisma = new PrismaClient({
      adapter
    });
  } else if (isSQLite) {
    console.log("Initializing with SQLite...");
    // Use direct SQLite client (no adapter needed)
    prisma = new PrismaClient();
  } else {
    throw new Error(`Unsupported database type for connection string: ${connectionString}`);
  }

  try {
    console.log("Connecting to database...");
    await prisma.$connect();
    console.log("✓ Successfully connected to the database!");
    
    // Test a simple query
    console.log("Testing a simple query...");
    const userCount = await prisma.user.count();
    console.log(`✓ Found ${userCount} users in the database`);
    
    await prisma.$disconnect();
    console.log("✓ Disconnected from the database");
  } catch (error) {
    console.error("✗ Error connecting to the database:", error);
    throw error;
  }
}

testPrismaInitialization()
  .then(() => console.log("\n✓ All tests passed!"))
  .catch(error => {
    console.error("\n✗ Tests failed:", error);
    process.exit(1);
  });