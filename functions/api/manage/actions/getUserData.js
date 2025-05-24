import { executeQueryFirst } from '../../lib/d1.js';

export async function getUserData(requestData) {
    try {
        const userId = requestData.userId;
        const token = requestData.token;

        // Validate input
        if (!userId || !token) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Missing user ID or token'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            // Check if user exists and token is valid
            const userData = await executeQueryFirst(
                'SELECT id, username, email, role FROM User WHERE id = ? AND token = ?',
                [parseInt(userId), token]
            );

            // If no user found or token doesn't match
            if (!userData) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid user ID or token'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Return user data (excluding sensitive information)
            return new Response(JSON.stringify({
                success: true,
                userData: {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role
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
        console.error('Get user data error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'An error occurred while fetching user data'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}