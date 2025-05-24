import { initializeD1Client } from '../lib/d1.js';
import { checkLatency } from './actions/checkLatency.js';

export async function onRequest(context) {
    const { request, env } = context;

    // Initialize D1 client
    initializeD1Client(env);

    if (request.method === 'POST') {
        return await checkLatency(request, env);
    }

    return new Response('Method not allowed', { status: 405 });
}