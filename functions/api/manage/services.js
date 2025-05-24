// Initialize default services if they don't exist
async function initializeServices(env) {
    try {
        // Check if any services exist
        const servicesCount = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM services
        `).first();

        if (servicesCount.count === 0) {
            // Insert default services
            const defaultServices = [
                {
                    name: 'Web Hosting',
                    description: 'Reliable web hosting services with 99.9% uptime guarantee.'
                },
                {
                    name: 'File Cloud',
                    description: 'Secure cloud storage for your files with easy access from anywhere.'
                },
                {
                    name: 'Application Server',
                    description: 'Dedicated application server for your custom applications.'
                },
                {
                    name: 'CI / CD',
                    description: 'Continuous Integration and Continuous Deployment pipeline setup and management.'
                }
            ];

            for (const service of defaultServices) {
                await env.DB.prepare(`
                    INSERT INTO services (name, description, created_at)
                    VALUES (?1, ?2, datetime('now'))
                `).bind(service.name, service.description).run();
            }

            console.log('Default services initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing services:', error);
    }
}

export async function POST(request, env) {
    // Initialize services on first request if needed
    await initializeServices(env);

    // Parse the request body
    const requestData = await request.json();
    const action = requestData.action;

    if (action === 'getServiceRequests') {
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
            const user = await env.DB.prepare(`
                SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
            `).bind(parseInt(userId), token).first();

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

            // Build the query with optional status filter
            let query = `
                SELECT sr.*, 
                       u.id as user_id, u.username, u.email,
                       s.id as service_id, s.name as service_name, s.description as service_description
                FROM service_requests sr
                LEFT JOIN users u ON sr.user_id = u.id
                LEFT JOIN services s ON sr.service_id = s.id
                WHERE 1=1
            `;

            const params = [];
            let paramIndex = 1;

            // Add status filter if provided
            if (status) {
                query += ` AND sr.status = ?${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            query += ` ORDER BY sr.created_at DESC`;

            // Get service requests
            const serviceRequestsResult = await env.DB.prepare(query).bind(...params).all();

            return new Response(JSON.stringify({
                success: true,
                serviceRequests: serviceRequestsResult.results
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
    } else if (action === 'updateServiceRequestStatus') {
        try {
            // Validate user authentication
            const userId = requestData.userId;
            const token = requestData.token;
            const requestId = requestData.requestId;
            const status = requestData.status;

            if (!userId || !token || !requestId || !status) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Validate status
            if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid status. Must be approved, rejected, or pending.'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify user authentication and check if user is admin or root
            const user = await env.DB.prepare(`
                SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
            `).bind(parseInt(userId), token).first();

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

            // Check if service request exists
            const serviceRequest = await env.DB.prepare(`
                SELECT id FROM service_requests WHERE id = ?1 LIMIT 1
            `).bind(parseInt(requestId)).first();

            if (!serviceRequest) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Service request not found'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Update service request status
            await env.DB.prepare(`
                UPDATE service_requests SET status = ?1, updated_at = datetime('now') WHERE id = ?2
            `).bind(status, parseInt(requestId)).run();

            // Get the updated service request
            const updatedRequest = await env.DB.prepare(`
                SELECT * FROM service_requests WHERE id = ?1
            `).bind(parseInt(requestId)).first();

            return new Response(JSON.stringify({
                success: true,
                message: `Service request ${status} successfully`,
                serviceRequest: updatedRequest
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Update service request status error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while updating service request status'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } else if (action === 'getServices') {
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
            const user = await env.DB.prepare(`
                SELECT id FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
            `).bind(parseInt(userId), token).first();

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
            const servicesResult = await env.DB.prepare(`
                SELECT id, name, description FROM services ORDER BY name ASC
            `).all();

            return new Response(JSON.stringify({
                success: true,
                services: servicesResult.results
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
    } else if (action === 'requestService') {
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
            const user = await env.DB.prepare(`
                SELECT id FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
            `).bind(parseInt(userId), token).first();

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid authentication'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify service exists
            const service = await env.DB.prepare(`
                SELECT id FROM services WHERE id = ?1 LIMIT 1
            `).bind(parseInt(serviceId)).first();

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
            const insertResult = await env.DB.prepare(`
                INSERT INTO service_requests (user_id, service_id, details, status, created_at, updated_at)
                VALUES (?1, ?2, ?3, 'pending', datetime('now'), datetime('now'))
            `).bind(parseInt(userId), parseInt(serviceId), details).run();

            const serviceRequestId = insertResult.meta.last_row_id;

            return new Response(JSON.stringify({
                success: true,
                message: 'Service request submitted successfully',
                requestId: serviceRequestId
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Request service error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while submitting your request'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } else {
        return new Response(JSON.stringify({
            success: false,
            message: 'Invalid action'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}