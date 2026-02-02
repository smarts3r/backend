import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Dynamically import pg to test PostgreSQL connections
async function checkPostgresConnection(databaseUrl: string): Promise<boolean> {
  if (!databaseUrl.includes('postgresql://') && !databaseUrl.includes('postgres://')) {
    return false;
  }

  try {
    // Dynamically import the pg module
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: databaseUrl,
    });

    await client.connect();
    await client.end();
    return true;
  } catch (error) {
    console.warn('PostgreSQL connection failed:', (error as Error).message);
    return false;
  }
}

/**
 * Creates the appropriate Prisma schema based on the database type
 */
function createPrismaSchema(databaseUrl: string): void {
  const isPostgreSQL = databaseUrl.includes('postgresql://') || databaseUrl.includes('postgres://');
  const isSQLite = databaseUrl.startsWith('file:');

  // Read the original schema
  const originalSchemaPath = resolve('./prisma/schema-original.prisma');
  let schemaContent: string;

  try {
    schemaContent = readFileSync(originalSchemaPath, 'utf8');
  } catch (error) {
    // If original schema doesn't exist, read the current schema
    schemaContent = readFileSync(resolve('./prisma/schema.prisma'), 'utf8');
  }

  // Extract everything except the datasource section
  const lines = schemaContent.split('\n');
  let newLines: string[] = [];
  let insideDatasource = false;
  let generatorSectionStarted = false;
  let generatorSectionEnded = false;
  let generatorLines: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith('datasource db {')) {
      insideDatasource = true;
      continue;
    }

    if (insideDatasource && line.trim() === '}') {
      insideDatasource = false;
      continue;
    }

    if (!insideDatasource) {
      if (line.trim().startsWith('generator client {')) {
        generatorSectionStarted = true;
      }

      if (generatorSectionStarted && !generatorSectionEnded) {
        generatorLines.push(line);
        if (line.trim() === '}') {
          generatorSectionEnded = true;
        }
      } else {
        newLines.push(line);
      }
    }
  }

  // Create the new datasource based on the database type
  // NOTE: For Prisma v7 with adapters, the URL is handled in prisma.config.ts
  // and should not be in the schema file for most operations
  let datasourceBlock: string;
  if (isSQLite) {
    datasourceBlock = `datasource db {
  provider = "sqlite"
}`;
  } else if (isPostgreSQL) {
    datasourceBlock = `datasource db {
  provider = "postgresql"
}`;
  } else {
    // Default to PostgreSQL if it's another type
    datasourceBlock = `datasource db {
  provider = "postgresql"
}`;
  }

  // Reconstruct the schema with the new datasource
  const finalSchema = [
    ...generatorLines,
    '',
    datasourceBlock,
    ...newLines.filter(line => !line.includes('generator client {'))
  ].join('\n').trim();

  // Write the updated schema
  writeFileSync(resolve('./prisma/schema.prisma'), finalSchema);
  console.log(`Updated Prisma schema for ${isSQLite ? 'SQLite' : 'PostgreSQL'} database`);
}

// Main async function
async function main(): Promise<void> {
  let databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && (databaseUrl.includes('postgresql://') || databaseUrl.includes('postgres://'))) {
    const isPostgresAvailable = await checkPostgresConnection(databaseUrl);
    if (!isPostgresAvailable) {
      console.log('PostgreSQL connection failed, falling back to SQLite');
      databaseUrl = 'file:./fallback.db';
    } else {
      console.log('PostgreSQL connection successful');
    }
  } else if (!databaseUrl) {
    console.log('DATABASE_URL not set, using SQLite fallback');
    databaseUrl = 'file:./fallback.db';
  } else {
    console.log('Using configured database');
  }

  // Update the environment variable for any subsequent operations
  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_PROVIDER = databaseUrl.startsWith('file:') ? 'sqlite' : 'postgresql';

  // Create the appropriate schema
  createPrismaSchema(databaseUrl);
}

main().catch(console.error);