# Viewing and Understanding Supabase Logs

## 📊 How to Access Logs

### Method 1: Supabase Dashboard (Recommended)

**Direct Link:**
```
https://supabase.com/dashboard/project/nopocimtfthppwssohty/logs/edge-functions
```

**Steps:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **llmbox** (nopocimtfthppwssohty)
3. Left sidebar: Click **Edge Functions**
4. Click on **email-webhook** function
5. Click **Logs** tab

**Or use the shortcut command:**
```bash
deno task logs
```

---

## 🔍 Expected Errors When Secrets Are Not Set

Since you just deployed and haven't set API keys yet, you'll likely see these errors:

### 1. OpenAI Errors (Expected)

**Log Event:**
```json
{
  "level": "CRITICAL",
  "event": "openai_auth_error",
  "context": {
    "messageId": "...",
    "error": "Required environment variable OPENAI_API_KEY is not set"
  }
}
```

**What it means:**
- ❌ OpenAI API key not configured
- ❌ LLM cannot generate responses

**How to fix:**
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key --project-ref nopocimtfthppwssohty
```

---

### 2. SendGrid Errors (Expected)

**Log Event:**
```json
{
  "level": "CRITICAL",
  "event": "sendgrid_auth_error",
  "context": {
    "messageId": "...",
    "error": "Required environment variable SENDGRID_API_KEY is not set"
  }
}
```

**What it means:**
- ❌ SendGrid API key not configured
- ❌ Cannot send email responses

**How to fix:**
```bash
supabase secrets set SENDGRID_API_KEY=SG.your-key --project-ref nopocimtfthppwssohty
```

---

### 3. Missing SERVICE_EMAIL_ADDRESS (Expected)

**Log Event:**
```json
{
  "level": "ERROR",
  "event": "sendgrid_bad_request",
  "context": {
    "messageId": "...",
    "error": "From email address not configured"
  }
}
```

**What it means:**
- ❌ SERVICE_EMAIL_ADDRESS not configured
- ❌ Don't know which email to send from

**How to fix:**
```bash
supabase secrets set SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com --project-ref nopocimtfthppwssohty
```

---

## 📋 Complete Log Flow

### Successful Request (With Secrets Configured)

```json
// 1. Webhook received
{
  "timestamp": "2025-10-07T17:57:18Z",
  "level": "INFO",
  "event": "webhook_received",
  "context": {
    "contentType": "multipart/form-data"
  }
}

// 2. Email parsed
{
  "level": "INFO",
  "event": "email_parsed",
  "context": {
    "messageId": "<test123@example.com>",
    "from": "test@example.com",
    "to": "test@email.yourdomain.com",
    "subject": "Test Email",
    "bodyPreview": "Hello, can you help me with something?",
    "processingTimeMs": 125
  }
}

// 3. OpenAI call started
{
  "level": "INFO",
  "event": "openai_call_started",
  "context": {
    "messageId": "<test123@example.com>",
    "from": "test@example.com",
    "bodyLength": 39
  }
}

// 4. OpenAI response received
{
  "level": "INFO",
  "event": "openai_response_received",
  "context": {
    "messageId": "<test123@example.com>",
    "model": "gpt-3.5-turbo",
    "tokenCount": 150,
    "completionTimeMs": 2500,
    "responseLength": 450
  }
}

// 5. Email sent
{
  "level": "INFO",
  "event": "email_sent",
  "context": {
    "messageId": "<test123@example.com>",
    "recipient": "test@example.com",
    "subject": "Re: Test Email",
    "sendTimeMs": 850
  }
}

// 6. Processing completed
{
  "level": "INFO",
  "event": "processing_completed",
  "context": {
    "messageId": "<test123@example.com>",
    "totalProcessingTimeMs": 3500,
    "parsingTimeMs": 125,
    "llmTimeMs": 2500,
    "emailSendTimeMs": 850
  }
}
```

---

### Failed Request (Without Secrets)

```json
// 1. Webhook received ✅
{
  "level": "INFO",
  "event": "webhook_received"
}

// 2. Email parsed ✅
{
  "level": "INFO",
  "event": "email_parsed",
  "context": {
    "messageId": "<test123@example.com>",
    "from": "test@example.com"
  }
}

