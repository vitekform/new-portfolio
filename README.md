# Portfolio Website

This is a portfolio website built with React and Vite, featuring user management and email verification.

## Features

- User registration and authentication
- Email verification via MailChannels (Cloudflare Workers compatible)
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

# Email Configuration (optional)
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Portfolio
```

### Email Setup

This application uses MailChannels API for sending emails, which is free for Cloudflare Workers and doesn't require SMTP credentials. MailChannels works out of the box with Cloudflare Workers.

**Important Notes:**
- MailChannels is free for Cloudflare Workers
- No SMTP credentials needed
- Uses HTTP API instead of socket-based SMTP
- Set `SMTP_FROM_EMAIL` to customize the sender email address
- Set `SMTP_FROM_NAME` to customize the sender name (defaults to "Portfolio")

For production use with custom domains:
1. Configure SPF records: Add `include:relay.mailchannels.net` to your domain's SPF record
2. Optionally configure DKIM for better deliverability
3. Use your verified domain in `SMTP_FROM_EMAIL`

After setting environment variables, rebuild and redeploy the project.

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
- MailChannels API (for email delivery)
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
