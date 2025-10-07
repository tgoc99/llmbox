# Epic 1 Quick Deployment Guide

**⏱️ Estimated Time:**
- **With domain:** 2-3 days (DNS propagation)
- **Without domain (testing only):** 30 minutes

---

## What You Need to Do Outside This Repo

### 1. SendGrid Setup (15 minutes + DNS wait)

#### Quick Start (Testing Only - 5 minutes)
```
1. Sign up at sendgrid.com
2. Settings → API Keys → Create API Key (Full Access)
3. Copy API key (shown once!) → Save for Step 4
4. Settings → Sender Authentication → Single Sender Verification
5. Verify your email address
```

#### Production Setup (Required for real use)
```
1. SendGrid → Settings → Sender Authentication → Authenticate Domain
2. Add provided DNS records to your domain:
   - 2x CNAME records (for DKIM)
   - 1x TXT record (for SPF)
3. Wait 24-48 hours for verification
```

#### Receive Emails (Required)
```
1. Add MX record to DNS:
   Type: MX
   Host: email.yourdomain.com
   Value: mx.sendgrid.net
   Priority: 10

2. SendGrid → Settings → Inbound Parse → Add Host & URL
   Subdomain: email
   Domain: yourdomain.com
   URL: https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
   Send Raw: ❌ Disabled (must use parsed format)

3. Wait 24-48 hours for DNS propagation
```

### 2. OpenAI Setup (5 minutes)

```
1. Sign up at platform.openai.com
2. Add billing information (required - credit card)
3. Set usage limit: $10/month (recommended)
4. API Keys → Create new secret key
5. Copy API key (shown once!) → Save for Step 4
```

### 3. Deploy Code (Already Done!)

Your code is already deployed to Supabase:
- **Function URL:** `https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook`

To redeploy after changes:
```bash
# If using Supabase CLI:
supabase functions deploy email-webhook --project-ref nopocimtfthppwssohty

# Or use Supabase MCP tools in Cursor
```

### 4. Configure Secrets in Supabase (5 minutes)

**Via Supabase Dashboard:**

```
1. Go to: supabase.com/dashboard
2. Select project: llmbox (nopocimtfthppwssohty)
3. Project Settings → Edge Functions → Secrets
4. Add these secrets:
```

| Secret Name | Where to Get It | Example |
|-------------|----------------|---------|
| `SENDGRID_API_KEY` | SendGrid → Settings → API Keys | `SG.abc123...` |
| `OPENAI_API_KEY` | OpenAI → API Keys | `sk-proj-abc123...` |
| `SERVICE_EMAIL_ADDRESS` | Your verified SendGrid sender | `assistant@yourdomain.com` |
| `OPENAI_MODEL` | Choose model | `gpt-3.5-turbo` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

**Via CLI (faster):**

```bash
supabase secrets set SENDGRID_API_KEY="SG.your-key" --project-ref nopocimtfthppwssohty
supabase secrets set OPENAI_API_KEY="sk-your-key" --project-ref nopocimtfthppwssohty
supabase secrets set SERVICE_EMAIL_ADDRESS="assistant@yourdomain.com" --project-ref nopocimtfthppwssohty
supabase secrets set OPENAI_MODEL="gpt-3.5-turbo" --project-ref nopocimtfthppwssohty
```

---

## Testing (5 minutes)

### Test 1: Function is Running

```bash
curl https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

**Expected:** `405 Method Not Allowed` ✅ (This is correct!)

### Test 2: Send Test Email (After DNS Propagation)

```
1. Email to: test@email.yourdomain.com
2. Subject: "Hello Assistant"
3. Body: "Can you help me?"
4. Wait: 30 seconds
5. Check inbox: You should receive AI response
```

### Test 3: Check Logs

```
1. Supabase Dashboard → Edge Functions → email-webhook → Logs
2. Look for: webhook_received → email_parsed → openai_response_received → email_sent
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No email response | Check spam folder, verify sender domain in SendGrid |
| Webhook not triggering | Wait for DNS propagation (24-48 hours) |
| OpenAI error | Verify API key, check billing is set up |
| SendGrid auth error | Regenerate API key with Full Access permissions |

**Always check Supabase logs first!** They show exactly what went wrong.

---

## Cost Estimate

**Monthly Costs (100 emails/day):**

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Supabase | 500K Edge Function invocations | $0 |
| SendGrid | 100 emails/day | $0 |
| OpenAI (gpt-3.5-turbo) | No free tier | $15/month |
| **Total** | | **~$15/month** |

**Upgrade to gpt-4:** ~$300/month (20x more expensive)

---

## DNS Propagation Wait Times

| Provider | Typical Time |
|----------|-------------|
| Cloudflare | 1-2 hours |
| AWS Route53 | 1-4 hours |
| GoDaddy | 4-24 hours |
| Other | Up to 48 hours |

**Check propagation:** `dig email.yourdomain.com MX`

---

## Quick Links

- **Supabase Dashboard:** [supabase.com/dashboard](https://supabase.com/dashboard)
- **SendGrid Dashboard:** [app.sendgrid.com](https://app.sendgrid.com)
- **OpenAI Dashboard:** [platform.openai.com](https://platform.openai.com)
- **Full Deployment Guide:** [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
- **DNS Checker:** [whatsmydns.net](https://www.whatsmydns.net)

---

## Summary

**What's Inside This Repo:**
- ✅ Code (complete)
- ✅ Tests (unit + integration)
- ✅ Documentation

**What You Need to Do:**
1. ☐ Get SendGrid API key
2. ☐ Verify sender domain in SendGrid
3. ☐ Configure MX record for inbound email
4. ☐ Get OpenAI API key
5. ☐ Set secrets in Supabase
6. ☐ Wait for DNS propagation (24-48 hours)
7. ☐ Test with real email

**Ready to Deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

