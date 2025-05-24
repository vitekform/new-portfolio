import { executeQueryFirst, executeQueryRun } from '../../lib/d1.js';
import { sendVerificationEmail as sendVerificationEmailViaService } from '../../lib/emailService.js';
import { v4 as uuidv4 } from 'uuid';

export async function sendVerificationEmail(requestData, env) {
    try {
        const email = requestData.email;
        const userId = requestData.userId; // Optional - can be provided if user is logged in

        // Validate input - need either email or userId
        if (!email && !userId) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Email or user ID is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            let user;

            // Find user by email or userId
            if (userId) {
                user = await executeQueryFirst(
                    'SELECT id, username, email, role, verification_tokens FROM User WHERE id = ?',
                    [parseInt(userId)]
                );
            } else {
                user = await executeQueryFirst(
                    'SELECT id, username, email, role, verification_tokens FROM User WHERE email = ?',
                    [email]
                );
            }

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'No account found with the provided information'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is already verified
            if (user.role !== 'unverified') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'This account is already verified'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check rate limiting (prevent spam)
            let verificationTokens;
            try {
                verificationTokens = JSON.parse(user.verification_tokens || '{}');
            } catch (parseError) {
                verificationTokens = {};
            }

            // Check if last verification email was sent less than 5 minutes ago
            if (verificationTokens.created_at) {
                const lastSent = new Date(verificationTokens.created_at);
                const now = new Date();
                const minutesDiff = (now - lastSent) / (1000 * 60);

                if (minutesDiff < 5) {
                    const remainingTime = Math.ceil(5 - minutesDiff);
                    return new Response(JSON.stringify({
                        success: false,
                        message: `Please wait ${remainingTime} more minute(s) before requesting another verification email`,
                        remainingTime: remainingTime
                    }), {
                        status: 429,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            // Generate new verification token
            const newVerificationToken = uuidv4();
            const newVerificationTokens = JSON.stringify({
                email: newVerificationToken,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
            });

            // Update user with new verification token
            await executeQueryRun(
                'UPDATE User SET verification_tokens = ?, updated_at = datetime("now") WHERE id = ?',
                [newVerificationTokens, user.id]
            );

            try {
                // Send verification email via SendGrid
                const emailResult = await sendVerificationEmailViaService(user, newVerificationToken, env);

                console.log('📧 Verification email sent successfully:', {
                    userId: user.id,
                    email: user.email,
                    messageId: emailResult.messageId
                });

                return new Response(JSON.stringify({
                    success: true,
                    message: 'Verification email sent successfully! Please check your inbox and spam folder.',
                    emailSent: true,
                    userId: user.id,
                    messageId: emailResult.messageId,
                    provider: emailResult.provider
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (emailError) {
                console.error('❌ Failed to send verification email:', emailError);

                // Revert the token update since email failed
                await executeQueryRun(
                    'UPDATE User SET verification_tokens = ?, updated_at = datetime("now") WHERE id = ?',
                    [user.verification_tokens, user.id]
                );

                return new Response(JSON.stringify({
                    success: false,
                    message: 'Failed to send verification email. Please try again later.',
                    error: 'email_service_error'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

        } catch (dbError) {
            console.error('Database operation error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Send verification email error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'An error occurred while processing your request'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}