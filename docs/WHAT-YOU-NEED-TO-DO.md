# What You Need to Do Outside This Repo - Complete Guide

## Overview

Your Epic 1 code is **complete and deployed** to Supabase. However, the service requires **external configurations** in three platforms before it can send and receive emails:

1. **SendGrid** - For sending and receiving emails
2. **OpenAI** - For AI response generation
3. **Your DNS Provider** - For email routing

---

## Quick Summary

### ✅ What's Already Done (In This Repo)

- Edge Function code (all stories 1.1-1.5)
- Error handling and logging
- Retry logic for API failures
- Email parsing and formatting
- Comprehensive tests
- Documentation

### ☐ What You Need to Do (Outside This Repo)

1. **SendGrid Account Setup** → Get API key, verify sender
2. **OpenAI Account Setup** → Get API key, add billing
3. **DNS Configuration** → Add MX record for receiving emails
4. **Supabase Secrets** → Configure API keys
5. **Test End-to-End** → Send real email and verify response

**Total Time:** 30 minutes + 24-48 hours (DNS wait)

---

## Detailed Steps

### Step 1: SendGrid Configuration

**Purpose:** Your service needs SendGrid to:
- **Send** email responses to users
- **Receive** inbound emails via webhook

#### A. Create Account and Get API Key (5 minutes) DONE

```
1. Go to: https://sendgrid.com
2. Sign up for free account (100 emails/day free)
3. Navigate to: Settings → API Keys
4. Click: Create API Key
5. Name: "Email-LLM Service"
6. Permissions: Full Access
7. IMPORTANT: Copy the key immediately (shown only once!)
8. Save it somewhere secure
```

**Your API key will look like:**
```
SG.1234567890abcdefghijklmnopqrstuvwxyz.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### B. Verify Sender Email/Domain DONE

**Option 1: Single Sender (Quick - For Testing)** DONE

```
1. Settings → Sender Authentication
2. Click: Single Sender Verification
3. Enter your email (e.g., you@gmail.com)
4. Check your email for verification link
5. Click verification link
6. Done! Use this email as SERVICE_EMAIL_ADDRESS
```

**⏱️ Time:** 5 minutes
**✅ Pros:** Fast, good for testing
**❌ Cons:** Limited to one email, less professional

**Option 2: Domain Authentication (For Production)** DONE

```
1. Settings → Sender Authentication
2. Click: Authenticate Your Domain
3. Enter your domain (e.g., yourdomain.com)
4. SendGrid provides DNS records to add
5. Add these records to your DNS provider
6. Wait for verification (24-48 hours)
7. Done! Use any email on your domain
```

**⏱️ Time:** 30 minutes + 24-48 hours (DNS wait)
**✅ Pros:** Professional, better deliverability, scalable
**❌ Cons:** Requires domain, takes time

#### C. Configure Inbound Email (Required) DONE

**Purpose:** This lets SendGrid forward emails to your Edge Function.

**1. Add MX Record to Your DNS:**

| Field | Value |
|-------|-------|
| Type | MX |
| Host | email.yourdomain.com |
| Value | mx.sendgrid.net |
| Priority | 10 |
| TTL | 3600 |

**Example for Different DNS Providers:**

**Cloudflare:**
```
Type: MX
Name: email
Content: mx.sendgrid.net
Priority: 10
```

**AWS Route53:**
```
Record name: email.yourdomain.com
Record type: MX
Value: 10 mx.sendgrid.net
```

**GoDaddy:**
```
Type: MX
Host: email
Points to: mx.sendgrid.net
Priority: 10
```

**2. Configure Inbound Parse in SendGrid:**

```
1. Settings → Inbound Parse
2. Click: Add Host & URL
3. Fill in:
   Subdomain: email
   Domain: yourdomain.com
   Destination URL: https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
   Check Spam: ✅ Enabled
   Send Raw: ✅ Enabled
