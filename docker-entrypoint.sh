#!/bin/sh
set -e

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma migrations..."
  node node_modules/prisma/build/index.js migrate deploy --config prisma.config.ts || echo "Migration failed or already up to date"
fi

# Start the application
exec node server.js
