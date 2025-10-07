# Epic 1 Deployment and Testing Guide

This comprehensive guide walks you through deploying and testing the Epic 1 Email-LLM Pipeline, including all external service configuration required.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [External Services Setup](#external-services-setup)
   - [SendGrid Configuration](#sendgrid-configuration)
   - [OpenAI Configuration](#openai-configuration)
   - [DNS Configuration](#dns-configuration)
3. [Supabase Deployment](#supabase-deployment)
4. [Testing the Deployment](#testing-the-deployment)
5. [Troubleshooting](#troubleshooting)
6. [Production Checklist](#production-checklist)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ **Code Complete:** All Epic 1 stories (1.1-1.5) completed
- ✅ **Supabase Account:** Project already created (ID: `nopocimtfthppwssohty`)
- ✅ **SendGrid Account:** Sign up at [sendgrid.com](https://sendgrid.com) (free tier available)
- ✅ **OpenAI Account:** Sign up at [platform.openai.com](https://platform.openai.com)
- ✅ **Domain Access:** Ability to modify DNS records for your domain

---

## External Services Setup

### SendGrid Configuration

#### Step 1: Create SendGrid Account and Get API Key

1. **Sign up or log in** at [SendGrid](https://sendgrid.com)
2. Navigate to **Settings → API Keys**
3. Click **Create API Key**
4. Configuration:
   - **Name:** `Email-LLM Service`
   - **Permissions:** Select **Full Access** (or at minimum **Mail Send**)
5. Click **Create & View**
6. **⚠️ CRITICAL:** Copy the API key immediately (shown only once)
7. Save this key - you'll need it for Supabase secrets

**Example API Key Format:**
```
SG.1234567890abcdefghijklmnopqrstuvwxyz.1234567890abcdefghijklmnopqrstuvwxyz
```

#### Step 2: Verify Sender Domain

You MUST verify a sender domain/email before SendGrid will send emails.

##### Option A: Single Sender Verification (Quick - For Testing)

**⏱️ Time Required:** 5 minutes

1. Navigate to **Settings → Sender Authentication**
2. Click **Single Sender Verification**
3. Fill in your email address (e.g., `you@gmail.com`)
4. Click the verification link sent to your email
5. Once verified, use this email as `SERVICE_EMAIL_ADDRESS`

**✅ Pros:** Quick setup, good for testing
**❌ Cons:** Limited to one email, not scalable, less professional

##### Option B: Domain Authentication (Recommended - For Production)

**⏱️ Time Required:** 24-48 hours (DNS propagation)

1. Navigate to **Settings → Sender Authentication**
2. Click **Authenticate Your Domain**
3. Select your DNS host provider (e.g., Cloudflare, GoDaddy, Route53)
4. Enter your domain (e.g., `yourdomain.com`)
5. SendGrid provides DNS records to add:

**Example DNS Records to Add:**

| Type  | Host                          | Value                          | Priority |
|-------|-------------------------------|--------------------------------|----------|
| CNAME | s1._domainkey.yourdomain.com | s1.domainkey.u1234567.wl123.sendgrid.net | -        |
| CNAME | s2._domainkey.yourdomain.com | s2.domainkey.u1234567.wl123.sendgrid.net | -        |
| TXT   | yourdomain.com               | v=spf1 include:sendgrid.net ~all | -        |

6. Add these records to your DNS provider
7. Return to SendGrid and click **Verify**
8. Wait for DNS propagation (24-48 hours)
9. Once verified ✅, use any email on your domain as `SERVICE_EMAIL_ADDRESS`
   - Example: `assistant@yourdomain.com`

**✅ Pros:** Professional, scalable, better deliverability
**❌ Cons:** Requires DNS access, takes time to propagate

#### Step 3: Configure Inbound Parse Webhook

This enables your service to **receive** emails.

**⏱️ Time Required:** 5 minutes + 24-48 hours (DNS propagation)

##### A. Choose Receiving Subdomain

Pick a subdomain for receiving emails. Common choices:
- `email.yourdomain.com` → Emails sent to `anything@email.yourdomain.com`
- `chat.yourdomain.com` → Emails sent to `anything@chat.yourdomain.com`
- `ai.yourdomain.com` → Emails sent to `anything@ai.yourdomain.com`

##### B. Add MX Record to DNS

Add the following MX record in your DNS provider:

**Example for subdomain `email.yourdomain.com`:**

| Type | Host                   | Value            | Priority | TTL  |
|------|------------------------|------------------|----------|------|
| MX   | email.yourdomain.com   | mx.sendgrid.net  | 10       | 3600 |

**DNS Provider-Specific Examples:**

**Cloudflare:**
```
Type: MX
Name: email
Mail server: mx.sendgrid.net
Priority: 10
TTL: Auto
```

**AWS Route53:**
```
Record name: email.yourdomain.com
Record type: MX
Value: 10 mx.sendgrid.net
TTL: 3600
```

**GoDaddy:**
```
Type: MX
Host: email
Points to: mx.sendgrid.net
Priority: 10
TTL: 1 Hour
```

##### C. Configure Inbound Parse in SendGrid

1. Navigate to **Settings → Inbound Parse**
2. Click **Add Host & URL**
3. Fill in the form:
   - **Subdomain:** `email` (or your chosen subdomain)
   - **Domain:** `yourdomain.com`
   - **Destination URL:** `https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook`
   - **Check Spam:** ✅ Enabled (recommended)
   - **Send Raw:** ❌ Disabled (must be disabled - use parsed format)
   - **POST the raw, full MIME message:** ❌ Disabled (must be disabled)
4. Click **Add**

**⚠️ Important Notes:**
- DNS propagation can take 24-48 hours. You won't be able to receive emails until propagation completes.
- The webhook parser requires parsed format (`send_raw=false`). Do NOT enable raw MIME format.

##### D. Verify MX Record Setup

After adding the MX record, verify it propagated:

```bash
# Check MX record
dig email.yourdomain.com MX

# Or use nslookup
nslookup -type=MX email.yourdomain.com
```

**Expected Output:**
```
email.yourdomain.com.   3600    IN  MX  10 mx.sendgrid.net.
```

#### Step 4: Test SendGrid Configuration

##### Test 1: Verify API Key Works

```bash
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer YOUR_SENDGRID_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "personalizations": [{"to": [{"email": "your-email@example.com"}]}],
    "from": {"email": "your-verified-sender@example.com"},
    "subject": "SendGrid Test",
    "content": [{"type": "text/plain", "value": "Testing SendGrid API"}]
  }'
```

**Expected Response:** `202 Accepted`

##### Test 2: Verify Inbound Parse (After DNS Propagation)

Send an email to: `test@email.yourdomain.com`

Then check SendGrid's **Activity Feed** (Email Activity → Activity Feed) for the received webhook event.

---

### OpenAI Configuration

#### Step 1: Create OpenAI Account and Get API Key

1. **Sign up or log in** at [OpenAI Platform](https://platform.openai.com)
2. Navigate to **API Keys** section
3. Click **Create new secret key**
4. Configuration:
   - **Name:** `Email-LLM Service`
   - **Permissions:** All (default)
5. **⚠️ CRITICAL:** Copy the API key immediately (shown only once)
6. Save this key - you'll need it for Supabase secrets

**Example API Key Format:**
```
sk-proj-1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopq
```

#### Step 2: Add Billing Information (Required)

OpenAI requires billing information even for pay-as-you-go usage:

1. Navigate to **Settings → Billing**
2. Click **Add payment method**
3. Enter credit card information
4. Set up usage limits (recommended):
   - **Hard limit:** $10/month (prevents unexpected charges)
   - **Soft limit:** $5/month (sends warning email)

#### Step 3: Choose Model

**Recommended for MVP: `gpt-3.5-turbo`**

| Model | Speed | Cost (per 1K tokens) | Quality | Recommendation |
|-------|-------|---------------------|---------|----------------|
| `gpt-3.5-turbo` | Fast | $0.0015 input / $0.002 output | Good | ✅ **Recommended for MVP** |
| `gpt-4` | Slower | $0.03 input / $0.06 output | Excellent | Production (20x more expensive) |
| `gpt-4-turbo` | Medium | $0.01 input / $0.03 output | Excellent | Good middle ground |

**Cost Example:**
- **gpt-3.5-turbo:** 100 emails/day ≈ $0.50/day = $15/month
- **gpt-4:** 100 emails/day ≈ $10/day = $300/month

#### Step 4: Test OpenAI API

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello!"}
    ]
  }'
```

**Expected Response:** JSON with completion text

---

### DNS Configuration

#### Complete DNS Setup Checklist

| Record Type | Host | Value | Purpose | Required |
|-------------|------|-------|---------|----------|
| **MX** | `email.yourdomain.com` | `mx.sendgrid.net` (priority 10) | Receive emails | ✅ Yes |
| **CNAME** | `s1._domainkey.yourdomain.com` | `s1.domainkey.uXXXXXXX.wlXXX.sendgrid.net` | DKIM signing | ✅ Yes (for domain auth) |
| **CNAME** | `s2._domainkey.yourdomain.com` | `s2.domainkey.uXXXXXXX.wlXXX.sendgrid.net` | DKIM signing | ✅ Yes (for domain auth) |
| **TXT** | `yourdomain.com` | `v=spf1 include:sendgrid.net ~all` | SPF record | ✅ Yes (for domain auth) |

**⏱️ DNS Propagation Time:** 24-48 hours (sometimes faster)

**Check Propagation:**
```bash
# Check MX record
dig email.yourdomain.com MX

# Check DKIM records
dig s1._domainkey.yourdomain.com CNAME
dig s2._domainkey.yourdomain.com CNAME

# Check SPF record
dig yourdomain.com TXT
```

---

## Supabase Deployment

Your Edge Function code is already written. Now you need to deploy it and configure secrets.

### Step 1: Deploy Edge Function

You have several options for deployment:

#### Option A: Using Supabase MCP (Recommended - Already Available)

Since you're using Cursor with Supabase MCP integration, the function should already be deployed. Verify it's running:

```bash
curl https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

If you need to redeploy:
1. Use the Supabase MCP tools in Cursor
2. The function will be deployed automatically from `supabase/functions/email-webhook/`

#### Option B: Using Supabase CLI (Manual)

If you want to deploy manually:

1. **Install Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link to your project:**
   ```bash
   supabase link --project-ref nopocimtfthppwssohty
   ```

4. **Deploy the function:**
   ```bash
   supabase functions deploy email-webhook --project-ref nopocimtfthppwssohty
   ```

### Step 2: Set Environment Variables in Supabase

You MUST configure these secrets for the function to work.

#### Option A: Via Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `llmbox` (nopocimtfthppwssohty)
3. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
4. Add the following secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SENDGRID_API_KEY` | Your SendGrid API key | `SG.abc123...` |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-proj-abc123...` |
| `SERVICE_EMAIL_ADDRESS` | Your verified sender email | `assistant@yourdomain.com` |
| `OPENAI_MODEL` | Model to use | `gpt-3.5-turbo` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

**Optional Secrets (with defaults):**

| Secret Name | Default | Description |
|-------------|---------|-------------|
| `SENDGRID_TIMEOUT_MS` | `10000` | SendGrid API timeout |
| `OPENAI_TIMEOUT_MS` | `30000` | OpenAI API timeout |
| `OPENAI_MAX_TOKENS` | `1000` | Max tokens in response |
| `OPENAI_TEMPERATURE` | `0.7` | Response creativity (0.0-2.0) |

#### Option B: Via Supabase CLI

```bash
# Required secrets
supabase secrets set SENDGRID_API_KEY="SG.your-key-here" --project-ref nopocimtfthppwssohty
supabase secrets set OPENAI_API_KEY="sk-your-key-here" --project-ref nopocimtfthppwssohty
supabase secrets set SERVICE_EMAIL_ADDRESS="assistant@yourdomain.com" --project-ref nopocimtfthppwssohty

# Optional secrets
supabase secrets set OPENAI_MODEL="gpt-3.5-turbo" --project-ref nopocimtfthppwssohty
supabase secrets set LOG_LEVEL="INFO" --project-ref nopocimtfthppwssohty
```

#### Option C: Via Supabase MCP

Use the `mcp_supabase_*` tools in Cursor to set secrets programmatically.

### Step 3: Verify Deployment

```bash
curl https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

**Expected Response:**
- **Status:** `405 Method Not Allowed` (correct - function expects POST)
- **Body:** `{"error": "Method not allowed"}`

**✅ This means the function is deployed and running!**

---

## Testing the Deployment

### Pre-Flight Checklist

Before testing, ensure:

- ✅ SendGrid API key configured in Supabase
- ✅ OpenAI API key configured in Supabase
- ✅ SERVICE_EMAIL_ADDRESS configured in Supabase
- ✅ Sender domain/email verified in SendGrid
- ✅ MX record configured and propagated (wait 24-48 hours)
- ✅ Inbound Parse configured in SendGrid
- ✅ Edge Function deployed to Supabase

### Test 1: Verify Edge Function is Running

```bash
curl -X POST https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

**Expected Response:**
```json
{
  "error": "Required field missing from webhook: from",
  "details": { "missingField": "from" }
}
```

**✅ This is correct!** The function is running and validating input.

### Test 2: Test with Simulated SendGrid Webhook

Create a test payload:

```bash
curl -X POST https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook \
  -H "Content-Type: multipart/form-data" \
  -F "from=user@example.com" \
  -F "to=test@email.yourdomain.com" \
  -F "subject=Test Email" \
  -F "text=This is a test email. Can you respond?" \
  -F "headers={\"Message-ID\": \"<test123@example.com>\"}"
```

**Expected Response:**
```json
{
  "status": "success",
  "messageId": "<test123@example.com>"
}
```

**Then check:**
1. Supabase Logs for processing events
2. Your email inbox (`user@example.com`) for AI response

### Test 3: Send Real Email (End-to-End Test)

This is the **ultimate test** - requires DNS propagation completed.

#### Step-by-Step:

1. **From your personal email** (Gmail, Outlook, etc.)
2. **Send email to:** `test@email.yourdomain.com`
3. **Subject:** "Hello Assistant"
4. **Body:**
   ```
   Hello! Can you help me understand how machine learning works?
   ```
5. **Wait:** Up to 30 seconds for processing

#### Expected Results:

**✅ Success Indicators:**

1. **Email Response Received** in your inbox within 30 seconds
2. **Subject:** "Re: Hello Assistant"
3. **From:** Your configured `SERVICE_EMAIL_ADDRESS`
4. **Body:** AI-generated response explaining machine learning
5. **Threading:** Email appears in the same thread as your original

**📊 Check Supabase Logs:**

Navigate to: **Supabase Dashboard → Edge Functions → email-webhook → Logs**

You should see these events in order:

```json
{"level":"INFO","event":"webhook_received","timestamp":"2025-10-07T..."}
{"level":"INFO","event":"email_parsed","context":{"messageId":"...","from":"user@example.com",...}}
{"level":"INFO","event":"openai_call_started","context":{"messageId":"...","bodyLength":58}}
{"level":"INFO","event":"openai_response_received","context":{"model":"gpt-3.5-turbo","tokenCount":150,...}}
{"level":"INFO","event":"email_sent","context":{"recipient":"user@example.com","sendTimeMs":1200,...}}
{"level":"INFO","event":"processing_completed","context":{"totalProcessingTimeMs":8500,...}}
```

### Test 4: Test Email Threading

1. **Reply** to the AI's response email
2. Write a follow-up question: "Can you explain neural networks?"
3. Send the reply
4. **Verify:**
   - Response arrives in the same email thread
   - Subject still shows "Re: Hello Assistant"
   - Email client groups messages together

### Test 5: Test Error Handling

#### A. Test Invalid OpenAI Key

1. Temporarily set invalid `OPENAI_API_KEY` in Supabase secrets
2. Send test email
3. **Expected:** Receive error email saying "Sorry, I'm having trouble responding right now."
4. **Check logs:** Look for `CRITICAL` level `openai_auth_error` event
5. **Restore** correct API key

#### B. Test Rate Limiting

1. Send 10+ emails rapidly (within 1 minute)
2. **Expected:** Some emails receive rate limit error message
3. **Check logs:** Look for `openai_rate_limit` warnings

### Test 6: Performance Validation

Check the `processing_completed` log event for timing:

```json
{
  "event": "processing_completed",
  "context": {
    "totalProcessingTimeMs": 8500,
    "parsingTimeMs": 450,
    "llmTimeMs": 6800,
    "emailSendTimeMs": 1200
  }
}
```

**✅ Target Performance:**
- **Total processing time:** < 30 seconds
- **Webhook parsing:** < 2 seconds
- **LLM API call:** < 20 seconds
- **Email sending:** < 5 seconds

If any thresholds are exceeded, you'll see `slow_*` warning events in logs.

---

## Troubleshooting

### Issue 1: No Webhook Triggered

**Symptoms:**
- Send email to `test@email.yourdomain.com`
- No logs appear in Supabase
- No response received

**Diagnosis:**

1. **Check DNS propagation:**
   ```bash
   dig email.yourdomain.com MX
   ```
   Expected: `10 mx.sendgrid.net`

2. **Verify Inbound Parse configuration:**
   - Go to SendGrid → Settings → Inbound Parse
   - Verify webhook URL is correct
   - Verify subdomain matches MX record

3. **Check SendGrid Activity Feed:**
   - SendGrid Dashboard → Email Activity → Activity Feed
   - Look for inbound parse events

**Solutions:**
- Wait for DNS propagation (24-48 hours)
- Verify MX record is correct
- Try sending from different email provider
- Check SendGrid account status (suspended?)

### Issue 2: Function Returns Error

**Symptoms:**
- Webhook triggers (visible in logs)
- Function returns error
- No email sent

**Check Logs For:**

```bash
# Filter for errors
level: ERROR OR level: CRITICAL
```

**Common Errors:**

| Error Event | Cause | Solution |
|-------------|-------|----------|
| `openai_auth_error` | Invalid OpenAI API key | Verify `OPENAI_API_KEY` secret |
| `sendgrid_auth_error` | Invalid SendGrid API key | Verify `SENDGRID_API_KEY` secret |
| `validation_error` (missing `text`/`headers`) | SendGrid configured with raw MIME format | Change SendGrid Inbound Parse to use parsed format (disable "Send Raw" and "POST the raw, full MIME message") |
| `validation_error` (other fields) | Malformed webhook payload | Check SendGrid Inbound Parse settings |
| `sendgrid_bad_request` | Invalid sender email | Verify sender domain is verified |

### Issue 3: No Email Response Received

**Symptoms:**
- Webhook triggered ✅
- Function completes successfully ✅
- No email in inbox ❌

**Check:**

1. **Spam/Junk folder** - AI responses might be filtered
2. **SendGrid Activity Feed:**
   - Go to Email Activity → Activity Feed
   - Search for recipient email
   - Check delivery status

3. **Sender Verification:**
   - Verify `SERVICE_EMAIL_ADDRESS` is verified in SendGrid
   - Check Settings → Sender Authentication

4. **Logs for `sendgrid_send_failed`:**
   ```bash
   event: sendgrid_*
   ```

**Solutions:**
- Complete domain authentication (not just single sender)
- Add SPF/DKIM records
- Whitelist sender email in your email provider
- Check SendGrid account suspension status

### Issue 4: Slow Response Times

**Symptoms:**
- Processing takes > 30 seconds
- Logs show `slow_*` warnings

**Check Logs:**
```bash
event: slow_*
```

**Common Causes:**

| Slow Operation | Threshold | Cause | Solution |
|----------------|-----------|-------|----------|
| `slow_openai_call` | > 20s | Using gpt-4 | Switch to `gpt-3.5-turbo` |
| `slow_email_send` | > 5s | SendGrid API slow | Check SendGrid status |
| `slow_webhook_parsing` | > 2s | Large email | Check email size limits |

**Performance Tuning:**

1. **Switch to faster model:**
   ```bash
   OPENAI_MODEL=gpt-3.5-turbo
   ```

2. **Reduce max tokens:**
   ```bash
   OPENAI_MAX_TOKENS=500
   ```

3. **Reduce timeout:**
   ```bash
   OPENAI_TIMEOUT_MS=20000
   ```

### Issue 5: Authentication Errors

**OpenAI Authentication Error:**

```json
{"level":"CRITICAL","event":"openai_auth_error"}
```

**Solution:**
1. Verify API key format: `sk-proj-...`
2. Check OpenAI account status
3. Verify billing is set up
4. Regenerate API key if needed

**SendGrid Authentication Error:**

```json
{"level":"CRITICAL","event":"sendgrid_auth_error"}
```

**Solution:**
1. Verify API key format: `SG....`
2. Check API key permissions (needs Mail Send)
3. Verify SendGrid account not suspended
4. Regenerate API key with Full Access

### Issue 6: DNS Not Propagating

**Check propagation status:**

```bash
# Check from different DNS servers
dig @8.8.8.8 email.yourdomain.com MX      # Google DNS
dig @1.1.1.1 email.yourdomain.com MX      # Cloudflare DNS
dig @208.67.222.222 email.yourdomain.com MX  # OpenDNS
```

**Solutions:**
- Wait longer (can take 48 hours)
- Reduce TTL before making changes
- Use online DNS checker: [whatsmydns.net](https://www.whatsmydns.net)
- Contact DNS provider support

---

## Production Checklist

Before going live with Epic 1:

### Security & Configuration
- [ ] All secrets set in Supabase (no hardcoded keys)
- [ ] `LOG_LEVEL` set to `INFO` (not `DEBUG`)
- [ ] SendGrid domain authentication completed (not single sender)
- [ ] SPF and DKIM records verified
- [ ] MX records propagated and verified

### Testing
- [ ] End-to-end email flow tested successfully
- [ ] Error handling tested (invalid keys, rate limits)
- [ ] Performance meets targets (< 30s total)
- [ ] Email threading works correctly
- [ ] Error emails received for failures

### Monitoring
- [ ] Supabase logs accessible and readable
- [ ] Log correlation working (messageId tracking)
- [ ] Performance warnings triggering correctly
- [ ] Critical alerts configured (optional)

### Cost Management
- [ ] OpenAI usage limits set ($10/month recommended)
- [ ] SendGrid plan chosen (free tier OK for MVP)
- [ ] Billing alerts configured

### Documentation
- [ ] README updated with deployment info
- [ ] Environment variables documented
- [ ] Support contact information added
- [ ] Troubleshooting guide reviewed

---

## Next Steps

### Epic 2: Production Reliability & Security

Once Epic 1 is tested and working, proceed to Epic 2:

1. **Webhook Signature Verification** - Validate SendGrid webhooks
2. **Rate Limiting & Throttling** - Prevent abuse
3. **Database Integration** - Store conversation history
4. **Enhanced Monitoring** - Real-time alerts
5. **Retry Logic** - Automatic failure recovery

See: `docs/prd/epic-2-production-reliability-security.md`

---

## Quick Reference

### Supabase Project Details

```
Project ID: nopocimtfthppwssohty
Region: us-east-2
Edge Function: email-webhook
URL: https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

### Required Secrets

```bash
SENDGRID_API_KEY=SG.your-key-here
OPENAI_API_KEY=sk-proj-your-key-here
SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com
OPENAI_MODEL=gpt-3.5-turbo
```

### Test Commands

```bash
# Test function is running
curl https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook

# Test with payload
curl -X POST https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook \
  -H "Content-Type: multipart/form-data" \
  -F "from=test@example.com" \
  -F "to=test@email.yourdomain.com" \
  -F "subject=Test" \
  -F "text=Hello!"

# Check DNS
dig email.yourdomain.com MX
```

### Common Log Events

```bash
# View all logs
Supabase Dashboard → Edge Functions → email-webhook → Logs

# Filter for errors
level: ERROR OR level: CRITICAL

# Filter by message
messageId: "your-message-id"

# Filter slow operations
event: slow_*
```

---

## Support

- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **SendGrid Docs:** [docs.sendgrid.com](https://docs.sendgrid.com)
- **OpenAI Docs:** [platform.openai.com/docs](https://platform.openai.com/docs)

**Debugging:** Always check Supabase logs first - they contain detailed error information.

---

**Last Updated:** October 7, 2025
**Epic 1 Status:** Complete - Ready for Deployment ✅

