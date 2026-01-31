# Backend API

This is the backend API for the SmartS3r application.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy the environment variables:
   ```bash
   cp .env .env.local
   ```
   
   Then update the values in `.env.local` as needed for your environment.

3. Generate Prisma client:
   ```bash
   pnpm prisma:generate
   ```

4. Run database migrations:
   ```bash
   pnpm prisma:migrate
   ```

## Development

To start the development server:

```bash
pnpm dev
```

## Environment Variables

Make sure to set the following environment variables in your `.env` file:

- `DATABASE_URL`: PostgreSQL connection string
- `ACCESS_TOKEN_SECRET`: Secret for JWT access tokens
- `REFRESH_TOKEN_SECRET`: Secret for JWT refresh tokens
- `CORS_ORIGIN`: Allowed origin for CORS
- `NODE_ENV`: Environment (development/production)
- `PORT`: Port to run the server on

## Prisma Commands

- Generate Prisma client: `pnpm prisma:generate`
- Run migrations: `pnpm prisma:migrate`
- Reset database: `pnpm prisma:reset`
- Open Prisma Studio: `pnpm prisma:studio`

## Troubleshooting

If you encounter the error `Cannot resolve environment variable: DATABASE_URL` when running Prisma commands, make sure your `.env` file contains the required environment variables and that you're using the correct script that loads the environment variables (e.g., using `npx dotenv-cli -e .env --` before the Prisma command).