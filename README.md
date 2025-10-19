# Portfolio Website

This is a portfolio website built with React and Vite, featuring user management and email verification.

## Features

- User registration and authentication
- Email verification via SMTP (Nodemailer)
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

To use SMTP for sending emails, you need to:

1. Get SMTP credentials from your email provider (e.g., Gmail, Outlook, Sendinblue, Mailgun, your own server).
2. Make sure the sender email address is allowed by your provider and that SPF/DKIM are configured for best deliverability.
3. Set the SMTP environment variables shown above (SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL).
4. For common providers:
   - Gmail: host=smtp.gmail.com, port=465 (secure=true) or 587 (secure=false, STARTTLS), user=your full email, pass=App Password.
   - Outlook/Office365: host=smtp.office365.com, port=587, secure=false (STARTTLS).
   - Custom SMTP: use values from your server.

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
- Nodemailer + SMTP (for email)
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
