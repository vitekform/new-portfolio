import { executeQuery, executeQueryFirst } from '../../lib/d1.js';

export async function getServiceRequests(requestData) {
    try {
        // Validate user authentication
        const userId = requestData.userId;
        const token = requestData.token;
        const status = requestData.status; // Optional status filter

        if (!userId || !token) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Authentication required'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify user authentication and check if user is admin or root
        const user = await executeQueryFirst(
            'SELECT id, role FROM User WHERE id = ? AND token = ?',
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

        // Check if user is admin or root
        if (user.role !== 'admin' && user.role !== 'root') {
            return new Response(JSON.stringify({
                success: false,
                message: 'Unauthorized. Admin or root access required.'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Build the query
        let query = `
            SELECT sr.*, u.username, u.email, s.name as service_name
            FROM ServiceRequest sr
            JOIN User u ON sr.user_id = u.id
            JOIN Service s ON sr.service_id = s.id
        `;
        let params = [];

        if (status) {
            query += ' WHERE sr.status = ?';
            params.push(status);
        }

        query += ' ORDER BY sr.created_at DESC';

        // Get service requests
        const serviceRequests = await executeQuery(query, params);

        return new Response(JSON.stringify({
            success: true,
            serviceRequests: serviceRequests.results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get service requests error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'An error occurred while fetching service requests'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}