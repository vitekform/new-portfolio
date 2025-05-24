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
# Cloudflare D1 Configuration
# No environment variables needed for D1 as it's configured in wrangler.toml
# The database binding is automatically available in your Cloudflare Workers

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
- Cloudflare D1 (SQLite-compatible database)
- Cloudflare Workers (for serverless functions)
- SendGrid (for email verification)
- Styled Components

## Database Setup

This project uses Cloudflare D1, a serverless SQL database that's compatible with SQLite. The database schema is defined in `schema.sql` and can be deployed using Wrangler CLI:

```bash
# Initialize a new D1 database (only needed once)
yarn d1:init

# Apply the schema to the D1 database
yarn d1:migrate
```

The database is automatically connected in your Cloudflare Workers through the D1 binding configured in `wrangler.toml`.
