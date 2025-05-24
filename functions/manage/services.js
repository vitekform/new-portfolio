import prisma, { initializeD1Client } from '../lib/prisma.js';
import * as Sentry from "@sentry/node";

Sentry.init({
    dsn: "https://342a3da4b820d22a01431d0c0201a770@o4508938006626304.ingest.de.sentry.io/4509362550734928",

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});

// Initialize default services if they don't exist
async function initializeServices(env) {
    try {
        // Initialize the D1 client with the environment
        if (env) {
            initializeD1Client(env);
        }

        // Check if any services exist
        const servicesCount = await prisma.service.count();

        if (servicesCount === 0) {
            // Insert default services
            await prisma.service.createMany({
                data: [
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
                ]
            });

            console.log('Default services initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing services:', error);
        Sentry.captureException(error);
    }
}

// We'll initialize services in the POST function where the environment is available

export async function POST(request, env) {
    // Initialize the D1 client with the environment
    initializeD1Client(env);

    // Initialize default services if needed
    await initializeServices(env).catch(error => {
        console.error('Error during service initialization:', error);
        Sentry.captureException(error);
    });

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
            const whereClause = {};
            if (status) {
                whereClause.status = status;
            }

            // Get service requests
            const serviceRequests = await prisma.serviceRequest.findMany({
                where: whereClause,
                orderBy: {
                    created_at: 'desc'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true
                        }
                    },
                    service: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    }
                }
            });

            return new Response(JSON.stringify({ 
                success: true, 
                serviceRequests
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Get service requests error:', error);
            Sentry.captureException(error);
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
            const serviceRequest = await prisma.serviceRequest.findUnique({
                where: {
                    id: parseInt(requestId)
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

            // Update service request status
            const updatedRequest = await prisma.serviceRequest.update({
                where: {
                    id: parseInt(requestId)
                },
                data: {
                    status: status
                }
            });

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
            Sentry.captureException(error);
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
            const user = await prisma.user.findFirst({
                where: {
                    id: parseInt(userId),
                    token: token
                },
                select: {
                    id: true
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

            // Get all services
            const services = await prisma.service.findMany({
                orderBy: {
                    name: 'asc'
                },
                select: {
                    id: true,
                    name: true,
                    description: true
                }
            });

            return new Response(JSON.stringify({ 
                success: true, 
                services: services
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Get services error:', error);
            Sentry.captureException(error);
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
            const user = await prisma.user.findFirst({
                where: {
                    id: parseInt(userId),
                    token: token
                },
                select: {
                    id: true
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

            // Verify service exists
            const service = await prisma.service.findUnique({
                where: {
                    id: parseInt(serviceId)
                },
                select: {
                    id: true
                }
            });

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
            const serviceRequest = await prisma.serviceRequest.create({
                data: {
                    user_id: parseInt(userId),
                    service_id: parseInt(serviceId),
                    details: details
                }
            });

            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Service request submitted successfully',
                requestId: serviceRequest.id
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Request service error:', error);
            Sentry.captureException(error);
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
