# Epic 1 Deployment Checklist

Use this checklist to track your deployment progress. Check off items as you complete them.

---

## Pre-Deployment (Code Complete)

- [x] All Epic 1 stories completed (1.1-1.5)
- [x] Edge Function code written and tested
- [x] Error handling implemented
- [x] Logging system implemented
- [x] Documentation written

---

## Phase 1: SendGrid Setup

### SendGrid Account & API Key (5 minutes)

- [ ] Created SendGrid account at [sendgrid.com](https://sendgrid.com)
- [ ] Generated API key (Settings → API Keys → Create API Key)
- [ ] Selected "Full Access" permissions
- [ ] **Copied and saved API key** (shown only once!)
- [ ] API key format verified: `SG.xxxxx...`

### Sender Verification (Choose One)

**Option A: Single Sender (Quick - Testing Only)**

- [ ] Navigated to Settings → Sender Authentication
- [ ] Clicked "Single Sender Verification"
- [ ] Entered email address
- [ ] Clicked verification link in email
- [ ] Sender status shows "Verified" ✅

**Option B: Domain Authentication (Production - Recommended)**

- [ ] Navigated to Settings → Sender Authentication
- [ ] Clicked "Authenticate Your Domain"
- [ ] Entered domain name
- [ ] Received DNS records from SendGrid
- [ ] Added CNAME records to DNS (s1._domainkey, s2._domainkey)
- [ ] Added TXT record to DNS (SPF)
- [ ] Clicked "Verify" in SendGrid
- [ ] Domain status shows "Verified" ✅
- [ ] **Time:** Waited 24-48 hours for DNS propagation

### Inbound Parse Configuration (Required)

- [ ] Added MX record to DNS:
  - Type: MX
  - Host: `email.yourdomain.com`
  - Value: `mx.sendgrid.net`
  - Priority: 10
- [ ] Navigated to Settings → Inbound Parse in SendGrid
- [ ] Clicked "Add Host & URL"
- [ ] Entered subdomain: `email`
- [ ] Entered domain: `yourdomain.com`
- [ ] Entered destination URL: `https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook`
- [ ] Enabled "Check Spam"
- [ ] Enabled "Send Raw"
- [ ] Clicked "Add"
- [ ] Configuration shows "Active" ✅
- [ ] **Time:** Waited 24-48 hours for DNS propagation

### DNS Verification

- [ ] Verified MX record propagated: `dig email.yourdomain.com MX`
- [ ] Expected output received: `10 mx.sendgrid.net`
- [ ] Tested from multiple DNS servers (8.8.8.8, 1.1.1.1)
- [ ] Checked propagation at [whatsmydns.net](https://whatsmydns.net)

---

## Phase 2: OpenAI Setup

### OpenAI Account & API Key (5 minutes)

- [ ] Created OpenAI account at [platform.openai.com](https://platform.openai.com)
- [ ] Added billing information (Settings → Billing)
- [ ] Set usage limit: $10/month (recommended)
- [ ] Navigated to API Keys section
- [ ] Created new secret key
- [ ] Named key: "Email-LLM Service"
- [ ] **Copied and saved API key** (shown only once!)
- [ ] API key format verified: `sk-proj-xxxxx...`

### Model Selection

- [ ] Decided on model:
  - [ ] `gpt-3.5-turbo` (Recommended for MVP - $15/month for 100 emails/day)
  - [ ] `gpt-4-turbo` (Better quality - $100/month for 100 emails/day)
  - [ ] `gpt-4` (Best quality - $300/month for 100 emails/day)

---

## Phase 3: Supabase Configuration

### Environment Secrets

- [ ] Opened [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Selected project: `llmbox` (nopocimtfthppwssohty)
- [ ] Navigated to: Project Settings → Edge Functions → Secrets

**Required Secrets:**

- [ ] `SENDGRID_API_KEY` = `SG.xxxxx...`
- [ ] `OPENAI_API_KEY` = `sk-proj-xxxxx...`
- [ ] `SERVICE_EMAIL_ADDRESS` = `assistant@yourdomain.com`
- [ ] `OPENAI_MODEL` = `gpt-3.5-turbo`

**Optional Secrets (can skip for MVP):**

- [ ] `LOG_LEVEL` = `INFO`
- [ ] `SENDGRID_TIMEOUT_MS` = `10000`
- [ ] `OPENAI_TIMEOUT_MS` = `30000`
- [ ] `OPENAI_MAX_TOKENS` = `1000`
- [ ] `OPENAI_TEMPERATURE` = `0.7`

### Deployment

- [ ] Edge Function deployed to Supabase
- [ ] Function URL accessible: `https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook`

---

## Phase 4: Testing

### Pre-Flight Verification

- [ ] All SendGrid secrets set in Supabase
- [ ] All OpenAI secrets set in Supabase
- [ ] DNS records propagated (waited 24-48 hours)
- [ ] Sender email/domain verified in SendGrid

### Test 1: Function Health Check

```bash
curl https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

- [ ] Received response: `405 Method Not Allowed` ✅ (This is correct!)
- [ ] OR received response: `{"error": "Method not allowed"}` ✅

### Test 2: Simulated Webhook Test

```bash
curl -X POST https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook \
  -H "Content-Type: multipart/form-data" \
  -F "from=test@example.com" \
  -F "to=test@email.yourdomain.com" \
  -F "subject=Test" \
  -F "text=Hello, can you help?"
```

- [ ] Received 200 OK response
- [ ] Response contains: `{"status":"success","messageId":"..."}`
- [ ] Checked Supabase logs (Dashboard → Edge Functions → Logs)
- [ ] Saw `webhook_received` event
- [ ] Saw `email_parsed` event
- [ ] Saw `openai_response_received` event
- [ ] Saw `email_sent` event
- [ ] Saw `processing_completed` event
- [ ] **No ERROR or CRITICAL level logs**

### Test 3: Real Email Test (End-to-End)

**Send Test Email:**

- [ ] Opened personal email client (Gmail, Outlook, etc.)
- [ ] Sent email to: `test@email.yourdomain.com`
- [ ] Subject: "Hello Assistant"
- [ ] Body: "Can you help me understand how AI works?"
- [ ] Waited up to 30 seconds

**Verify Response:**

- [ ] Received response email in inbox
- [ ] From: `assistant@yourdomain.com` (or your SERVICE_EMAIL_ADDRESS)
- [ ] Subject: "Re: Hello Assistant"
- [ ] Body contains AI-generated response
- [ ] Response is relevant to question
- [ ] Email appears in same thread as original

**Check Logs:**

- [ ] Opened Supabase Dashboard → Edge Functions → Logs
- [ ] Found `messageId` for this email
- [ ] Verified event sequence:
  1. `webhook_received`
  2. `email_parsed`
  3. `openai_call_started`
  4. `openai_response_received`
  5. `email_sent`
  6. `processing_completed`
- [ ] Total processing time < 30 seconds
- [ ] No errors logged

### Test 4: Email Threading

- [ ] Replied to AI's response with follow-up question
- [ ] Waited 30 seconds
- [ ] Received another AI response
- [ ] Response appears in same email thread
- [ ] Subject still shows "Re: Hello Assistant"

### Test 5: Error Handling (Optional but Recommended)

**Test OpenAI Error:**

- [ ] Temporarily set invalid `OPENAI_API_KEY` in Supabase
- [ ] Sent test email
- [ ] Received error email: "Sorry, I'm having trouble responding right now."
- [ ] Checked logs for `CRITICAL` level error: `openai_auth_error`
- [ ] Restored correct API key

**Test SendGrid Error:**

- [ ] Temporarily set invalid `SENDGRID_API_KEY` in Supabase
- [ ] Sent test email
- [ ] Checked logs for `CRITICAL` level error: `sendgrid_auth_error`
- [ ] Restored correct API key

---

## Phase 5: Performance Validation

### Check Processing Times

- [ ] Reviewed `processing_completed` log event
- [ ] **Total processing time:** _______ ms (target: < 30,000 ms)
- [ ] **Webhook parsing:** _______ ms (target: < 2,000 ms)
- [ ] **OpenAI API call:** _______ ms (target: < 20,000 ms)
- [ ] **Email sending:** _______ ms (target: < 5,000 ms)

### Performance Warnings

- [ ] No `slow_webhook_parsing` warnings
- [ ] No `slow_openai_call` warnings
- [ ] No `slow_email_send` warnings
- [ ] No `slow_total_processing` warnings

---

## Phase 6: Production Readiness

### Security

- [ ] No API keys hardcoded in code
- [ ] All secrets configured in Supabase (not in .env files)
- [ ] Log level set to `INFO` (not `DEBUG`)
- [ ] Domain authentication completed (not single sender)

### Monitoring

- [ ] Supabase logs accessible
- [ ] Log correlation working (messageId tracking)
- [ ] Performance metrics visible in logs
- [ ] Error events clearly distinguishable

### Cost Management

- [ ] OpenAI usage limit set ($10/month recommended)
- [ ] SendGrid plan confirmed (free tier OK for MVP)
- [ ] Billing alerts configured in OpenAI
- [ ] Billing alerts configured in SendGrid (optional)

### Documentation

- [ ] README updated with deployment info
- [ ] Environment variables documented
- [ ] Team members have access to:
  - [ ] Supabase dashboard
  - [ ] SendGrid account
  - [ ] OpenAI account
  - [ ] DNS provider

---

## Troubleshooting

### If Tests Fail

**No webhook triggered:**
- [ ] Verified MX record with `dig email.yourdomain.com MX`
- [ ] Waited 24-48 hours for DNS propagation
- [ ] Checked SendGrid Inbound Parse configuration
- [ ] Verified webhook URL is correct
- [ ] Checked SendGrid Activity Feed for events

**Function errors:**
- [ ] Checked Supabase logs for error events
- [ ] Verified all secrets are set correctly
- [ ] Tested API keys with curl commands
- [ ] Checked API key permissions (Full Access)
- [ ] Verified sender domain/email is verified

**No email response:**
- [ ] Checked spam/junk folder
- [ ] Verified sender is verified in SendGrid
- [ ] Checked SendGrid Activity Feed for delivery status
- [ ] Reviewed Supabase logs for `sendgrid_send_failed` events
- [ ] Confirmed `SERVICE_EMAIL_ADDRESS` matches verified email

**Slow performance:**
- [ ] Considered switching from gpt-4 to gpt-3.5-turbo
- [ ] Reduced `OPENAI_MAX_TOKENS` (e.g., 500 instead of 1000)
- [ ] Checked OpenAI API status page
- [ ] Checked SendGrid API status page

---

## Post-Deployment

### Monitoring (First 7 Days)

- [ ] Day 1: Check logs daily for errors
- [ ] Day 3: Review performance metrics
- [ ] Day 7: Review costs in OpenAI dashboard
- [ ] Week 1: Monitor email deliverability rate

### Cost Tracking

- [ ] Set up OpenAI usage alerts
- [ ] Track actual vs. estimated costs
- [ ] Monitor emails sent per day
- [ ] Review if model upgrade/downgrade needed

### User Feedback

- [ ] Collect feedback on response quality
- [ ] Track response time satisfaction
- [ ] Monitor error email frequency
- [ ] Identify common use cases

---

## Epic 2 Preparation

Once Epic 1 is stable and tested:

- [ ] Review Epic 2 requirements (webhook verification, rate limiting)
- [ ] Plan database integration for conversation history
- [ ] Consider monitoring and alerting improvements
- [ ] Plan for scaling if needed

---

## Sign-Off

**Deployment completed by:** ________________
**Date:** ________________
**All tests passed:** [ ] Yes [ ] No
**Ready for production:** [ ] Yes [ ] No

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**Quick Links:**

- **Supabase Dashboard:** https://supabase.com/dashboard
- **SendGrid Dashboard:** https://app.sendgrid.com
- **OpenAI Dashboard:** https://platform.openai.com
- **Supabase Logs:** Dashboard → Edge Functions → email-webhook → Logs
- **Function URL:** https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook

**Deployment Guides:**

- [WHAT-YOU-NEED-TO-DO.md](./WHAT-YOU-NEED-TO-DO.md) - Complete overview
- [DEPLOYMENT-QUICK-START.md](./DEPLOYMENT-QUICK-START.md) - Quick reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed guide with troubleshooting

