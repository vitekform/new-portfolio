import { executeQueryFirst, executeQueryRun } from '../../lib/d1.js';

export async function verifyEmail(requestData) {
    try {
        const userId = requestData.userId;
        const verificationToken = requestData.verificationToken;

        // Validate input
        if (!userId || !verificationToken) {
            return new Response(JSON.stringify({
                success: false,
                message: 'User ID and verification token are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            // Get user and their verification tokens
            const user = await executeQueryFirst(
                'SELECT id, username, email, role, verification_tokens FROM User WHERE id = ?',
                [parseInt(userId)]
            );

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'User not found'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is already verified
            if (user.role !== 'unverified') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'User is already verified'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Parse verification tokens
            let verificationTokens;
            try {
                verificationTokens = JSON.parse(user.verification_tokens || '{}');
            } catch (parseError) {
                console.error('Error parsing verification tokens:', parseError);
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid verification data'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify the token
            if (!verificationTokens.email || verificationTokens.email !== verificationToken) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid verification token'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if token is expired (24 hours)
            const tokenCreatedAt = new Date(verificationTokens.created_at);
            const now = new Date();
            const hoursDiff = (now - tokenCreatedAt) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Verification token has expired. Please request a new one.'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Update user role to 'user' and clear verification tokens
            await executeQueryRun(
                'UPDATE User SET role = ?, verification_tokens = ?, updated_at = datetime("now") WHERE id = ?',
                ['user', '{}', parseInt(userId)]
            );

            // Award "Email Verified" achievement
            try {
                const emailVerifiedAchievement = await executeQueryFirst(
                    'SELECT id FROM Achievement WHERE code = ?',
                    ['email_verified']
                );

                if (emailVerifiedAchievement) {
                    await executeQueryRun(
                        'INSERT INTO UserAchievement (user_id, achievement_id, unlocked_at) VALUES (?, ?, datetime("now"))',
                        [parseInt(userId), emailVerifiedAchievement.id]
                    );
                }
            } catch (achievementError) {
                console.error('Error awarding email verification achievement:', achievementError);
                // Don't fail verification if achievement awarding fails
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Email verified successfully! Your account is now active.',
                userData: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: 'user'
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (dbError) {
            console.error('Database operation error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Email verification error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'An error occurred during email verification'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}