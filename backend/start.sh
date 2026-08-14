#!/bin/bash

# HR Management Backend - Production Startup Script

# Ensure environment is set
export NODE_ENV=production

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Start the server
echo "Starting server..."
node index.js
