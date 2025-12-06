/**
 * AI Chat API endpoint for Cloudflare Workers AI integration
 * Handles chat conversations, messages, model selection, and system prompt management
 */

export async function onRequest(context) {
    const { request, env } = context;
    const requestData = await request.json();
    const action = requestData.action;
    const userId = requestData.userId;
    const token = requestData.token;

    if (action === "getAvailableModels") {
        return await getAvailableModels(env);
    }

    // Validate authentication for all actions
    if (!userId || !token) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Authentication required'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verify user and get role
    const user = await env.DB.prepare(`
        SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
    `).bind(parseInt(userId), token).first();

    if (!user) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Invalid authentication'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Check if user has at least 'user' role (not 'unverified')
    if (user.role === 'unverified') {
        return new Response(JSON.stringify({
            success: false,
            message: 'Email verification required to access AI chat'
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        switch (action) {
            case 'getConversations':
                return await getConversations(env, userId);
            
            case 'getConversation':
                return await getConversation(env, userId, requestData.conversationId);
            
            case 'createConversation':
                return await createConversation(env, userId, requestData.title, requestData.model);
            
            case 'deleteConversation':
                return await deleteConversation(env, userId, requestData.conversationId);
            
            case 'sendMessage':
                return await sendMessage(env, userId, requestData.conversationId, requestData.message, requestData.model);

            case 'getAvailableModels':
                return await getAvailableModels(env);
            
            case 'getSystemPrompt':
                return await getSystemPrompt(env);
            
            case 'updateSystemPrompt':
                // Only admins and root can update system prompt
                if (user.role !== 'admin' && user.role !== 'root') {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Admin access required to update system prompt'
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                return await updateSystemPrompt(env, userId, requestData.systemPrompt);
            
            default:
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Invalid action'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        console.error('AI Chat error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'An error occurred',
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Get all conversations for a user
 */
async function getConversations(env, userId) {
    const conversations = await env.DB.prepare(`
        SELECT id, title, model, created_at, updated_at 
        FROM chat_conversations 
        WHERE user_id = ?1 
        ORDER BY updated_at DESC
    `).bind(parseInt(userId)).all();

    return new Response(JSON.stringify({
        success: true,
        conversations: conversations.results
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Get a specific conversation with all its messages
 */
async function getConversation(env, userId, conversationId) {
    // Verify conversation belongs to user
    const conversation = await env.DB.prepare(`
        SELECT id, title, model, created_at, updated_at 
        FROM chat_conversations 
        WHERE id = ?1 AND user_id = ?2 
        LIMIT 1
    `).bind(parseInt(conversationId), parseInt(userId)).first();

    if (!conversation) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Conversation not found'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Get all messages for this conversation
    const messages = await env.DB.prepare(`
        SELECT id, role, content, created_at 
        FROM chat_messages 
        WHERE conversation_id = ?1 
        ORDER BY created_at ASC
    `).bind(parseInt(conversationId)).all();

    return new Response(JSON.stringify({
        success: true,
        conversation: conversation,
        messages: messages.results
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Create a new conversation
 */
async function createConversation(env, userId, title, model = '@cf/meta/llama-2-7b-chat-int8') {
    const result = await env.DB.prepare(`
        INSERT INTO chat_conversations (user_id, title, model, created_at, updated_at)
        VALUES (?1, ?2, ?3, datetime('now'), datetime('now'))
    `).bind(parseInt(userId), title, model).run();

    const conversationId = result.meta.last_row_id;

    return new Response(JSON.stringify({
        success: true,
        conversationId: conversationId,
        message: 'Conversation created successfully'
    }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Delete a conversation
 */
async function deleteConversation(env, userId, conversationId) {
    // Verify conversation belongs to user
    const conversation = await env.DB.prepare(`
        SELECT id FROM chat_conversations WHERE id = ?1 AND user_id = ?2 LIMIT 1
    `).bind(parseInt(conversationId), parseInt(userId)).first();

    if (!conversation) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Conversation not found'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Delete conversation (messages will be deleted via CASCADE)
    await env.DB.prepare(`
        DELETE FROM chat_conversations WHERE id = ?1
    `).bind(parseInt(conversationId)).run();

    return new Response(JSON.stringify({
        success: true,
        message: 'Conversation deleted successfully'
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Send a message and get AI response
 */
async function sendMessage(env, userId, conversationId, userMessage, model) {
    // Verify conversation belongs to user
    const conversation = await env.DB.prepare(`
        SELECT id, model FROM chat_conversations WHERE id = ?1 AND user_id = ?2 LIMIT 1
    `).bind(parseInt(conversationId), parseInt(userId)).first();

    if (!conversation) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Conversation not found'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Use provided model or conversation's default model
    const selectedModel = model || conversation.model;

    // Get system prompt
    const systemPromptResult = await env.DB.prepare(`
        SELECT value FROM ai_settings WHERE key = 'system_prompt' LIMIT 1
    `).bind().first();
    const systemPrompt = systemPromptResult ? systemPromptResult.value : 'You are a helpful AI assistant.';

    // Get conversation history (last 10 messages for context)
    const historyResult = await env.DB.prepare(`
        SELECT role, content FROM chat_messages 
        WHERE conversation_id = ?1 
        ORDER BY created_at DESC 
        LIMIT 10
    `).bind(parseInt(conversationId)).all();
    
    // Reverse to get chronological order
    const history = historyResult.results.reverse();

    // Save user message
    await env.DB.prepare(`
        INSERT INTO chat_messages (conversation_id, role, content, created_at)
        VALUES (?1, 'user', ?2, datetime('now'))
    `).bind(parseInt(conversationId), userMessage).run();

    // Prepare messages for AI
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: userMessage }
    ];

    try {
        // Call Cloudflare Workers AI
        const aiResponse = await env.AI.run(selectedModel, {
            messages: messages
        });

        const assistantMessage = aiResponse.response || 'Sorry, I could not generate a response.';

        // Save assistant message
        await env.DB.prepare(`
            INSERT INTO chat_messages (conversation_id, role, content, created_at)
            VALUES (?1, 'assistant', ?2, datetime('now'))
        `).bind(parseInt(conversationId), assistantMessage).run();

        // Update conversation timestamp
        await env.DB.prepare(`
            UPDATE chat_conversations SET updated_at = datetime('now'), model = ?1 WHERE id = ?2
        `).bind(selectedModel, parseInt(conversationId)).run();

        return new Response(JSON.stringify({
            success: true,
            message: assistantMessage
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('AI execution error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Failed to get AI response',
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Get list of available Cloudflare Workers AI models
 */
async function getAvailableModels(env) {
    // List of popular Cloudflare Workers AI models

    const url = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/models/search&per_page=100`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${env.CF_TOKEN}` }
    });

    if (!res.ok) {
        throw new Error(`Cloudflare API said nope: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify({data}), {status: 200});

    if (!data.success) {
        throw new Error(`Cloudflare API returned error. URL: ${url} Response: ${JSON.stringify(data)}`);
    }

    let models = [];

    for (const model of data.result) {
        if (model.task?.name === "Text Generation") {
            models.push({ id: model.name, name: model.name });
        }
    }

    return new Response(JSON.stringify({
        success: true,
        models: models
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Get current system prompt
 */
async function getSystemPrompt(env) {
    const result = await env.DB.prepare(`
        SELECT value FROM ai_settings WHERE key = 'system_prompt' LIMIT 1
    `).first();

    return new Response(JSON.stringify({
        success: true,
        systemPrompt: result ? result.value : 'You are a helpful AI assistant.'
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Update system prompt (admin only)
 */
async function updateSystemPrompt(env, userId, systemPrompt) {
    await env.DB.prepare(`
        UPDATE ai_settings 
        SET value = ?1, updated_by = ?2, updated_at = datetime('now') 
        WHERE key = 'system_prompt'
    `).bind(systemPrompt, parseInt(userId)).run();

    return new Response(JSON.stringify({
        success: true,
        message: 'System prompt updated successfully'
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
