export async function POST(request, env) {
    // Parse the request body
    const requestData = await request.json();
    const action = requestData.action;

    if (action === 'checkLatency') {
        try {
            // Measure database latency
            const dbStartTime = performance.now();

            // Simple query to test database connection using D1
            await env.DB.prepare(`SELECT 1`).first();

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
}