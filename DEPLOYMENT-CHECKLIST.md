# personi[feed] - Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## ✅ Pre-Deployment Checklist

### 1. Prerequisites

- [ ] Supabase account created
- [ ] Supabase CLI installed (`brew install supabase/tap/supabase`)
- [ ] OpenAI API key obtained
- [ ] SendGrid account created with verified domain
- [ ] Vercel account created
- [ ] Domain configured for email (MX records)

### 2. Local Setup

- [ ] Repository cloned: `git clone [repo-url]`
- [ ] Dependencies installed: `deno task web:install`
- [ ] Environment variables set in `.env.local`
- [ ] Unit tests passing: `deno task test:personifeed`

### 3. Database

- [ ] Migration file reviewed: `supabase/migrations/20251009000000_personifeed_schema.sql`
- [ ] Migration applied: `deno task db:push`
- [ ] Tables created and queryable:
  - [ ] `users`
  - [ ] `customizations`
  - [ ] `newsletters`
- [ ] Indexes created correctly

### 4. Secrets Configuration

- [ ] `OPENAI_API_KEY` set: `deno task secrets:set:key OPENAI_API_KEY=sk-...`
- [ ] `SENDGRID_API_KEY` set: `deno task secrets:set:key SENDGRID_API_KEY=SG...`
- [ ] `PERSONIFEED_FROM_EMAIL` set: `deno task secrets:set:key PERSONIFEED_FROM_EMAIL=newsletter@...`
- [ ] `PERSONIFEED_REPLY_EMAIL` set: `deno task secrets:set:key PERSONIFEED_REPLY_EMAIL=reply@...`
- [ ] Optional configs set (model, temperature, etc.)
- [ ] Secrets verified: `deno task secrets:list`

### 5. Edge Functions Deployment

- [ ] `personifeed-signup` deployed: `deno task deploy:personifeed:signup`
- [ ] `personifeed-cron` deployed: `deno task deploy:personifeed:cron`
- [ ] `personifeed-reply` deployed: `deno task deploy:personifeed:reply`
- [ ] All functions visible in Supabase Dashboard
- [ ] Function URLs noted for testing

### 6. Cron Job Configuration

- [ ] Supabase Dashboard → Database → Cron Jobs opened
- [ ] Cron job created: `personifeed-daily-newsletter`
- [ ] Schedule set: `0 15 * * *` (11am ET = 3pm UTC, adjust for DST)
- [ ] SQL query configured with correct project URL
- [ ] Service role key added to authorization header

### 7. SendGrid Configuration

- [ ] Sender domain verified in SendGrid Dashboard
- [ ] DNS records added for domain authentication
- [ ] Inbound Parse configured:
  - [ ] Domain: `mail.personifeed.com`
  - [ ] URL: `https://[project-ref].supabase.co/functions/v1/personifeed-reply`
  - [ ] Spam Check: Enabled
  - [ ] Send Raw: Disabled
- [ ] MX records added for Inbound Parse: `mx.sendgrid.net` (priority 10)
- [ ] Test email sent to verify delivery

### 8. Web Application

- [ ] Environment variable set: `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Production build tested: `npm run build`
- [ ] Build succeeds without errors
- [ ] Vercel project created
- [ ] Repository connected to Vercel
- [ ] Build settings configured:
  - [ ] Framework: Next.js
  - [ ] Root Directory: `web`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`
- [ ] Environment variable added in Vercel
- [ ] Deployed to production: `vercel deploy --prod`

---

## ✅ Deployment Testing Checklist

### 1. Test Signup Function

- [ ] Navigate to landing page: `https://[your-domain]/personifeed`
- [ ] Enter valid email and prompt
- [ ] Submit form
- [ ] Verify success message displayed
- [ ] Check database for new user: `SELECT * FROM users WHERE email = '...'`
- [ ] Check database for customization: `SELECT * FROM customizations WHERE user_id = '...'`

### 2. Test Cron Job Manually

```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/personifeed-cron \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json"
```

- [ ] Command executed successfully
- [ ] Response shows success: `"success": true`
- [ ] Check logs: `supabase functions logs personifeed-cron --project-ref [ref]`
- [ ] Check email inbox for newsletter
- [ ] Verify newsletter in database: `SELECT * FROM newsletters WHERE user_id = '...'`
- [ ] Verify status is 'sent'

### 3. Test Reply Function

- [ ] Reply to newsletter email with feedback
- [ ] Check logs: `supabase functions logs personifeed-reply --project-ref [ref]`
- [ ] Verify feedback in database: `SELECT * FROM customizations WHERE type = 'feedback'`
- [ ] Verify confirmation email received

### 4. Test Complete User Journey

- [ ] **Day 1**: Sign up with test email
- [ ] **Day 1**: Verify user created in database
- [ ] **Day 2 @ 11am ET**: Verify first newsletter received
- [ ] **Day 2**: Reply with feedback
- [ ] **Day 2**: Verify confirmation email received
- [ ] **Day 3 @ 11am ET**: Verify updated newsletter received with feedback incorporated

---

## ✅ Monitoring Setup Checklist

### 1. Logging

- [ ] Function logs accessible in Supabase Dashboard
- [ ] Log level set appropriately (INFO for production)
- [ ] Structured logging working (JSON format)
- [ ] No ERROR or CRITICAL logs appearing unexpectedly

### 2. Metrics to Track

- [ ] Daily signup count
- [ ] Newsletter delivery rate (success / total)
- [ ] Reply rate (feedback customizations / users)
- [ ] Error rate (failed operations / total)
- [ ] Average newsletter generation time

### 3. Alerts (Optional but Recommended)

- [ ] Alert for cron job failures
- [ ] Alert for error rate > 5%
- [ ] Alert for slow newsletter generation (> 60s)
- [ ] Alert for SendGrid delivery failures

