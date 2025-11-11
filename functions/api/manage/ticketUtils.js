export async function onRequest(context) {
    // Parse the request body
    const { request, env } = context;
    // Parse the request body
    const requestData = await request.json();
    const action = requestData.action;

    if (action === 'createTicket') {
        try {
            // Validate user authentication
            const userId = requestData.userId;
            const token = requestData.token;
            const serviceRequestId = requestData.serviceRequestId;
            const title = requestData.title || 'New Ticket';

            if (!userId || !token || !serviceRequestId) {
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

            // Check if service request exists and get user info
            const serviceRequest = await env.DB.prepare(`
                SELECT sr.id, sr.user_id, u.username, u.email,
                       CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END as has_ticket
                FROM service_requests sr
                LEFT JOIN users u ON sr.user_id = u.id
                LEFT JOIN tickets t ON sr.id = t.service_request_id
                WHERE sr.id = ?1
                LIMIT 1
            `).bind(parseInt(serviceRequestId)).first();

            if (!serviceRequest) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Service request not found'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is the owner of the service request or is admin/root
            if (serviceRequest.user_id !== user.id && user.role !== 'admin' && user.role !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. You can only create tickets for your own service requests.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if ticket already exists for this service request
            if (serviceRequest.has_ticket) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'A ticket already exists for this service request'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Create ticket
            const insertResult = await env.DB.prepare(`
                INSERT INTO tickets (title, user_id, service_request_id, status, created_at, updated_at)
                VALUES (?1, ?2, ?3, 'open', datetime('now'), datetime('now'))
            `).bind(title, serviceRequest.user_id, parseInt(serviceRequestId)).run();

            const ticketId = insertResult.meta.last_row_id;

            // Get the created ticket
            const ticket = await env.DB.prepare(`
                SELECT * FROM tickets WHERE id = ?1
            `).bind(ticketId).first();

            return new Response(JSON.stringify({
                success: true,
                message: 'Ticket created successfully',
                ticket
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Create ticket error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while creating the ticket'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    else if (action === 'getTickets') {
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

            // Verify user authentication
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

            // Build the query with filters
            let query = `
                SELECT t.*, 
                       u.id as user_id, u.username, u.email,
                       sr.id as service_request_id, sr.title as service_request_title, sr.details as service_request_details,
                       s.id as service_id, s.name as service_name
                FROM tickets t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN service_requests sr ON t.service_request_id = sr.id
                LEFT JOIN services s ON sr.service_id = s.id
                WHERE 1=1
            `;

            const params = [];
            let paramIndex = 1;

            // If user is not admin or root, only show their tickets
            if (user.role !== 'admin' && user.role !== 'root') {
                query += ` AND t.user_id = ?${paramIndex}`;
                params.push(user.id);
                paramIndex++;
            }

            // Add status filter if provided
            if (status) {
                query += ` AND t.status = ?${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            query += ` ORDER BY t.updated_at DESC`;

            // Get tickets
            const ticketsResult = await env.DB.prepare(query).bind(...params).all();
            const tickets = ticketsResult.results.map(ticket => {
                // Restructure ticket data with nested objects
                const restructured = {
                    id: ticket.id,
                    title: ticket.title,
                    status: ticket.status,
                    created_at: ticket.created_at,
                    updated_at: ticket.updated_at,
                    user: ticket.user_id ? {
                        id: ticket.user_id,
                        username: ticket.username,
                        email: ticket.email
                    } : null,
                    service_request: ticket.service_request_id ? {
                        id: ticket.service_request_id,
                        title: ticket.service_request_title,
                        details: ticket.service_request_details,
                        service: ticket.service_id ? {
                            id: ticket.service_id,
                            name: ticket.service_name
                        } : null
                    } : null
                };
                return restructured;
            });

            // Get messages for each ticket
            for (let ticket of tickets) {
                const messagesResult = await env.DB.prepare(`
                    SELECT tm.*, 
                           u.id as sender_id, u.username as sender_username, u.role as sender_role
                    FROM ticket_messages tm
                    LEFT JOIN users u ON tm.sender_id = u.id
                    WHERE tm.ticket_id = ?1
                    ORDER BY tm.created_at ASC
                `).bind(ticket.id).all();

                ticket.messages = messagesResult.results.map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    is_read: msg.is_read,
                    created_at: msg.created_at,
                    sender_id: msg.sender_id,
                    sender: msg.sender_id ? {
                        id: msg.sender_id,
                        username: msg.sender_username,
                        role: msg.sender_role
                    } : null
                }));
            }

            return new Response(JSON.stringify({
                success: true,
                tickets
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Get tickets error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while fetching tickets'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    else if (action === 'getTicket') {
        try {
            // Validate user authentication
            const userId = requestData.userId;
            const token = requestData.token;
            const ticketId = requestData.ticketId;

            if (!userId || !token || !ticketId) {
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

            // Get ticket with related data
            const ticketRaw = await env.DB.prepare(`
                SELECT t.*, 
                       u.id as user_id, u.username, u.email,
                       sr.id as service_request_id, sr.title as service_request_title, sr.details as service_request_details,
                       s.id as service_id, s.name as service_name
                FROM tickets t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN service_requests sr ON t.service_request_id = sr.id
                LEFT JOIN services s ON sr.service_id = s.id
                WHERE t.id = ?1
                LIMIT 1
            `).bind(parseInt(ticketId)).first();

            if (!ticketRaw) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Ticket not found'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is the owner of the ticket or is admin/root
            if (ticketRaw.user_id !== user.id && user.role !== 'admin' && user.role !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. You can only view your own tickets.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Restructure ticket data with nested objects
            const ticket = {
                id: ticketRaw.id,
                title: ticketRaw.title,
                status: ticketRaw.status,
                created_at: ticketRaw.created_at,
                updated_at: ticketRaw.updated_at,
                user: ticketRaw.user_id ? {
                    id: ticketRaw.user_id,
                    username: ticketRaw.username,
                    email: ticketRaw.email
                } : null,
                service_request: ticketRaw.service_request_id ? {
                    id: ticketRaw.service_request_id,
                    title: ticketRaw.service_request_title,
                    details: ticketRaw.service_request_details,
                    service: ticketRaw.service_id ? {
                        id: ticketRaw.service_id,
                        name: ticketRaw.service_name
                    } : null
                } : null
            };

            // Get messages for the ticket
            const messagesResult = await env.DB.prepare(`
                SELECT tm.*, 
                       u.id as sender_id, u.username as sender_username, u.role as sender_role
                FROM ticket_messages tm
                LEFT JOIN users u ON tm.sender_id = u.id
                WHERE tm.ticket_id = ?1
                ORDER BY tm.created_at ASC
            `).bind(parseInt(ticketId)).all();

            ticket.messages = messagesResult.results.map(msg => ({
                id: msg.id,
                content: msg.content,
                is_read: msg.is_read,
                created_at: msg.created_at,
                sender_id: msg.sender_id,
                sender: msg.sender_id ? {
                    id: msg.sender_id,
                    username: msg.sender_username,
                    role: msg.sender_role
                } : null
            }));

            // Mark unread messages as read if the user is the recipient
            const unreadMessages = ticket.messages.filter(
                message => !message.is_read && message.sender_id !== user.id
            );

            if (unreadMessages.length > 0) {
                const unreadMessageIds = unreadMessages.map(message => message.id);

                // Update messages in batches or one by one since D1 doesn't support IN with arrays directly
                for (const messageId of unreadMessageIds) {
                    await env.DB.prepare(`
                        UPDATE ticket_messages SET is_read = 1 WHERE id = ?1
                    `).bind(messageId).run();
                }
            }

            return new Response(JSON.stringify({
                success: true,
                ticket
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Get ticket error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while fetching the ticket'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    else if (action === 'sendMessage') {
        try {
            // Validate user authentication
            const userId = requestData.userId;
            const token = requestData.token;
            const ticketId = requestData.ticketId;
            const content = requestData.content;

            if (!userId || !token || !ticketId || !content) {
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

            // Get ticket
            const ticket = await env.DB.prepare(`
                SELECT id, user_id, status FROM tickets WHERE id = ?1 LIMIT 1
            `).bind(parseInt(ticketId)).first();

            if (!ticket) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Ticket not found'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is the owner of the ticket or is admin/root
            if (ticket.user_id !== user.id && user.role !== 'admin' && user.role !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. You can only send messages to your own tickets.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if ticket is closed
            if (ticket.status === 'closed') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Cannot send messages to a closed ticket'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Create message
            const insertResult = await env.DB.prepare(`
                INSERT INTO ticket_messages (content, sender_id, ticket_id, is_read, created_at)
                VALUES (?1, ?2, ?3, 0, datetime('now'))
            `).bind(content, user.id, parseInt(ticketId)).run();

            const messageId = insertResult.meta.last_row_id;

            // Get the created message with sender info
            const messageRaw = await env.DB.prepare(`
                SELECT tm.*, 
                       u.id as sender_id, u.username as sender_username, u.role as sender_role
                FROM ticket_messages tm
                LEFT JOIN users u ON tm.sender_id = u.id
                WHERE tm.id = ?1
            `).bind(messageId).first();

            // Structure the message properly
            const message = {
                id: messageRaw.id,
                content: messageRaw.content,
                is_read: messageRaw.is_read,
                created_at: messageRaw.created_at,
                sender_id: messageRaw.sender_id,
                sender: messageRaw.sender_id ? {
                    id: messageRaw.sender_id,
                    username: messageRaw.sender_username,
                    role: messageRaw.sender_role
                } : null
            };

            // Update ticket's updated_at timestamp
            await env.DB.prepare(`
                UPDATE tickets SET updated_at = datetime('now') WHERE id = ?1
            `).bind(parseInt(ticketId)).run();

            return new Response(JSON.stringify({
                success: true,
                message: 'Message sent successfully',
                ticketMessage: message
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Send message error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while sending the message'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    else if (action === 'updateTicketStatus') {
        try {
            // Validate user authentication
            const userId = requestData.userId;
            const token = requestData.token;
            const ticketId = requestData.ticketId;
            const status = requestData.status;

            if (!userId || !token || !ticketId || !status) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Missing required parameters'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Validate status
            if (status !== 'open' && status !== 'closed') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid status. Must be open or closed.'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify user authentication
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

            // Get ticket
            const ticket = await env.DB.prepare(`
                SELECT id, user_id, status FROM tickets WHERE id = ?1 LIMIT 1
            `).bind(parseInt(ticketId)).first();

            if (!ticket) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Ticket not found'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user is the owner of the ticket or is admin/root
            if (ticket.user_id !== user.id && user.role !== 'admin' && user.role !== 'root') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Unauthorized. You can only update your own tickets.'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Update ticket status
            await env.DB.prepare(`
                UPDATE tickets SET status = ?1, updated_at = datetime('now') WHERE id = ?2
            `).bind(status, parseInt(ticketId)).run();

            // Get the updated ticket
            const updatedTicket = await env.DB.prepare(`
                SELECT * FROM tickets WHERE id = ?1
            `).bind(parseInt(ticketId)).first();

            return new Response(JSON.stringify({
                success: true,
                message: `Ticket ${status === 'open' ? 'reopened' : 'closed'} successfully`,
                ticket: updatedTicket
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Update ticket status error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while updating the ticket status'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response(JSON.stringify({
        success: false,
        message: 'Invalid action'
    }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    });
}