# Prisma PostgreSQL Migration Guide

This document provides instructions for completing the migration from direct PostgreSQL queries to Prisma ORM with Prisma Accelerate.

## Changes Made

1. Installed Prisma dependencies:
   - `prisma` (dev dependency)
   - `@prisma/client` (runtime dependency)

2. Created Prisma schema in `prisma/schema.prisma` with the User model

3. Created Prisma client setup in `api/lib/prisma.js`

4. Configured Prisma Accelerate for improved database performance and connection pooling

5. Refactored database operations in `api/manage/userUtils.js` to use Prisma instead of direct SQL queries:
   - User registration
   - User login
   - Device tracking
   - User data retrieval
   - User role updates
   - User field updates (username, email, password, theme)

## Steps to Complete Migration

1. Update the `.env` file with your Prisma Accelerate connection URL:
   ```
   DB_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your_accelerate_api_key"
   ```

   Or if you prefer to use a direct PostgreSQL connection:
   ```
   DB_DATABASE_URL="postgres://username:password@hostname:port/database"
   ```

2. Run the Prisma migration to create the database schema:
   ```
   npx prisma migrate dev --name init
   ```

3. Generate the Prisma client:
   ```
   npx prisma generate
   ```

4. Test the application to ensure all functionality works correctly

## Prisma Accelerate

This project uses Prisma Accelerate, a connection pooling service that improves database performance and reliability. Benefits include:

- **Connection Pooling**: Efficiently manages database connections to prevent connection limits
- **Global Caching**: Reduces database load and improves response times
- **Edge Computing**: Reduces latency by processing queries closer to users
- **Automatic Scaling**: Handles traffic spikes without configuration

To use Prisma Accelerate:

1. Sign up at [Prisma Data Platform](https://cloud.prisma.io/)
2. Create a new Accelerate project
3. Get your Accelerate connection string and API key
4. Update your `.env` file with the Accelerate URL

## Additional Notes

- The Prisma schema includes fields for `device_history` and `verification_tokens` as JSON fields, which were previously added dynamically in the code.
- If you encounter any issues with the migration, you may need to manually adjust the database schema or update the Prisma schema to match your existing database structure.
- There are still some database operations in `userUtils.js` that could be refactored to use Prisma. This migration focused on the most critical operations.

## Troubleshooting

If you encounter issues with the migration:

1. Check that your database URL is correctly formatted
2. Ensure your PostgreSQL server is running and accessible
3. If you have existing data, you may need to use `prisma db pull` to generate a schema from your existing database before running migrations
