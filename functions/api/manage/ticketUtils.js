import prisma, { initializeD1Client } from '../lib/prisma.js';

export function onRequest(context) {
    return (async () => {
        const request = context.request;
        const env = context.env;

        // Initialize the D1 client with the environment
        initializeD1Client(env);

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
                const user = await prisma.user.findFirst({
                    where: {
                        id: parseInt(userId),
                        token: token
                    },
                    select: {
                        id: true,
                        role: true
                    }
                });

                if (!user) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Invalid authentication' 
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Check if service request exists and belongs to the user or user is admin/root
                const serviceRequest = await prisma.serviceRequest.findUnique({
                    where: {
                        id: parseInt(serviceRequestId)
                    },
                    include: {
                        user: true,
                        ticket: true
                    }
                });

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
                if (serviceRequest.ticket) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'A ticket already exists for this service request' 
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Create ticket
                const ticket = await prisma.ticket.create({
                    data: {
                        title,
                        user: { connect: { id: serviceRequest.user_id } },
                        service_request: { connect: { id: parseInt(serviceRequestId) } }
                    }
                });

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
                const user = await prisma.user.findFirst({
                    where: {
                        id: parseInt(userId),
                        token: token
                    },
                    select: {
                        id: true,
                        role: true
                    }
                });

                if (!user) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: 'Invalid authentication' 
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Build the query
                const whereClause = {};
                if (status) {
                    whereClause.status = status;
                }

                // If user is not admin or root, only show their tickets
                if (user.role !== 'admin' && user.role !== 'root') {
                    whereClause.user_id = user.id;
                }

                // Get tickets
                const tickets = await prisma.ticket.findMany({
                    where: whereClause,
                    orderBy: {
                        updated_at: 'desc'
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true
                            }
                        },
                        service_request: {
                            include: {
                                service: true
                            }
                        },
                        messages: {
                            orderBy: {
                                created_at: 'asc'
                            },
                            include: {
                                sender: {
                                    select: {
                                        id: true,
                                        username: true,
                                        role: true
                                    }
                                }
                            }
                        }
                    }
                });

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
                const user = await prisma.user.findFirst({
                    where: {
                        id: parseInt(userId),
                        token: token
                    },
                    select: {
                        id: true,
                        role: true
                    }
                });

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
                const ticket = await prisma.ticket.findUnique({
                    where: {
                        id: parseInt(ticketId)
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true
                            }
                        },
                        service_request: {
                            include: {
                                service: true
                            }
                        },
                        messages: {
                            orderBy: {
                                created_at: 'asc'
                            },
                            include: {
                                sender: {
                                    select: {
                                        id: true,
                                        username: true,
                                        role: true
                                    }
                                }
                            }
                        }
                    }
                });

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
                        message: 'Unauthorized. You can only view your own tickets.' 
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Mark unread messages as read if the user is the recipient
                const unreadMessages = ticket.messages.filter(
                    message => !message.is_read && message.sender_id !== user.id
                );

                if (unreadMessages.length > 0) {
                    await prisma.ticketMessage.updateMany({
                        where: {
                            id: {
                                in: unreadMessages.map(message => message.id)
                            }
                        },
                        data: {
                            is_read: true
                        }
                    });
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
                const user = await prisma.user.findFirst({
                    where: {
                        id: parseInt(userId),
                        token: token
                    },
                    select: {
                        id: true,
                        role: true
                    }
                });

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
                const ticket = await prisma.ticket.findUnique({
                    where: {
                        id: parseInt(ticketId)
                    }
                });

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
                const message = await prisma.ticketMessage.create({
                    data: {
                        content,
                        sender: { connect: { id: user.id } },
                        ticket: { connect: { id: parseInt(ticketId) } }
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                role: true
                            }
                        }
                    }
                });

                // Update ticket's updated_at timestamp
                await prisma.ticket.update({
                    where: {
                        id: parseInt(ticketId)
                    },
                    data: {
                        updated_at: new Date()
                    }
                });

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
                const user = await prisma.user.findFirst({
                    where: {
                        id: parseInt(userId),
                        token: token
                    },
                    select: {
                        id: true,
                        role: true
                    }
                });

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
                const ticket = await prisma.ticket.findUnique({
                    where: {
                        id: parseInt(ticketId)
                    }
                });

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
                const updatedTicket = await prisma.ticket.update({
                    where: {
                        id: parseInt(ticketId)
                    },
                    data: {
                        status
                    }
                });

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
    })();
}
