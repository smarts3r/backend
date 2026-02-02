## Database Fallback Mechanism

This backend implements a smart database fallback mechanism that works as follows:

### How it Works

1. **Environment Variable Check**: The system first checks for the `DATABASE_URL` environment variable.
2. **PostgreSQL Connection Test**: If `DATABASE_URL` points to a PostgreSQL database, the system attempts to establish a connection.
3. **Fallback Logic**:
   - If PostgreSQL is accessible: Uses PostgreSQL as the database
   - If PostgreSQL is not accessible: Falls back to SQLite (`fallback.db`)
   - If `DATABASE_URL` is not set: Uses SQLite (`fallback.db`) as default

### Configuration

The system uses the following files to implement the fallback:

- `scripts/setup-database.ts`: Contains the logic to test PostgreSQL connectivity and update the Prisma schema accordingly
- `prisma.config.ts`: Configures Prisma to use the database URL from environment variables
- `src/lib/prisma.ts`: Initializes Prisma client with the appropriate adapter based on the database type

### Scripts

The following npm scripts have been updated to use the database setup:

- `setup-db`: Runs the database setup script
- `prisma:generate`: Includes database setup before generating Prisma client
- `prisma:migrate`: Includes database setup before running migrations
- And others...

### Supported Databases

- PostgreSQL (primary)
- SQLite (fallback)

### Migration Behavior

When running migrations:
- If PostgreSQL is available, migrations run against PostgreSQL
- If PostgreSQL is not available, migrations run against SQLite
- The schema is automatically adjusted based on the selected database type