import { initializeD1Client, executeQueryRun, executeQuery } from '../lib/d1.js';
import { getServices } from './actions/getServices.js';
import { requestService } from './actions/requestService.js';
import { getServiceRequests } from './actions/getServiceRequests.js';

// Initialize default services if they don't exist
async function initializeServices() {
    try {
        // Check if any services exist
        const result = await executeQuery('SELECT COUNT(*) as count FROM Service');
        const servicesCount = result.results[0].count;

        if (servicesCount === 0) {
            // Insert default services
            const services = [
                ['Web Hosting', 'Reliable web hosting services with 99.9% uptime guarantee.'],
                ['File Cloud', 'Secure cloud storage for your files with easy access from anywhere.'],
                ['Application Server', 'Dedicated application server for your custom applications.'],
                ['CI / CD', 'Continuous Integration and Continuous Deployment pipeline setup and management.']
            ];

            for (const [name, description] of services) {
                await executeQueryRun(
                    'INSERT INTO Service (name, description, created_at) VALUES (?, ?, datetime("now"))',
                    [name, description]
                );
            }

            console.log('Default services initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing services:', error);
    }
}

export async function onRequest(context) {
    const { request, env } = context;

    // Initialize D1 client
    initializeD1Client(env);

    if (request.method === 'POST') {
        // Initialize default services when the module is loaded
        await initializeServices();

        // Parse the request body
        const requestData = await request.json();
        const action = requestData.action;

        switch (action) {
            case 'getServiceRequests':
                return await getServiceRequests(requestData);
            case 'getServices':
                return await getServices(requestData);
            case 'requestService':
                return await requestService(requestData);
            default:
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid action'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
    }

    return new Response('Method not allowed', { status: 405 });
}