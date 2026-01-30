#!/bin/bash

# Script to generate self-signed SSL certificates for development

CERT_DIR="./ssl-certs"
DOMAIN="api.yourdomain.com"

echo "Generating self-signed SSL certificates for $DOMAIN..."

# Create certificate directory if it doesn't exist
mkdir -p $CERT_DIR

# Generate private key
openssl genrsa -out $CERT_DIR/$DOMAIN.key 2048

# Generate certificate signing request
openssl req -new -key $CERT_DIR/$DOMAIN.key -out $CERT_DIR/$DOMAIN.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Generate self-signed certificate
openssl x509 -req -days 365 -in $CERT_DIR/$DOMAIN.csr -signkey $CERT_DIR/$DOMAIN.key -out $CERT_DIR/$DOMAIN.crt

# Set appropriate permissions
chmod 644 $CERT_DIR/$DOMAIN.*

echo "SSL certificates generated successfully in $CERT_DIR/"
echo "Files created:"
ls -la $CERT_DIR/