---

## ✅ Performance Verification Checklist

### 1. Landing Page

- [ ] Page loads in < 2 seconds
- [ ] Forms are responsive
- [ ] No console errors
- [ ] Mobile view works correctly
- [ ] Character counter works

### 2. Newsletter Generation

- [ ] Generates newsletter in < 60s per user
- [ ] Total cron job for 100 users < 5 minutes
- [ ] No timeouts or failures

### 3. Reply Processing

- [ ] Confirmation email sent in < 10s
- [ ] Feedback stored correctly
- [ ] No retry loops

---

## ✅ Security Verification Checklist

### 1. Secrets Management

- [ ] No API keys in code
- [ ] All secrets stored in Supabase Secrets
- [ ] Service role key not exposed to frontend
- [ ] CORS configured correctly (only for signup function)

### 2. Input Validation

- [ ] Email format validated
- [ ] Prompt length validated (max 2000 chars)
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (no raw HTML rendering)

### 3. Function Security

- [ ] JWT verification enabled for cron function
- [ ] JWT verification disabled for public functions (signup, reply)
- [ ] Database access via service role key only
- [ ] No user-facing database queries

---

## ✅ Cost Monitoring Checklist

### 1. OpenAI Usage

- [ ] Model set to gpt-4o-mini (cost-effective)
- [ ] Max tokens limited to 2000
- [ ] Usage dashboard monitored: https://platform.openai.com/usage
- [ ] Estimated cost per newsletter verified (~$0.01)

### 2. SendGrid Usage

- [ ] Email count tracked
- [ ] Free tier limit known (100 emails/day)
- [ ] Plan to upgrade if exceeded
- [ ] Bounce/spam rates monitored

### 3. Supabase Usage

- [ ] Database size monitored (500MB free tier)
- [ ] Function invocation count tracked
- [ ] Plan to upgrade if needed

---

## ✅ Production Launch Checklist

### 1. Pre-Launch

- [ ] All deployment steps completed
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Error handling verified
- [ ] Cost estimates reviewed

### 2. Soft Launch (First 10 Users)

- [ ] Invite 10 test users
- [ ] Monitor first 24 hours closely
- [ ] Check logs for any errors
- [ ] Verify all users receive newsletters
- [ ] Collect initial feedback

### 3. Full Launch

- [ ] Announce on social media / website
- [ ] Monitor signups
- [ ] Monitor delivery rates
- [ ] Respond to user feedback
- [ ] Fix any issues quickly

---

## ✅ Post-Launch Checklist (First Week)

### Daily Tasks

- [ ] Check cron job executed successfully
- [ ] Review error logs
- [ ] Monitor newsletter delivery rate
- [ ] Check email deliverability (no spam reports)
- [ ] Review OpenAI costs

### Weekly Tasks

- [ ] Review signup trends
- [ ] Check reply/feedback rate
- [ ] Archive old newsletters (if > 1000)
- [ ] Review performance metrics
- [ ] Plan improvements based on feedback

---

## ✅ Troubleshooting Checklist

### Issue: Newsletters not sending

- [ ] Check OpenAI API key is set correctly
- [ ] Verify SendGrid API key is valid
- [ ] Check sender email is authenticated
- [ ] Review cron function logs for errors
- [ ] Verify users are marked as active in database
- [ ] Check cron job is scheduled correctly

### Issue: Cron job not running

- [ ] Verify cron job exists in Supabase Dashboard
- [ ] Check cron schedule is correct (timezone!)
- [ ] Verify service role key in SQL query
- [ ] Check function logs for errors
- [ ] Try triggering manually

### Issue: Replies not processed

- [ ] Verify SendGrid Inbound Parse is configured
- [ ] Check MX records are correct (`dig mail.personifeed.com MX`)
- [ ] Send test email to reply address
- [ ] Check reply function logs
- [ ] Verify webhook URL is correct

### Issue: Signup form not working

- [ ] Check browser console for errors
- [ ] Verify CORS headers are set
- [ ] Test signup function directly with curl
- [ ] Check function logs for validation errors
- [ ] Verify Supabase URL is correct

---

## 📝 Notes & Reminders

### Important URLs

- Supabase Project: `https://supabase.com/dashboard/project/[your-ref]`
- Edge Functions: `https://[your-ref].supabase.co/functions/v1/`
- Landing Page: `https://[your-domain]/personifeed`
- SendGrid Dashboard: `https://app.sendgrid.com`
- OpenAI Usage: `https://platform.openai.com/usage`

### Support Resources

- Deployment Guide: `docs/personifeed-deployment.md`
- Quick Reference: `docs/personifeed-quick-reference.md`
- Architecture: `docs/personifeed-architecture.md`
- PRD: `docs/personifeed-prd.md`

### Emergency Contacts

- Supabase Support: https://supabase.com/support
- SendGrid Support: https://support.sendgrid.com
- OpenAI Support: https://help.openai.com

---

## ✅ Sign-Off

### Pre-Deployment Sign-Off

- [ ] All pre-deployment checklist items completed
- [ ] Ready to deploy to production
- [ ] Stakeholders notified
- [ ] Rollback plan in place

**Signed**: _________________ **Date**: _________________

### Post-Deployment Sign-Off

- [ ] All deployment testing completed
- [ ] All monitoring configured
- [ ] First newsletter sent successfully
- [ ] No critical errors in logs
- [ ] Production deployment successful

**Signed**: _________________ **Date**: _________________

---

## 🎉 Deployment Complete!

Congratulations! personi[feed] is now live in production.

**Next Steps:**
1. Monitor first 24 hours closely
2. Gather user feedback
3. Plan improvements
4. Celebrate! 🎉

