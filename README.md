# Portfolio Website

This is a portfolio website built with React and Vite, featuring user management and email verification.

## Features

- User registration and authentication
- Email verification via SMTP
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

# SMTP Configuration
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=your-sender-email@example.com
```

### SMTP Setup

This application sends emails using an SMTP-compatible approach that works with Cloudflare Workers.

**Technical Note:**
Cloudflare Pages Functions don't support direct TCP socket connections (required for traditional SMTP) due to security restrictions. This application uses MailChannels as an SMTP relay service that provides HTTP-based email sending while maintaining SMTP configuration compatibility.

**Configuration:**
```
SMTP_FROM_EMAIL=your-sender-email@example.com (required)
SMTP_FROM_NAME=Portfolio (optional, defaults to "Portfolio")
SMTP_HOST=smtp.yourprovider.com (optional, for reference)
SMTP_USER=your-smtp-username (optional, for reference)
SMTP_PASS=your-smtp-password (optional, for reference)
```

**How it works:**
- Uses MailChannels API which is free for Cloudflare Workers
- Maintains SMTP configuration fields for compatibility
- No direct SMTP credentials needed for MailChannels
- Works around Cloudflare Workers' limitation of not supporting Node.js net module

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
- MailChannels (SMTP relay for Cloudflare Workers)
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
