import { executeQueryFirst, executeQueryRun } from '../../lib/d1.js';
import { v4 as uuidv4 } from 'uuid';

export async function resendVerification(requestData) {
    try {
        const email = requestData.email;

        // Validate input
        if (!email) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Email is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            // Find user by email
            const user = await executeQueryFirst(
                'SELECT id, username, email, role, verification_tokens FROM User WHERE email = ?',
                [email]
            );

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'No account found with this email address'
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
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Please wait at least 5 minutes before requesting another verification email'
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
                created_at: new Date().toISOString()
            });

            // Update user with new verification token
            await executeQueryRun(
                'UPDATE User SET verification_tokens = ?, updated_at = datetime("now") WHERE id = ?',
                [newVerificationTokens, user.id]
            );

            return new Response(JSON.stringify({
                success: true,
                message: 'Verification email sent! Please check your inbox.',
                verificationToken: newVerificationToken, // In a real app, you'd send this via email
                userId: user.id
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (dbError) {
            console.error('Database operation error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'An error occurred while sending verification email'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}