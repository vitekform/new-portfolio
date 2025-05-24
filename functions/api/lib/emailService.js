/**
 * Email service using SendGrid
 * Uses environment variables: SENDGRID_API_KEY and SENDGRID_FROM_EMAIL
 */

/**
 * Send email using SendGrid
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content (optional)
 * @param {Object} env - Cloudflare environment object containing secrets
 */
export async function sendEmail(to, subject, html, text = null, env) {
    try {
        const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
        const FROM_EMAIL = env.SENDGRID_FROM_EMAIL;

        if (!SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY environment variable is not set');
        }

        if (!FROM_EMAIL) {
            throw new Error('SENDGRID_FROM_EMAIL environment variable is not set');
        }

        console.log('📧 Sending email via SendGrid to:', to);

        const emailData = {
            personalizations: [{
                to: [{ email: to }],
                subject: subject
            }],
            from: {
                email: FROM_EMAIL,
                name: 'ganamaga.me'
            },
            content: [
                { type: 'text/html', value: html }
            ]
        };

        // Add plain text version if provided
        if (text) {
            emailData.content.push({ type: 'text/plain', value: text });
        }

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('SendGrid API error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
        }

        const messageId = response.headers.get('x-message-id') || `sendgrid-${Date.now()}`;

        console.log('✅ Email sent successfully via SendGrid, Message ID:', messageId);

        return {
            success: true,
            messageId: messageId,
            provider: 'sendgrid'
        };

    } catch (error) {
        console.error('❌ Failed to send email via SendGrid:', error);
        throw error;
    }
}

/**
 * Send verification email specifically
 * @param {Object} user - User object with id, username, email
 * @param {string} verificationToken - Verification token
 * @param {Object} env - Cloudflare environment object
 */
export async function sendVerificationEmail(user, verificationToken, env) {
    const emailContent = generateVerificationEmailContent(user, verificationToken);

    return await sendEmail(
        user.email,
        emailContent.subject,
        emailContent.html,
        emailContent.text,
        env
    );
}

/**
 * Generate verification email content
 */
function generateVerificationEmailContent(user, verificationToken) {
    const verificationUrl = `https://ganamaga.me/verify-email?userId=${user.id}&token=${verificationToken}`;

    const subject = 'Verify Your Email Address - ganamaga.me';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 22px;
            margin-bottom: 10px;
            color: #1f2937;
        }
        .subtitle {
            color: #6b7280;
            font-size: 14px;
        }
        .content {
            margin: 30px 0;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s ease;
        }
        .verify-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .info-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
        }
        .info-box .icon {
            color: #f59e0b;
            font-weight: bold;
        }
        .manual-link-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .manual-link {
            word-break: break-all;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background-color: white;
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            font-size: 12px;
            color: #374151;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .footer-links {
            margin: 10px 0;
        }
        .footer-links a {
            color: #2563eb;
            text-decoration: none;
            margin: 0 10px;
        }
        .security-note {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 ganamaga.me</div>
            <div class="title">Email Verification Required</div>
            <div class="subtitle">Complete your account setup</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello <strong>${user.username}</strong>,
            </div>
            
            <p>Welcome to ganamaga.me! We're excited to have you on board. To complete your account setup and unlock all features, please verify your email address.</p>
            
            <div class="button-container">
                <a href="${verificationUrl}" class="verify-button">
                    ✓ Verify Email Address
                </a>
            </div>
            
            <div class="info-box">
                <span class="icon">⏱️</span> <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
            </div>
            
            <div class="manual-link-section">
                <p><strong>Alternative method:</strong> If the button above doesn't work, copy and paste this link into your browser:</p>
                <div class="manual-link">${verificationUrl}</div>
            </div>
            
            <div class="security-note">
                <strong>Security Notice:</strong> If you didn't create an account with ganamaga.me, you can safely ignore this email. Your email address will not be added to our system without verification.
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
                <li>✨ Request services and support</li>
                <li>🎯 Unlock achievements and easter eggs</li>
                <li>🎨 Customize your profile and preferences</li>
                <li>🎫 Create and manage support tickets</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This email was sent to <strong>${user.email}</strong></p>
            <div class="footer-links">
                <a href="https://ganamaga.me">Visit Website</a> •
                <a href="mailto:admin@ganamaga.me">Contact Support</a>
            </div>
            <p>© 2025 ganamaga.me - Portfolio & Services Platform</p>
            <p><em>Sent on ${new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })} UTC</em></p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Hello ${user.username},

Welcome to ganamaga.me! 

To complete your account setup and unlock all features, please verify your email address by visiting this link:

${verificationUrl}

IMPORTANT: This verification link will expire in 24 hours for security reasons.

Once verified, you'll be able to:
• Request services and support
• Unlock achievements and easter eggs  
• Customize your profile and preferences
• Create and manage support tickets

If you didn't create an account with ganamaga.me, you can safely ignore this email.

Need help? Contact us at admin@ganamaga.me

© 2025 ganamaga.me - Portfolio & Services Platform
Sent on ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC
`;

    return {
        subject,
        html,
        text,
        verificationUrl
    };
}