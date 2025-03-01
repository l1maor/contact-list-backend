#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Push the schema to the database (this is safer than migrations for development)
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

# Start the application
echo "Starting the application..."
exec pnpm start
