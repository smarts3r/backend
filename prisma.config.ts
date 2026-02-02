import { defineConfig } from "prisma/config";

// Use the DATABASE_URL that will be set by our setup script
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
  generators: {
    client: {
      provider: "prisma-client-js",
    },
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});