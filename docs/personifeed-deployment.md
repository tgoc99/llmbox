# personi[feed] - Deployment Guide

Complete guide for deploying personi[feed] to production.

## Prerequisites

- Supabase account and project
- OpenAI API key
- SendGrid account with verified domain
- Vercel account (for web hosting)
- Deno and Supabase CLI installed

## Step 1: Database Setup

### 1.1 Apply Database Migration

```bash
# From repository root
cd llmbox

# Apply the personifeed schema migration
deno task db:push

# Or using Supabase CLI directly
supabase db push
```

This will create the following tables:
- `users` - Newsletter subscribers
- `customizations` - User preferences and feedback
- `newsletters` - Generated newsletter history

### 1.2 Verify Tables Created

```sql
-- Connect to your database and verify:
SELECT * FROM users LIMIT 1;
SELECT * FROM customizations LIMIT 1;
SELECT * FROM newsletters LIMIT 1;
```

## Step 2: Configure Secrets

Set all required environment variables as Supabase secrets:

```bash
# OpenAI API Key (reused from llmbox)
deno task secrets:set:key OPENAI_API_KEY=sk-...

# SendGrid API Key (reused from llmbox)
deno task secrets:set:key SENDGRID_API_KEY=SG...

# Personifeed email domain (for dynamic reply addresses)
deno task secrets:set:key PERSONIFEED_EMAIL_DOMAIN=mail.personifeed.com

# Supabase connection (automatically set by Supabase)
# SUPABASE_URL - automatically provided
# SUPABASE_SERVICE_ROLE_KEY - automatically provided

# Optional: Configure OpenAI model and settings
deno task secrets:set:key OPENAI_MODEL=gpt-4o-mini
deno task secrets:set:key OPENAI_TEMPERATURE=0.7
deno task secrets:set:key OPENAI_MAX_TOKENS=2000
deno task secrets:set:key ENABLE_WEB_SEARCH=true
deno task secrets:set:key LOG_LEVEL=INFO
```

### Verify Secrets

```bash
deno task secrets:list
```

## Step 3: Deploy Edge Functions

### 3.1 Deploy All Personifeed Functions

```bash
# Deploy all three functions at once
deno task deploy:personifeed:all
```

Or deploy individually:

```bash
# Deploy signup function
deno task deploy:personifeed:signup

# Deploy cron function
deno task deploy:personifeed:cron

# Deploy reply handler
deno task deploy:personifeed:reply
```

### 3.2 Verify Deployments

Check Supabase Dashboard → Edge Functions to confirm:
- ✅ personifeed-signup
- ✅ personifeed-cron
- ✅ personifeed-reply

## Step 4: Configure Cron Job

### 4.1 Set Up Daily Cron Trigger

In Supabase Dashboard:

1. Go to **Database** → **Cron Jobs**
2. Click **Create Cron Job**
3. Configure:
   - **Name**: `personifeed-daily-newsletter`
   - **Schedule**: `0 15 * * *` (11am ET = 3pm UTC, adjust for DST)
   - **SQL Query**:
   ```sql
   SELECT
     net.http_post(
       url:='https://[your-project-ref].supabase.co/functions/v1/personifeed-cron',
       headers:='{"Content-Type": "application/json", "Authorization": "Bearer [service-role-key]"}'::jsonb
     ) AS request_id;
   ```
4. Click **Create**

### 4.2 Test Cron Job Manually

```bash
# Trigger cron job manually
curl -X POST \
  https://[your-project-ref].supabase.co/functions/v1/personifeed-cron \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Cron job completed",
  "stats": {
    "totalUsers": 0,
    "successCount": 0,
    "failureCount": 0,
    "durationMs": 123
  }
}
```

## Step 5: Configure SendGrid

### 5.1 Verify Sender Domain

1. Go to SendGrid Dashboard → **Settings** → **Sender Authentication**
2. Verify domain for `personifeed.com` (or your domain)
3. Add DNS records as instructed