// 3. OpenAI call started ✅
{
  "level": "INFO",
  "event": "openai_call_started"
}

// 4. OpenAI error ❌
{
  "level": "CRITICAL",
  "event": "openai_auth_error",
  "context": {
    "messageId": "<test123@example.com>",
    "error": "Required environment variable OPENAI_API_KEY is not set"
  }
}

// 5. Error email attempted (but SendGrid also not configured)
{
  "level": "CRITICAL",
  "event": "sendgrid_auth_error",
  "context": {
    "messageId": "<test123@example.com>",
    "error": "Required environment variable SENDGRID_API_KEY is not set"
  }
}

// 6. Processing completed (but with errors)
{
  "level": "INFO",
  "event": "processing_completed",
  "context": {
    "messageId": "<test123@example.com>",
    "totalProcessingTimeMs": 450
  }
}
```

**This is EXPECTED and NORMAL before configuring secrets!**

---

## 🚨 Error Severity Levels

### CRITICAL (Red)
**What it means:** Service configuration issue, requires immediate attention

**Common CRITICAL errors:**
- `openai_auth_error` - Invalid/missing OpenAI API key
- `sendgrid_auth_error` - Invalid/missing SendGrid API key

**Action required:** Configure the missing secrets

---

### ERROR (Orange)
**What it means:** Operation failed but service is still running

**Common ERROR events:**
- `sendgrid_send_failed` - Email send failed (check API key, sender verification)
- `openai_error` - OpenAI request failed (check quota, rate limits)

**Action required:** Check the error message and fix the specific issue

---

### WARN (Yellow)
**What it means:** Non-critical issue, service continues working

**Common WARN events:**
- `openai_rate_limit` - Rate limit hit (wait and retry)
- `slow_openai_call` - OpenAI call took > 20 seconds
- `validation_error` - Invalid webhook payload

**Action required:** Monitor, may need optimization or adjustment

---

### INFO (Blue)
**What it means:** Normal operation, everything working

**Common INFO events:**
- `webhook_received`
- `email_parsed`
- `openai_response_received`
- `email_sent`
- `processing_completed`

**Action required:** None, just monitoring

---

## 🔍 Common Error Patterns

### Pattern 1: "Required environment variable X is not set"

**Appears in:**
- `openai_auth_error`
- `sendgrid_auth_error`

**Root cause:** Secrets not configured

**Solution:**
```bash
# Check what's set
supabase secrets list --project-ref nopocimtfthppwssohty

# Set missing secrets
supabase secrets set OPENAI_API_KEY=sk-xxx --project-ref nopocimtfthppwssohty
supabase secrets set SENDGRID_API_KEY=SG.xxx --project-ref nopocimtfthppwssohty
supabase secrets set SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com --project-ref nopocimtfthppwssohty
```

---

### Pattern 2: "401 Unauthorized" or "403 Forbidden"

**Appears in:**
- `openai_auth_error`
- `sendgrid_auth_error`

**Root cause:** Invalid API keys

**Solution:**
1. Verify API keys are correct
2. Check API key permissions
3. Regenerate API keys if needed
4. Update secrets with new keys

---

### Pattern 3: "Rate limit exceeded" or "429"

**Appears in:**
- `openai_rate_limit`
- `sendgrid_rate_limit`

**Root cause:** Too many requests to API

**Solution:**
1. Wait for rate limit to reset
2. Check usage in OpenAI/SendGrid dashboard
3. Consider upgrading API plan
4. Implement request throttling (Epic 2)

---

### Pattern 4: "Timeout" or "Request timed out"

**Appears in:**
- `openai_timeout`

**Root cause:** API request took too long

**Solution:**
1. Increase timeout (if reasonable)
2. Switch to faster model (gpt-3.5-turbo instead of gpt-4)
3. Reduce max_tokens
4. Check OpenAI API status page

---

## 📊 Log Filtering in Dashboard

### Filter by Error Level

In Supabase Dashboard logs:
```
level: CRITICAL
```
Shows only critical errors

```
level: ERROR
```
Shows only errors

```
level: CRITICAL OR level: ERROR
```
Shows all errors

---

### Filter by Event

```
event: openai_*
```
Shows all OpenAI-related events

```
event: sendgrid_*
```
Shows all SendGrid-related events

```
event: *_error
```
Shows all error events

---

### Filter by Message ID

To trace a specific email through the entire flow:
```
messageId: "<test123@example.com>"
```

---

## 🛠️ Troubleshooting Based on Logs

### Scenario 1: Only seeing CRITICAL errors

**Logs show:**
```
CRITICAL: openai_auth_error
CRITICAL: sendgrid_auth_error
```

**Diagnosis:** Secrets not configured

**Fix:**
```bash
# Set all required secrets
supabase secrets set OPENAI_API_KEY=sk-xxx --project-ref nopocimtfthppwssohty
supabase secrets set SENDGRID_API_KEY=SG.xxx --project-ref nopocimtfthppwssohty
supabase secrets set SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com --project-ref nopocimtfthppwssohty
supabase secrets set OPENAI_MODEL=gpt-3.5-turbo --project-ref nopocimtfthppwssohty

