# Backend Application with Docker Compose (with Supabase)

This setup provides a complete environment for running the backend application with nginx as a reverse proxy, Redis for caching, and Supabase as the database backend.

## Services

- **Backend**: Node.js application running on ports 3000-3003
- **Nginx**: Reverse proxy and load balancer
- **Redis**: In-memory data store for caching
- **Supabase**: Cloud-hosted PostgreSQL database (external service)

## Prerequisites

- Podman (version 4.0 or higher)
- Podman Compose plugin
- OpenSSL (for generating SSL certificates)
- Supabase account with database connection details

## Setup Instructions

### 1. Generate SSL Certificates

For development purposes, generate self-signed SSL certificates:

```bash
./generate-ssl.sh
```

For production, replace the generated certificates with your actual SSL certificates in the `ssl-certs/` directory.

### 2. Environment Configuration

Create a `.env.docker` file in the project root with your environment variables:

```bash
NODE_ENV=production
DATABASE_URL=your_supabase_database_url_here
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret
PORT=3000
```

Get your Supabase database URL from your Supabase dashboard. It typically looks like:
`postgresql://[user]:[password]@[host]:[port]/[database]?pgbouncer=true&connection_limit=10`

### 3. Run the Application

Start all services using Podman Compose:

```bash
podman-compose up -d
```

To view logs:

```bash
podman-compose logs -f
```

To stop the services:

```bash
podman-compose down
```

### 4. Alternative: Run Individual Services

If you want to run only specific services:

```bash
# Run only backend and Redis
podman-compose up -d backend redis

# Run only nginx and its dependencies
podman-compose up -d nginx
```

## Architecture Overview

The nginx configuration sets up:
- Load balancing across multiple backend instances (ports 3000-3003)
- Rate limiting for API and authentication endpoints
- SSL termination
- Static file caching
- Security headers
- Health checks

## Scaling

To scale the backend service:

```bash
podman-compose up -d --scale backend=4
```

## Troubleshooting

1. **Port conflicts**: Make sure ports 80, 443, 3000-3003, and 6379 are available.

2. **Health check failures**: Check logs with `podman-compose logs <service-name>`.

3. **Database connection issues**: Verify your Supabase connection URL is correct in the environment file.

4. **SSL Certificate Issues**: Ensure the certificate files are named correctly (`api.yourdomain.com.crt` and `api.yourdomain.com.key`) in the `ssl-certs/` directory.

## Development Notes

- The backend service is configured with health checks to ensure proper startup order
- Redis is used for caching and session storage
- Supabase is used for persistent data storage (external cloud service)
- Nginx handles SSL termination and load balancing