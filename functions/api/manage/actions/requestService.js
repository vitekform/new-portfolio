import { executeQueryFirst, executeQueryRun } from '../../lib/d1.js';

export async function requestService(requestData) {
    try {
        // Validate user authentication
        const userId = requestData.userId;
        const token = requestData.token;
        const serviceId = requestData.serviceId;
        const details = requestData.details;

        if (!userId || !token || !serviceId || !details) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Missing required parameters'
            }), {
                status: 400,
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

        // Check if service exists
        const service = await executeQueryFirst(
            'SELECT id FROM Service WHERE id = ?',
            [parseInt(serviceId)]
        );

        if (!service) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Service not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create service request
        const result = await executeQueryRun(
            'INSERT INTO ServiceRequest (user_id, service_id, details, status, created_at, updated_at) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))',
            [parseInt(userId), parseInt(serviceId), details, 'pending']
        );

        return new Response(JSON.stringify({
            success: true,
            message: 'Service request created successfully',
            serviceRequestId: result.meta.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Request service error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'An error occurred while creating service request'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}