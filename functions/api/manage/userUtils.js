import { initializeD1Client } from '../lib/d1.js';
import { loginUser } from './actions/loginUser.js';
import { getUserData } from './actions/getUserData.js';

export async function onRequest(context) {
    const { request, env } = context;

    // Initialize D1 client
    initializeD1Client(env);

    if (request.method === 'POST') {
        // Parse the request body
        const requestData = await request.json();
        const action = requestData.action;

        switch (action) {
            case 'login':
                return await loginUser(requestData);
            case 'getUserData':
                return await getUserData(requestData);
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