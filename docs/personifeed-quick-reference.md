# personi[feed] - Quick Reference

Quick commands and reference for common tasks.

## 🚀 Deployment Commands

```bash
# Deploy all personifeed functions
deno task deploy:personifeed:all

# Deploy individual functions
deno task deploy:personifeed:signup
deno task deploy:personifeed:cron
deno task deploy:personifeed:reply

# Apply database migrations
deno task db:push

# Deploy web app
cd web && vercel deploy --prod
```

## 🧪 Testing Commands

```bash
# Run personifeed unit tests
deno task test:personifeed

# Run personifeed integration tests
deno task test:integration:personifeed

# Run all tests
deno task test

# Watch mode
deno task test:watch
```

## 🔑 Secret Management

```bash
# List all secrets
deno task secrets:list

# Set required secrets
deno task secrets:set:key OPENAI_API_KEY=sk-...
deno task secrets:set:key SENDGRID_API_KEY=SG...
deno task secrets:set:key PERSONIFEED_EMAIL_DOMAIN=mail.llmbox.pro

# Optional configuration
deno task secrets:set:key OPENAI_MODEL=gpt-4o-mini
deno task secrets:set:key OPENAI_TEMPERATURE=0.7
deno task secrets:set:key OPENAI_MAX_TOKENS=2000
deno task secrets:set:key LOG_LEVEL=INFO
```

## 📊 Database Commands

```bash
# View tables
supabase db diff

# Apply migration
deno task db:push

# Reset database (careful!)
deno task db:reset

# Manual SQL query
supabase db execute "SELECT * FROM users LIMIT 10;"
```

## 📝 Logging Commands

```bash
# View recent logs
supabase functions logs personifeed-signup --project-ref [your-ref]
supabase functions logs personifeed-cron --project-ref [your-ref]
supabase functions logs personifeed-reply --project-ref [your-ref]

# Tail logs (live)
supabase functions logs personifeed-cron --project-ref [your-ref] --tail
```

## 🧪 Manual Testing

### Test Signup Function

```bash
curl -X POST https://[your-ref].supabase.co/functions/v1/personifeed-signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "initialPrompt": "Send me AI news daily"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Success! Your first newsletter arrives tomorrow at 11am ET.",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Test Cron Function

```bash
curl -X POST https://[your-ref].supabase.co/functions/v1/personifeed-cron \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Cron job completed",
  "stats": {
    "totalUsers": 5,
    "successCount": 5,
    "failureCount": 0,
    "durationMs": 45678
  }
}
```

### Test Reply Function

```bash
# Create form data
curl -X POST https://[your-ref].supabase.co/functions/v1/personifeed-reply \
  -F "from=test@example.com" \
  -F "to=personifeed@mail.llmbox.pro" \
  -F "subject=Re: Your Daily Digest" \
  -F "text=Please add more tech news" \
  -F "headers=Message-ID: <test123@example.com>"
```

Expected response:
```json
{
  "success": true,
  "message": "Reply processed successfully"
}
```

## 🔍 Database Queries

### Check Active Users

```sql
SELECT COUNT(*) as active_users
FROM users
WHERE active = true;
```

### View Recent Signups

```sql
SELECT email, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

### View User Customizations

```sql
SELECT u.email, c.type, c.content, c.created_at
FROM customizations c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 20;
```

### Check Newsletter Delivery Stats

```sql
SELECT
  status,
  COUNT(*) as count,
  DATE(created_at) as date
FROM newsletters
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status, DATE(created_at)
ORDER BY date DESC;
```

### Find Users with Most Customizations

```sql
SELECT
  u.email,
  COUNT(*) as customization_count
FROM users u
JOIN customizations c ON u.id = c.user_id
GROUP BY u.email
ORDER BY customization_count DESC
LIMIT 10;
```

## 🚨 Troubleshooting

### View Recent Errors

```bash
# Check logs for errors
supabase functions logs personifeed-cron --project-ref [your-ref] | grep ERROR
```

### Check Cron Job Status

In Supabase Dashboard:
1. Go to **Database** → **Cron Jobs**
2. Check last run time and status

### Verify Function Deployment

```bash
supabase functions list --project-ref [your-ref]
```

