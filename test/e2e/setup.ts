import { beforeAll, afterAll } from '@jest/globals';

let testDatabaseUrl: string;

export async function setupTestDatabase() {
  testDatabaseUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
}

export async function teardownTestDatabase() {
}

export function getTestDatabaseUrl() {
  return testDatabaseUrl;
}
