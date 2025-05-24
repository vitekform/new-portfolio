import { initializeD1Client } from '../lib/prisma.js';

export function onRequest(context) {
    return (async () => {
        const request = context.request;
        const env = context.env;

        // Initialize the D1 client with the environment
        initializeD1Client(env);

        // Parse the request body
        const requestData = await request.json();
        const action = requestData.action;

        if (action === 'checkLatency') {
            try {
                // Measure database latency
                const dbStartTime = performance.now();

                // Simple query to test database connection using D1
                const d1Client = initializeD1Client(env);
                await d1Client.db.prepare('SELECT 1').first();

                const dbEndTime = performance.now();
                const dbLatency = Math.round(dbEndTime - dbStartTime);

                return new Response(JSON.stringify({ 
                    success: true, 
                    message: 'Latency check successful',
                    dbLatency: dbLatency
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                console.error('Database latency check error:', error);
                return new Response(JSON.stringify({
                    success: false, 
                    message: 'Failed to check database latency' 
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
    })();
}
