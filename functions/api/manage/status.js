import prisma, { initializeD1Client } from '../lib/prisma.js';
import * as Sentry from '@sentry/node';

Sentry.init({
    dsn: "https://342a3da4b820d22a01431d0c0201a770@o4508938006626304.ingest.de.sentry.io/4509362550734928",

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,

    // Disable HTTP instrumentation to avoid "this.enable is not a function" error
    integrations: (integrations) => {
        return integrations.filter(integration => integration.name !== 'Http');
    }
});

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
                Sentry.captureException(error);
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
