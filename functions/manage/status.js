import prisma from '../lib/prisma.js';
import * as Sentry from '@sentry/node';

Sentry.init({
    dsn: "https://342a3da4b820d22a01431d0c0201a770@o4508938006626304.ingest.de.sentry.io/4509362550734928",

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});

export async function POST(request) {
    // Parse the request body
    const requestData = await request.json();
    const action = requestData.action;

    if (action === 'checkLatency') {
        try {
            // Measure database latency
            const dbStartTime = performance.now();

            // Simple query to test database connection using Prisma
            await prisma.$queryRaw`SELECT 1`;

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
}
