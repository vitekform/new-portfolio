import { executeQuery, executeQueryFirst } from '../../lib/d1.js';

export async function getServices(requestData) {
    try {
        // Validate user authentication
        const userId = requestData.userId;
        const token = requestData.token;

        if (!userId || !token) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Authentication required'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify user authentication
        const user = await executeQueryFirst(
            'SELECT id FROM User WHERE id = ? AND token = ?',
            [parseInt(userId), token]
        );

        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Invalid authentication'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get all services
        const services = await executeQuery(
            'SELECT id, name, description FROM Service ORDER BY name ASC'
        );

        return new Response(JSON.stringify({
            success: true,
            services: services.results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get services error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'An error occurred while fetching services'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}