# Test again
deno task test:webhook
```

---

### Scenario 2: OpenAI works but SendGrid fails

**Logs show:**
```
INFO: openai_response_received ✅
ERROR: sendgrid_send_failed ❌
```

**Diagnosis:** SendGrid issue (API key, sender not verified)

**Fix:**
1. Verify SendGrid API key is correct
2. Check sender domain is verified in SendGrid
3. Verify `SERVICE_EMAIL_ADDRESS` matches verified sender

---

### Scenario 3: Everything times out

**Logs show:**
```
WARN: slow_openai_call
WARN: slow_total_processing
```

**Diagnosis:** Using gpt-4 (slower) or network issues

**Fix:**
1. Switch to gpt-3.5-turbo:
   ```bash
   supabase secrets set OPENAI_MODEL=gpt-3.5-turbo --project-ref nopocimtfthppwssohty
   ```
2. Reduce max tokens if needed

---

## 📋 Quick Diagnostic Checklist

Run through this checklist when troubleshooting:

### 1. Check Secrets Are Set
```bash
supabase secrets list --project-ref nopocimtfthppwssohty
```

**Expected:**
```
SENDGRID_API_KEY
OPENAI_API_KEY
SERVICE_EMAIL_ADDRESS
OPENAI_MODEL
```

### 2. Test Webhook
```bash
deno task test:webhook
```

**Expected response:**
```json
{"status":"success","messageId":"..."}
```

### 3. View Logs
**Go to:** https://supabase.com/dashboard/project/nopocimtfthppwssohty/logs/edge-functions

**Look for:**
- ✅ INFO events = working
- ⚠️ WARN events = minor issues
- ❌ ERROR/CRITICAL = needs fixing

### 4. Check Event Sequence

**Successful flow should show:**
1. `webhook_received`
2. `email_parsed`
3. `openai_call_started`
4. `openai_response_received`
5. `email_sent`
6. `processing_completed`

**If any step is missing, that's where the issue is!**

---

## 🎯 Next Steps Based on Logs

### If you see CRITICAL errors about missing secrets:
👉 **Set API keys** - See [QUICK-START.md](../QUICK-START.md)

### If you see ERROR about invalid API keys:
👉 **Verify and regenerate keys** - See [WHAT-YOU-NEED-TO-DO.md](WHAT-YOU-NEED-TO-DO.md)

### If you see WARN about rate limits:
👉 **Check API usage** - View OpenAI/SendGrid dashboards

### If you see INFO events only:
👉 **Everything is working!** 🎉

---

## 📞 Getting Help

**Still stuck after checking logs?**

1. Copy the full error message from logs
2. Check which event is failing
3. Look up the event in this guide
4. Follow the suggested fix

**Common issues are documented in:**
- [TROUBLESHOOTING-401.md](TROUBLESHOOTING-401.md) - Authentication issues
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment problems
- [WHAT-YOU-NEED-TO-DO.md](WHAT-YOU-NEED-TO-DO.md) - Configuration help

---

**Quick Link to Logs:**
```
https://supabase.com/dashboard/project/nopocimtfthppwssohty/logs/edge-functions
```

**Or run:**
```bash
deno task logs
```