### 5.2 Configure Inbound Parse (for Reply Emails)

**Important**: Personifeed uses **dynamic reply addresses** in the format `reply+{userId}@mail.personifeed.com` to route user replies back to their account. SendGrid Inbound Parse must be configured to capture all `reply+*@` emails.

1. Go to **Settings** → **Inbound Parse**
2. Click **Add Host & URL**
3. Configure:
   - **Receiving Domain**: `mail.personifeed.com`
   - **URL**: `https://[your-project-ref].supabase.co/functions/v1/personifeed-reply`
   - **Spam Check**: Enabled
   - **Send Raw**: Disabled (we want parsed format)
4. Save

### 5.3 Update DNS for Inbound Parse

Add MX records to your domain:

```
mail.personifeed.com.  MX  10  mx.sendgrid.net.
```

### 5.4 Test Inbound Parse

**Note**: With dynamic reply addresses, each user gets a unique address like `reply+{userId}@mail.personifeed.com`. SendGrid's wildcard inbound parse will route all `reply+*@mail.personifeed.com` emails to the webhook.

To test:
1. Sign up a test user via the landing page
2. Check the database for their `user_id`
3. Send a test email to `reply+{user_id}@mail.personifeed.com`
4. Verify in Supabase logs:
   - Should see `reply_received` with correct userId extraction
   - Should see `feedback_stored`
5. Should receive confirmation email from the same `reply+{user_id}@` address

## Step 6: Deploy Web Application

### 6.1 Update Environment Variables

Create/update `.env.local` in `web/` directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
```

### 6.2 Deploy to Vercel

```bash
cd web

# Build production bundle
npm run build

# Deploy to Vercel
vercel deploy --prod
```

Or use Vercel Dashboard:
1. Connect GitHub repository
2. Configure build settings:
   - **Framework**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Add environment variable: `NEXT_PUBLIC_SUPABASE_URL`
4. Deploy

### 6.3 Verify Web App

Visit `https://your-domain.com/personifeed` and test:
1. Landing page loads correctly
2. Signup form is visible
3. Submit test signup
4. Verify success message

## Step 7: End-to-End Testing

### 7.1 Test Signup Flow

1. Visit landing page: `/personifeed`
2. Enter email and prompt
3. Submit form
4. Verify:
   - Success message displayed
   - User created in database
   - Initial customization stored

### 7.2 Test Newsletter Generation

```bash
# Manually trigger cron job
curl -X POST \
  https://[your-project-ref].supabase.co/functions/v1/personifeed-cron \
  -H "Authorization: Bearer [service-role-key]"
```

Verify:
1. Check logs for newsletter generation
2. Check email inbox for newsletter
3. Verify newsletter stored in database with status='sent'

### 7.3 Test Reply Flow

1. Reply to newsletter email
2. Verify:
   - Feedback stored in database
   - Confirmation email received
   - Check logs for `reply_received` event

### 7.4 Test Complete User Journey

1. **Day 1**: Sign up with email + prompt
2. **Day 2**: Receive first newsletter at 11am ET
3. **Day 2**: Reply with feedback
4. **Day 2**: Receive confirmation email
5. **Day 3**: Receive updated newsletter incorporating feedback

## Step 8: Monitoring & Logging

### 8.1 View Logs

```bash
# View recent logs
supabase functions logs personifeed-signup --project-ref [your-project-ref]
supabase functions logs personifeed-cron --project-ref [your-project-ref]
supabase functions logs personifeed-reply --project-ref [your-project-ref]
```

Or use Supabase Dashboard:
- **Edge Functions** → Select function → **Logs** tab

### 8.2 Key Metrics to Monitor

- **Signup Rate**: New users per day
- **Newsletter Delivery Rate**: `successCount / totalUsers` from cron logs
- **Reply Rate**: Feedback customizations per user
- **Error Rate**: Check ERROR and CRITICAL logs
- **Performance**: Monitor `durationMs` in logs

