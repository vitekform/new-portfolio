import prisma from '../lib/prisma.js';
import * as Sentry from "@sentry/node";

Sentry.init({
    dsn: "https://342a3da4b820d22a01431d0c0201a770@o4508938006626304.ingest.de.sentry.io/4509362550734928",

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});

// Initialize default services if they don't exist
async function initializeServices() {
    try {
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

// Initialize default services when the module is loaded
initializeServices().catch(error => {
    console.error('Error during service initialization:', error);
    Sentry.captureException(error);
});

export async function POST(request) {
    // Parse the request body
    const requestData = await request.json();
    const action = requestData.action;

    if (action === 'getServices') {
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