Should show:
- ✅ email-webhook
- ✅ personifeed-signup
- ✅ personifeed-cron
- ✅ personifeed-reply

### Check Database Connection

```bash
supabase db ping --project-ref [your-ref]
```

## 📊 Monitoring Queries

### Daily Signup Rate

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as signups
FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Newsletter Delivery Rate

```sql
SELECT
  DATE(sent_at) as date,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN status = 'sent' THEN 1 END)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as success_rate_percent
FROM newsletters
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

### Reply/Feedback Rate

```sql
SELECT
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN c.type = 'feedback' THEN u.id END) as users_with_feedback,
  ROUND(
    COUNT(DISTINCT CASE WHEN c.type = 'feedback' THEN u.id END)::numeric /
    COUNT(DISTINCT u.id)::numeric * 100,
    2
  ) as feedback_rate_percent
FROM users u
LEFT JOIN customizations c ON u.id = c.user_id;
```

### Average Newsletter Generation Time

```bash
# From logs - filter for 'newsletter_generated' events
supabase functions logs personifeed-cron --project-ref [your-ref] | grep newsletter_generated
```

## 🛠️ Maintenance Commands

### Deactivate User

```sql
UPDATE users
SET active = false
WHERE email = 'user@example.com';
```

### Reactivate User

```sql
UPDATE users
SET active = true
WHERE email = 'user@example.com';
```

### Clean Old Newsletters (>90 days)

```sql
DELETE FROM newsletters
WHERE created_at < NOW() - INTERVAL '90 days';
```

### View Database Size

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/[your-ref]
- **Edge Functions**: https://supabase.com/dashboard/project/[your-ref]/functions
- **Database**: https://supabase.com/dashboard/project/[your-ref]/database
- **Logs**: https://supabase.com/dashboard/project/[your-ref]/logs/edge-functions
- **SendGrid Dashboard**: https://app.sendgrid.com
- **OpenAI Usage**: https://platform.openai.com/usage

## 📋 Environment Variables Checklist

Required:
- ✅ `OPENAI_API_KEY`
- ✅ `SENDGRID_API_KEY`
- ✅ `PERSONIFEED_FROM_EMAIL`
- ✅ `PERSONIFEED_REPLY_EMAIL`
- ✅ `SUPABASE_URL` (auto-set)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

Optional:
- ⚙️ `OPENAI_MODEL` (default: gpt-4o-mini)
- ⚙️ `OPENAI_TEMPERATURE` (default: 0.7)
- ⚙️ `OPENAI_MAX_TOKENS` (default: 2000)
- ⚙️ `ENABLE_WEB_SEARCH` (default: true)
- ⚙️ `LOG_LEVEL` (default: INFO)

## 🎯 Common Workflows

### Add New User Manually

```sql
BEGIN;
INSERT INTO users (email, active) VALUES ('newuser@example.com', true) RETURNING id;
-- Use returned id in next query
INSERT INTO customizations (user_id, content, type)
VALUES ('[returned-id]', 'Send me AI news', 'initial');
COMMIT;
```

### Test Full User Journey

```bash
# 1. Sign up
curl -X POST https://[your-ref].supabase.co/functions/v1/personifeed-signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "initialPrompt": "Test prompt"}'

# 2. Trigger newsletter generation
curl -X POST https://[your-ref].supabase.co/functions/v1/personifeed-cron \
  -H "Authorization: Bearer [service-role-key]"

# 3. Simulate reply
curl -X POST https://[your-ref].supabase.co/functions/v1/personifeed-reply \
  -F "from=test@example.com" \
  -F "text=Add more content"

# 4. Check logs
supabase functions logs personifeed-cron --project-ref [your-ref]
```

## 💡 Pro Tips

1. **Use gpt-4o-mini** for cost savings (10x cheaper than gpt-4o)
2. **Monitor OpenAI usage** regularly at platform.openai.com/usage
3. **Set up alerts** for error rate >5%
4. **Archive old newsletters** monthly to save database space
5. **Test cron job** manually before scheduling
6. **Keep logs** for at least 7 days for debugging
7. **Back up database** before major migrations
8. **Use staging environment** for testing changes