4. Click: Add
5. Wait for DNS propagation (24-48 hours)
```

**After this is set up, emails sent to `anything@email.yourdomain.com` will trigger your Edge Function!**

---

### Step 2: OpenAI Configuration DONE

**Purpose:** Generate AI responses to emails.

#### A. Create Account (5 minutes)

```
1. Go to: https://platform.openai.com
2. Sign up for account
3. Navigate to: Billing
4. Add payment method (required even for pay-as-you-go)
5. Set usage limit: $10/month (recommended to prevent surprises)
```

#### B. Get API Key

```
1. Navigate to: API Keys
2. Click: Create new secret key
3. Name: "Email-LLM Service"
4. IMPORTANT: Copy the key immediately (shown only once!)
5. Save it somewhere secure
```

**Your API key will look like:**
```
sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```

#### C. Choose Model DONE

**Recommended: `gpt-3.5-turbo`**

| Model | Cost per 1K tokens | Speed | Quality | Use Case |
|-------|-------------------|-------|---------|----------|
| gpt-3.5-turbo | $0.002 | Fast | Good | ✅ MVP/Testing |
| gpt-4-turbo | $0.01 | Medium | Excellent | Production |
| gpt-4 | $0.06 | Slow | Excellent | Premium |

**Cost Estimate for 100 emails/day:**
- **gpt-3.5-turbo:** ~$15/month
- **gpt-4:** ~$300/month

---

### Step 3: Configure DNS Records TODO

**Required DNS Records:**

| Purpose | Type | Host | Value | Priority |
|---------|------|------|-------|----------|
| Receive emails | MX | email.yourdomain.com | mx.sendgrid.net | 10 |
| DKIM signing | CNAME | s1._domainkey.yourdomain.com | (from SendGrid) | - |
| DKIM signing | CNAME | s2._domainkey.yourdomain.com | (from SendGrid) | - |
| SPF record | TXT | yourdomain.com | v=spf1 include:sendgrid.net ~all | - |

**⚠️ CRITICAL:** MX record is required for receiving emails. CNAME/TXT records are only needed if you're doing domain authentication (recommended for production).

**How to Add DNS Records:**

**Where to find your DNS provider:**
- If you registered domain with GoDaddy → GoDaddy DNS
- If using Cloudflare → Cloudflare DNS
- If using AWS → Route53
- Check your registrar's control panel

**After adding records:**
1. Wait 24-48 hours for propagation
2. Verify with: `dig email.yourdomain.com MX`
3. Expected output: `10 mx.sendgrid.net`

---

### Step 4: Set Secrets in Supabase DONE

**Purpose:** Your Edge Function needs API keys to work.

#### Option A: Via Dashboard (Easiest)

```
1. Go to: https://supabase.com/dashboard
2. Select project: llmbox (nopocimtfthppwssohty)
3. Navigate to: Project Settings → Edge Functions → Secrets
4. Click: Add Secret
5. Add each secret below
```

#### Option B: Via CLI (Faster)

```bash
supabase secrets set SENDGRID_API_KEY="SG.your-key-here" --project-ref nopocimtfthppwssohty
supabase secrets set OPENAI_API_KEY="sk-proj-your-key-here" --project-ref nopocimtfthppwssohty
supabase secrets set SERVICE_EMAIL_ADDRESS="assistant@yourdomain.com" --project-ref nopocimtfthppwssohty
supabase secrets set OPENAI_MODEL="gpt-3.5-turbo" --project-ref nopocimtfthppwssohty
```

#### Required Secrets:

| Secret Name | Value | Where to Get It |
|-------------|-------|----------------|
| `SENDGRID_API_KEY` | Your SendGrid API key | SendGrid → Settings → API Keys |
| `OPENAI_API_KEY` | Your OpenAI API key | OpenAI → API Keys |
| `SERVICE_EMAIL_ADDRESS` | Verified sender email | Your verified SendGrid email |
| `OPENAI_MODEL` | Model name | Use `gpt-3.5-turbo` |

**Example:**
```
SENDGRID_API_KEY=SG.abc123xyz789...
OPENAI_API_KEY=sk-proj-abc123xyz789...
SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com
OPENAI_MODEL=gpt-3.5-turbo
```

---

### Step 5: Test the Deployment

#### Test 1: Verify Function is Running (1 minute)

```bash
curl https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

**Expected Response:**
```json
{"error": "Method not allowed"}
```

**✅ This is CORRECT!** The function expects POST requests.

#### Test 2: Send Test Email (After DNS Propagation)

**Prerequisites:**
- ✅ DNS records propagated (wait 24-48 hours after adding MX record)
- ✅ Secrets configured in Supabase
- ✅ Sender verified in SendGrid

**Steps:**

```
1. Open your email client (Gmail, Outlook, etc.)
2. Send email to: test@email.yourdomain.com
   Subject: "Hello Assistant"
   Body: "Can you help me understand how AI works?"
3. Wait up to 30 seconds
4. Check your inbox for response
```

**Expected Result:**

You receive an email response:
- **From:** assistant@yourdomain.com (your SERVICE_EMAIL_ADDRESS)
- **Subject:** "Re: Hello Assistant"
- **Body:** AI-generated explanation about AI
- **Threading:** Response appears in same email thread

#### Test 3: Monitor Logs (Real-Time Debugging)

