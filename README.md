# Portfolio Website

This is a portfolio website built with React and Vite, featuring user management and email verification.

## Features

- User registration and authentication
- Email verification using SendGrid
- Portfolio content management
- Forgot password functionality
- Toggle between login and registration
- Login security with device verification
- Welcome email after registration

## Setup

### Environment Variables

The following environment variables need to be set for the application to work properly:

```
# Database Configuration
# For Prisma Accelerate:
DB_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your_accelerate_api_key"
# Or for direct PostgreSQL connection:
# DB_DATABASE_URL="postgres://username:password@host:port/database"

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=your-verified-sender-email@example.com
```

### SendGrid Setup

To use SendGrid for sending verification emails, you need to:

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com/)
2. Verify a sender email address:
   - Navigate to Settings > Sender Authentication
   - Choose either Domain Authentication or Single Sender Verification
   - Follow the steps to verify your sender email
3. Create an API key:
   - Navigate to Settings > API Keys
   - Click "Create API Key"
   - Select "Restricted Access" and ensure "Mail Send" permission is enabled
   - Copy the generated API key (you won't be able to see it again)
   - Use this key as your SENDGRID_API_KEY environment variable
4. Set your verified sender email as the SENDGRID_FROM_EMAIL environment variable

### Installation

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build
```

## Technologies Used

- React
- Vite
- Node.js
- PostgreSQL
- Prisma ORM
- Prisma Accelerate (for connection pooling and performance)
- SendGrid (for email verification)
- Styled Components

## Database Migration

This project has been migrated from direct PostgreSQL queries to Prisma ORM. See [README-PRISMA-MIGRATION.md](README-PRISMA-MIGRATION.md) for details on the migration process and additional setup steps.
