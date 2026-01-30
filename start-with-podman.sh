#!/bin/bash

# Script to run the backend application with Podman

set -e

echo "Starting backend application with Podman..."

# Check if podman-compose is available
if ! command -v podman-compose &> /dev/null; then
    echo "podman-compose could not be found. Installing..."

    # Install podman-compose if not available
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y podman-docker python3-docker
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y podman-docker python3-docker
    elif command -v yum &> /dev/null; then
        sudo yum install -y podman-docker python3-docker
    else
        echo "Please install podman-compose manually."
        exit 1
    fi
fi

# Check for .env.docker file
if [ ! -f "./.env.docker" ]; then
    echo ".env.docker file not found. Please create one with your environment variables:"
    echo "DATABASE_URL=your_supabase_database_url"
    echo "REDIS_URL=redis://redis:6379"
    echo "NODE_ENV=production"
    echo "..."
    exit 1
fi

# Generate SSL certificates if they don't exist
if [ ! -f "./ssl-certs/api.yourdomain.com.crt" ] || [ ! -f "./ssl-certs/api.yourdomain.com.key" ]; then
    echo "SSL certificates not found. Generating self-signed certificates..."
    ./generate-ssl.sh
fi

# Start the services
echo "Starting services..."
podman-compose up -d

echo "Services started successfully!"
echo ""
echo "Services are now running:"
echo "- Nginx (reverse proxy): http://localhost, https://localhost"
echo "- Backend API: Available through nginx proxy"
echo "- Redis: localhost:6379"
echo "- Database: Supabase (external)"
echo ""
echo "To view logs: podman-compose logs -f"
echo "To stop services: podman-compose down"