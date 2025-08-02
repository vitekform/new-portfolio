export async function onRequest(context) {
    // Parse the request body
    const { request, env } = context;
    // Parse the request body
    const requestData = await request.json();
    const action = requestData.action;

    if (action === 'checkLatencyDB') {
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
                latency: dbLatency
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
    } else if (action === "checkStatusPanel") {
        try {
            fetch("https://panel.ganamaga.me").then(response => {
                return new Response(JSON.stringify({
                    success: true,
                    message: "Panel online!",
                    online: true
                }))
            });
        }   catch (e) {
            // Just in case
            console.error(e);
            return new Response(JSON.stringify({
                success: false,
                message: 'Failed to check status panel (most likely because panel is offline)',
            online: false}))
        }
    } else if (action === "checkLatencyNode1") {
        try {
            const startTime = performance.now();
            // Perform fetch to cz1.node.ganamaga.me
            fetch("https://panel.ganamaga.me").then(response => {

            });
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);
            return new Response(JSON.stringify({
                success: true,
                message: "Node online with " + latency + "ms of latency!",
                latency: latency
            }));
        }   catch (e) {
            console.error(e);
            return new Response(JSON.stringify({
                success: false,
                message: 'Failed to check status of node',
            }))
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