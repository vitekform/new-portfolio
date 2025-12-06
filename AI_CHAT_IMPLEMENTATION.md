# AI Chat Feature - Implementation Guide

## Overview
AI Chat has been successfully integrated into the management dashboard, powered by Cloudflare Workers AI. This feature allows users to have conversations with AI models directly from the platform.

## Features Implemented

### 1. **Chat Interface**
- Clean, modern chat interface with conversation history
- Real-time message sending and receiving
- Support for multiple concurrent conversations
- Conversation management (create, view, delete)

### 2. **Model Selection**
Available Cloudflare Workers AI models:
- Llama 2 7B Chat (default)
- Llama 3 8B Instruct
- Llama 3.1 8B Instruct
- Llama 3.2 1B Instruct
- Llama 3.2 3B Instruct
- Mistral 7B Instruct v0.1
- Mistral 7B Instruct v0.2 LoRA
- DeepSeek Coder 6.7B Instruct
- Neural Chat 7B v3.1
- Qwen 1.5 14B Chat
- Gemma 7B IT
- Gemma 2 9B IT
- Phi-2
- TinyLlama 1.1B Chat

### 3. **Access Control**
- **User Role (and above)**: Access to AI chat, create conversations, send messages
- **Admin/Root Role**: Additional access to modify system prompts

### 4. **System Prompt Management**
- Admins can customize the AI's behavior through system prompt configuration
- System prompts apply to all new conversations
- Default prompt: "You are a helpful AI assistant."

## Database Schema

Three new tables were added:

1. **chat_conversations**: Stores conversation metadata
   - user_id, title, model, timestamps
   
2. **chat_messages**: Stores all chat messages
   - conversation_id, role (user/assistant/system), content, timestamp
   
3. **ai_settings**: Stores AI configuration
   - System prompt and other settings

## API Endpoints

New endpoint: `/api/manage/aiChat.js`

Actions supported:
- `getConversations`: List all user conversations
- `getConversation`: Get specific conversation with messages
- `createConversation`: Create new conversation
- `deleteConversation`: Delete a conversation
- `sendMessage`: Send message and get AI response
- `getAvailableModels`: List available AI models
- `getSystemPrompt`: Get current system prompt
- `updateSystemPrompt`: Update system prompt (admin only)

## Configuration Files Updated

1. **wrangler.toml**: Added AI binding configuration
2. **manageApps.json**: Added AI Chat menu item
3. **App.jsx**: Added route for AI Chat app
4. **ManageLayout.jsx**: Added FaRobot icon
5. **dbFix.js**: Extended database schema with AI chat tables
6. **.gitignore**: Added .wrangler directory

## Files Created

1. `/functions/api/manage/aiChat.js` - Backend API endpoint
2. `/src/components/manage/AIChat.jsx` - Main chat component
3. `/src/components/manage/apps/AIChatApp.jsx` - App wrapper
4. `/schema-ai-chat.sql` - Database migration (for reference)

## Usage Instructions

### For Users
1. Navigate to "AI Chat" in the management dashboard sidebar
2. Click "New Chat" to create a conversation
3. Enter a title for your conversation
4. Select an AI model from the dropdown
5. Type messages and click send or press Enter
6. View conversation history on the left sidebar
7. Delete conversations using the trash icon

### For Admins
1. Click the settings icon (gear) in the chat header
2. Edit the system prompt textarea
3. Click "Save System Prompt" to apply changes
4. The new prompt will affect all subsequent conversations

## Security Features

- Authentication required for all actions
- Email verification required (unverified users blocked)
- Role-based access control
- Admin-only system prompt modification
- User can only access their own conversations
- SQL injection protection through parameterized queries

## Next Steps for Deployment

1. **Database Setup**: Run the database migration to create the AI chat tables:
   ```bash
   npx wrangler d1 execute portfolio_db --file=schema-ai-chat.sql --remote
   ```

2. **Workers AI Binding**: Ensure your Cloudflare account has Workers AI enabled

3. **Deploy**: Deploy the application to Cloudflare Pages:
   ```bash
   yarn build
   npx wrangler pages deploy dist
   ```

## Testing Checklist

- [x] Build succeeds without errors
- [x] Database schema created
- [x] API endpoint implemented
- [x] Frontend component created
- [x] Routes configured
- [x] Icons added
- [ ] Manual testing with live deployment
- [ ] Test conversation creation
- [ ] Test message sending/receiving
- [ ] Test model selection
- [ ] Test admin system prompt editing
- [ ] Test access control

## Troubleshooting

### Issue: "Workers AI not available"
**Solution**: Ensure your Cloudflare account has Workers AI enabled and the AI binding is configured in wrangler.toml

### Issue: "Conversation not found"
**Solution**: Ensure user is authenticated and has permission to access the conversation

### Issue: "Failed to get AI response"
**Solution**: Check model availability and Cloudflare Workers AI status

## Notes

- Message history is limited to the last 10 messages for context to manage token usage
- All timestamps are stored in UTC
- Conversations are sorted by last updated time
- Deleting a conversation also deletes all its messages (CASCADE)
