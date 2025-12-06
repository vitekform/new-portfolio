# AI Chat Feature - Deployment Guide

## Prerequisites

1. **Cloudflare Account** with:
   - Workers AI access enabled
   - D1 Database configured
   - Pages deployment set up

2. **Repository Access**:
   - Push access to deploy branch
   - Environment variables configured

## Step-by-Step Deployment

### Step 1: Database Migration

Run the database migration to create AI chat tables:

```bash
# For local testing
npx wrangler d1 execute portfolio_db --file=schema-ai-chat.sql

# For production
npx wrangler d1 execute portfolio_db --file=schema-ai-chat.sql --remote
```

**Verify migration:**
```bash
npx wrangler d1 execute portfolio_db --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'chat_%';" --remote
```

Expected output should show:
- chat_conversations
- chat_messages
- ai_settings

### Step 2: Verify Workers AI Binding

Check that `wrangler.toml` has the AI binding configured:

```toml
[ai]
binding = "AI"
```

### Step 3: Build the Application

```bash
# Install dependencies (if not already done)
yarn install

# Build for production
yarn build
```

### Step 4: Deploy to Cloudflare Pages

```bash
# Deploy using Wrangler
npx wrangler pages deploy dist

# Or use Cloudflare dashboard for automatic deployments
# Connect your GitHub repository in Cloudflare Pages settings
```

### Step 5: Configure Environment Variables

In Cloudflare Pages dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Set these optional variables for email customization:
   - `SMTP_FROM_EMAIL` (optional, defaults to "noreply@example.com")
   - `SMTP_FROM_NAME` (optional, defaults to "Portfolio")

**Note**: Email functionality now uses MailChannels API which is free for Cloudflare Workers and doesn't require SMTP credentials.

### Step 6: Initial Database Setup (If Needed)

If database tables don't exist yet, use the emergency database setup:

1. Deploy the application
2. Call the setup endpoint with proper credentials
3. Verify all tables are created

### Step 7: Verify Deployment

1. **Access the Application**:
   - Navigate to your Cloudflare Pages URL
   - Log in with your credentials

2. **Test AI Chat**:
   - Click on "AI Chat" in the sidebar
   - Create a new conversation
   - Send a test message
   - Verify AI response

3. **Test Admin Features** (if applicable):
   - Open settings panel
   - Modify system prompt
   - Save and verify changes

## Troubleshooting

### Issue: AI Chat not visible in menu

**Solution**:
1. Verify user has "user" role or higher (not "unverified")
2. Check browser console for errors
3. Clear browser cache and reload

### Issue: "Workers AI not available" error

**Solution**:
1. Verify Workers AI is enabled in your Cloudflare account
2. Check wrangler.toml has correct AI binding
3. Ensure you're on a plan that includes Workers AI
4. Review Cloudflare dashboard for AI service status

### Issue: Database errors

**Solution**:
1. Verify migration was run successfully
2. Check D1 database binding in wrangler.toml
3. Ensure database_id matches your D1 database
4. Review Cloudflare dashboard for D1 status

### Issue: "Failed to get AI response"

**Possible Causes & Solutions**:

1. **Model not available**:
   - Try a different model from the dropdown
   - Check Cloudflare AI model availability

2. **Rate limiting**:
   - Wait a few moments and try again
   - Check Cloudflare Workers AI quotas

3. **Invalid prompt**:
   - Ensure message is not empty
   - Check system prompt is valid

4. **API error**:
   - Check browser console for detailed error
   - Review Cloudflare Workers logs

### Issue: System prompt update not working

**Solution**:
1. Verify user has admin or root role
2. Check network tab for API response
3. Ensure ai_settings table exists in database
4. Try reloading the page after update

## Post-Deployment Verification Checklist

- [ ] Database tables created successfully
- [ ] AI Chat menu item visible to users
- [ ] Can create new conversations
- [ ] Can send messages and receive AI responses
- [ ] Can select different AI models
- [ ] Can delete conversations
- [ ] Admins can modify system prompt
- [ ] Non-admins cannot modify system prompt
- [ ] Unverified users cannot access AI chat
- [ ] Error messages display properly
- [ ] Success messages display properly
- [ ] Conversations persist after page reload
- [ ] Message history loads correctly
- [ ] Timestamps display correctly

## Monitoring

### Key Metrics to Monitor

1. **API Response Times**:
   - Average response time for AI API calls
   - Database query performance

2. **Error Rates**:
   - Failed AI requests
   - Database errors
   - Authentication failures

3. **Usage Statistics**:
   - Number of conversations created
   - Messages sent per day
   - Popular AI models

4. **Cloudflare Metrics**:
   - Workers AI usage/quotas
   - D1 database operations
   - Request volume

### Logging

Check logs in Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your project
3. View Logs tab
4. Filter for AI chat related logs

## Rollback Plan

If issues arise after deployment:

1. **Quick Rollback**:
   ```bash
   # Revert to previous deployment in Cloudflare dashboard
   # Or redeploy previous commit
   git checkout <previous-commit>
   yarn build
   npx wrangler pages deploy dist
   ```

2. **Database Rollback** (if needed):
   ```bash
   # Drop AI chat tables
   npx wrangler d1 execute portfolio_db --command "DROP TABLE IF EXISTS chat_messages;" --remote
   npx wrangler d1 execute portfolio_db --command "DROP TABLE IF EXISTS chat_conversations;" --remote
   npx wrangler d1 execute portfolio_db --command "DROP TABLE IF EXISTS ai_settings;" --remote
   ```

## Support

For issues or questions:
1. Check Cloudflare Workers AI documentation
2. Review application logs in Cloudflare dashboard
3. Check GitHub repository issues
4. Contact development team

## Next Steps

After successful deployment:
1. Monitor usage and performance
2. Gather user feedback
3. Consider implementing rate limiting
4. Consider adding content filtering
5. Optimize AI model selection based on usage
6. Add analytics for AI interactions