```
1. Go to: https://supabase.com/dashboard
2. Select: llmbox project
3. Navigate to: Edge Functions → email-webhook → Logs
4. You should see:
   - webhook_received
   - email_parsed
   - openai_call_started
   - openai_response_received
   - email_sent
   - processing_completed
```

**If you see errors:**
- `openai_auth_error` → Check OPENAI_API_KEY
- `sendgrid_auth_error` → Check SENDGRID_API_KEY
- `validation_error` → Check SendGrid webhook configuration

---

## Troubleshooting

### Problem: No webhook triggered (nothing in logs)

**Cause:** DNS not propagated or MX record incorrect

**Check:**
```bash
dig email.yourdomain.com MX
```

**Expected output:**
```
email.yourdomain.com. 3600 IN MX 10 mx.sendgrid.net.
```

**Solution:**
- Wait longer (DNS can take 48 hours)
- Verify MX record in DNS provider
- Try from different DNS server: `dig @8.8.8.8 email.yourdomain.com MX`

---

### Problem: Webhook triggered but no response email

**Cause:** Sender not verified or API keys invalid

**Check logs for:**
```
event: sendgrid_auth_error
OR
event: openai_auth_error
```

**Solution:**
- Verify sender domain in SendGrid
- Regenerate API keys if needed
- Check secrets are set correctly in Supabase

---

### Problem: Response email goes to spam

**Cause:** Domain not properly authenticated

**Solution:**
1. Complete domain authentication (not single sender)
2. Add SPF record: `v=spf1 include:sendgrid.net ~all`
3. Add DKIM CNAME records from SendGrid
4. Wait for verification

---

### Problem: OpenAI errors

**Cause:** No billing set up or usage limits hit

**Solution:**
1. OpenAI → Billing → Add payment method
2. Set usage limit: $10/month
3. Check current usage
4. Verify API key has access to chosen model

---

## Quick Reference

### Your Supabase Project

```
Project ID: nopocimtfthppwssohty
Region: us-east-2
Function Name: email-webhook
Function URL: https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

### Email Addresses

```
Receiving emails: anything@email.yourdomain.com
Sending emails: assistant@yourdomain.com (your SERVICE_EMAIL_ADDRESS)
```

### Cost Estimate

```
Supabase Edge Functions: FREE (500K invocations/month)
SendGrid: FREE (100 emails/day)
OpenAI (gpt-3.5-turbo): ~$15/month (100 emails/day)
Total: ~$15/month
```

### Important Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **SendGrid Dashboard:** https://app.sendgrid.com
- **OpenAI Dashboard:** https://platform.openai.com
- **DNS Propagation Checker:** https://whatsmydns.net

---

## Checklist

Before going live, ensure:

**SendGrid:**
- [ ] Account created
- [ ] API key generated and saved
- [ ] Sender email/domain verified
- [ ] Inbound Parse configured
- [ ] MX record added to DNS
- [ ] DNS propagated (wait 24-48 hours)

**OpenAI:**
- [ ] Account created
- [ ] Billing information added
- [ ] Usage limit set ($10/month)
- [ ] API key generated and saved
- [ ] Model chosen (gpt-3.5-turbo)

**Supabase:**
- [ ] SENDGRID_API_KEY secret set
- [ ] OPENAI_API_KEY secret set
- [ ] SERVICE_EMAIL_ADDRESS secret set
- [ ] OPENAI_MODEL secret set
- [ ] Function deployed and running

**Testing:**
- [ ] Function responds to curl test
- [ ] Test email sent and received
- [ ] Response email received in inbox
- [ ] Logs show successful processing
- [ ] Performance < 30 seconds

---

## Next Steps

Once everything is working:

1. **Monitor logs** for the first few days
2. **Track costs** in OpenAI dashboard
3. **Test error scenarios** (invalid emails, rate limits)
4. **Proceed to Epic 2** (webhook verification, rate limiting)

---

## Getting Help

**Check logs first!** Most issues are visible in Supabase logs.

```
Supabase Dashboard → Edge Functions → email-webhook → Logs
```

**Common log events to look for:**
- `webhook_received` - Email arrived
- `email_parsed` - Email successfully parsed
- `openai_response_received` - AI generated response
- `email_sent` - Response email sent
- Any event with `ERROR` or `CRITICAL` level

**Still stuck?**
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
- Check [DEPLOYMENT-QUICK-START.md](./DEPLOYMENT-QUICK-START.md) for quick reference
- Verify all secrets are set correctly
- Wait for DNS propagation (common issue!)

---

**Ready to deploy?** Follow the steps above and you'll be live in 30 minutes (+ DNS wait time)!

