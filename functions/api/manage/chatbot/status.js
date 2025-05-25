export async function onRequest(context) {
    const aiEndpoint = context.env.AI_ENDPOINT;
    const response = await fetch(`${aiEndpoint}/health`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        return new Response(JSON.stringify({ success: false, message: 'Failed to connect to AI service' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const data = await response.json();
    return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}