### 8.3 Set Up Alerts (Optional)

Consider setting up alerts for:
- Cron job failures
- High error rates (>5%)
- Slow newsletter generation (>60s per user)
- SendGrid delivery failures

## Step 9: Cost Monitoring

### 9.1 Expected Costs (100 users/day)

- **OpenAI API**: ~$30/month
  - gpt-4o-mini: ~$0.30 per 100 newsletters
  - gpt-4o: ~$3 per 100 newsletters
- **Supabase**: Free (within 500MB database limit)
- **SendGrid**: Free (within 100 emails/day limit)
- **Vercel**: Free (static site)

**Total**: ~$30-40/month for 100 users

### 9.2 Cost Optimization Tips

1. Use `gpt-4o-mini` instead of `gpt-4o` (10x cheaper)
2. Limit `max_tokens` to 2000 (shorter newsletters)
3. Monitor SendGrid usage (upgrade if >100 emails/day)
4. Batch process users in cron job (10 at a time)

## Step 10: Maintenance

### 10.1 Database Cleanup

Optionally archive old newsletters:

```sql
-- Delete newsletters older than 90 days
DELETE FROM newsletters
WHERE created_at < NOW() - INTERVAL '90 days';
```

### 10.2 Update Functions

```bash
# Redeploy functions after code changes
deno task deploy:personifeed:all
```

### 10.3 Update Database Schema

```bash
# Create new migration
supabase migration new [migration-name]

# Apply migration
deno task db:push
```

## Troubleshooting

### Issue: Cron job not running

**Solution**:
1. Check cron job configuration in Supabase Dashboard
2. Verify schedule is correct (adjust for timezone/DST)
3. Check function logs for errors
4. Ensure service role key is correct

### Issue: Newsletters not sending

**Solution**:
1. Check SendGrid API key is set correctly
2. Verify sender email is authenticated
3. Check SendGrid dashboard for bounces/blocks
4. Review function logs for `sendgrid_send_failed` errors

### Issue: Replies not processed

**Solution**:
1. Verify SendGrid Inbound Parse is configured
2. Check MX records are correct
3. Test by sending email to reply address
4. Check function logs for webhook errors

### Issue: Signup form not submitting

**Solution**:
1. Check browser console for errors
2. Verify CORS headers are set in function
3. Test signup function directly with curl
4. Check function logs for validation errors

## Security Checklist

- ✅ API keys stored as Supabase secrets (not in code)
- ✅ JWT verification enabled for cron function
- ✅ Input validation on all user inputs
- ✅ Email addresses validated with regex
- ✅ Prompt length limited to 2000 characters
- ✅ SendGrid webhook uses HTTPS
- ⚠️ SendGrid webhook signature verification (post-MVP)
- ✅ Database uses service role key (elevated permissions)
- ✅ CORS headers configured for signup function

## Success Criteria

Your deployment is successful when:

✅ Database tables created and queryable
✅ All three Edge Functions deployed and responding
✅ Cron job running daily at 11am ET
✅ SendGrid Inbound Parse configured and receiving emails
✅ Web app deployed and accessible
✅ End-to-end user journey works (signup → newsletter → reply → updated newsletter)
✅ Logs show no critical errors
✅ Emails delivering successfully

## Next Steps

After successful deployment:

1. **Announce launch**: Share landing page with early users
2. **Monitor metrics**: Track signups, delivery rates, reply rates
3. **Gather feedback**: Ask users for feedback on newsletters
4. **Iterate**: Improve prompts, add features, optimize costs
5. **Scale**: Add more features from post-MVP roadmap

## Support

For issues or questions:
- Check function logs in Supabase Dashboard
- Review integration tests: `deno task test:integration:personifeed`
- Consult architecture doc: `docs/personifeed-architecture.md`
- Consult PRD: `docs/personifeed-prd.md`

