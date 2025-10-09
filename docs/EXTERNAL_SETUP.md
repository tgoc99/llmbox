# External Setup Guide

This guide covers everything you need to do OUTSIDE the repository to get LLMBox's usage tracking and billing system working.

## Overview

You need to set up:
1. ✅ Supabase (Database + Edge Functions)
2. ✅ Stripe (Payments)
3. ✅ SendGrid (Email)
4. ✅ OpenAI (LLM API)
5. ✅ Vercel or similar (Web App Hosting)
6. ✅ Custom Domain (Optional but recommended)

**Estimated Setup Time:** 2-3 hours

---

## 1. Supabase Setup

### A. Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Choose organization and settings:
   - **Name:** llmbox-production (or your choice)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Plan:** Free tier is fine to start, upgrade as needed

### B. Get Supabase Credentials

After project is created:

1. Go to **Settings** → **API**
2. Copy these values:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Anon/Public key (safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

# Service Role key (SECRET - server-side only!)
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Project Reference
PROJECT_REF=xxxxx
```

3. Go to **Settings** → **Database**
4. Copy **Connection String** (URI format):

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### C. Apply Database Migration

Run the migration to create tables:

```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push --project-ref YOUR_PROJECT_REF

# Option 2: Using psql directly
psql $DATABASE_URL -f supabase/migrations/20241008000000_initial_schema.sql
```

Verify tables created:

```bash
psql $DATABASE_URL -c "\dt"
```

Should see: `users`, `usage_logs`, `pricing_tiers`

### D. Set Supabase Secrets

Set environment variables for Edge Functions:

```bash
# Set all secrets at once
supabase secrets set \
  OPENAI_API_KEY=sk-... \
  SENDGRID_API_KEY=SG... \
  SERVICE_EMAIL_ADDRESS=chat@llmbox.ai \
  OPENAI_MODEL=gpt-4o-mini \
  LOG_LEVEL=INFO \
  WEB_APP_URL=https://llmbox.ai \
  --project-ref YOUR_PROJECT_REF
```

Or set them one by one via Supabase Dashboard:
- Go to **Edge Functions** → **Settings** → **Secrets**

---

## 2. Stripe Setup

### A. Create Stripe Account

1. Go to https://stripe.com
2. Sign up for an account
3. Complete business verification (can take a few days)
4. For testing, you can use Test Mode immediately

### B. Create Products and Prices

**Important:** Do this in **Test Mode** first, then repeat in **Live Mode** when ready.

1. Go to **Products** → **Add Product**

2. Create **Pro Plan:**
   - **Name:** LLMBox Pro
   - **Description:** For everyday productivity - more usage
   - **Pricing:** $20.00 USD / month (recurring)
   - **Payment type:** Recurring
   - Click **Save product**
   - Copy the **Price ID** (starts with `price_...`)

3. Create **Max Plan:**
   - **Name:** LLMBox Max
   - **Description:** Get the most out of LLMBox - much more usage
   - **Pricing:** $100.00 USD / month (recurring)
   - Copy the **Price ID**

### C. Update Pricing Tiers in Database

Update the `pricing_tiers` table with your Stripe Price IDs:

```sql
UPDATE pricing_tiers SET stripe_price_id = 'price_xxxxx' WHERE tier_name = 'pro';
UPDATE pricing_tiers SET stripe_price_id = 'price_yyyyy' WHERE tier_name = 'max';
```

### D. Configure Stripe Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - **Test Mode:** Use Stripe CLI or ngrok: `https://your-url.vercel.app/api/stripe/webhook`
   - **Live Mode:** `https://llmbox.ai/api/stripe/webhook`

4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click **Add endpoint**

6. Copy the **Signing secret** (starts with `whsec_...`)

### E. Get Stripe API Keys

1. Go to **Developers** → **API keys**

2. Copy these values:

**Test Mode:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_MAX=price_...
```

**Live Mode:** (when ready)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
# ... repeat for all keys
```

### F. Enable Customer Portal

1. Go to **Settings** → **Customer Portal**
2. Click **Activate**
3. Configure settings:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to cancel subscriptions
   - ✅ Show billing history
4. Save changes

---

## 3. SendGrid Setup

### A. Create SendGrid Account

1. Go to https://sendgrid.com
2. Sign up (free tier: 100 emails/day)
3. Verify your email address

### B. Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `llmbox-production`
4. Permissions: **Full Access**
5. Click **Create & View**
6. Copy the API key (starts with `SG.`)

```bash
SENDGRID_API_KEY=SG.xxxxxx
```

### C. Verify Sender Email

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your details:
   - **From Email:** chat@llmbox.ai (or your domain)
   - **From Name:** LLMBox
   - **Reply To:** Same as From Email
4. Complete verification (check your email)

```bash
SERVICE_EMAIL_ADDRESS=chat@llmbox.ai
```

### D. Configure Inbound Parse (for receiving emails)

1. Go to **Settings** → **Inbound Parse**
2. Click **Add Host & URL**
3. Enter:
   - **Domain:** llmbox.ai (your domain)
   - **Subdomain:** chat or mail
   - **Destination URL:** Your Supabase Edge Function URL
     ```
     https://xxxxx.supabase.co/functions/v1/email-webhook
     ```
4. Click **Add**

5. Configure DNS (see section 6 below)

---

## 4. OpenAI Setup

### A. Create OpenAI Account

1. Go to https://platform.openai.com
2. Sign up or log in
3. Add payment method (required for API access)

### B. Create API Key

1. Go to **API keys**
2. Click **Create new secret key**
3. Name: `llmbox-production`
4. Copy the key (starts with `sk-`)

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### C. Set Usage Limits (Recommended)

1. Go to **Settings** → **Limits**
2. Set a monthly budget to avoid surprises
3. Example: $100/month hard limit

---

## 5. Vercel Deployment (Web App)

### A. Install Vercel CLI

```bash
npm install -g vercel
```

### B. Deploy Web App

```bash
cd web
vercel login
vercel
```

Follow prompts:
- Link to new project
- Choose project name: `llmbox`

### C. Set Environment Variables

In Vercel Dashboard or via CLI:

```bash
# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Stripe
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_ID_PRO
vercel env add STRIPE_PRICE_ID_MAX

# App URL
vercel env add NEXT_PUBLIC_WEB_APP_URL
```

### D. Redeploy with Environment Variables

```bash
vercel --prod
```

Your web app should now be live at: `https://llmbox.vercel.app`

---

## 6. Domain & DNS Setup

### A. Purchase Domain (Optional)

Recommended registrars:
- Namecheap
- Google Domains
- Cloudflare

Example domain: `llmbox.ai`

### B. Configure DNS Records

Add these DNS records:

**For Web App (Vercel):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

**For Email Receiving (SendGrid Inbound Parse):**
```
Type: MX
Name: @
Value: mx.sendgrid.net
Priority: 10
```

**For Email Sending (SendGrid Authentication):**

Follow SendGrid's domain authentication wizard:
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Add the CNAME records they provide

**For Email Service:**
```
Type: A
Name: chat (or your subdomain)
Value: [SendGrid MX IP]
```

### C. Wait for DNS Propagation

Can take 1-48 hours. Check with:
```bash
dig llmbox.ai
dig MX llmbox.ai
```

### D. Update Environment Variables

Once domain is working:

```bash
# Update in Supabase
supabase secrets set WEB_APP_URL=https://llmbox.ai --project-ref YOUR_PROJECT_REF

# Update in Vercel
vercel env add NEXT_PUBLIC_WEB_APP_URL production
# Enter: https://llmbox.ai
```

### E. Update Stripe Webhook URL

In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Edit your webhook endpoint
3. Update URL to: `https://llmbox.ai/api/stripe/webhook`

---

## 7. Environment Variables Checklist

Create a `.env` file for local development (DO NOT commit to git):

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_MAX=price_...

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SERVICE_EMAIL_ADDRESS=chat@llmbox.ai

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# App
NEXT_PUBLIC_WEB_APP_URL=http://localhost:3000  # Change to your domain in production
WEB_APP_URL=http://localhost:3000
LOG_LEVEL=INFO
```

---

## 8. Testing Connectivity

### Test Supabase Connection

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pricing_tiers;"
```

Should return: `4`

### Test Stripe Connection

```bash
curl https://api.stripe.com/v1/customers \
  -u sk_test_xxxxx:
```

Should return customer list (may be empty)

### Test SendGrid

```bash
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"personalizations":[{"to":[{"email":"your-email@example.com"}]}],"from":{"email":"chat@llmbox.ai"},"subject":"Test","content":[{"type":"text/plain","value":"Hello!"}]}'
```

Check your inbox

### Test OpenAI

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 10
  }'
```

Should return a response

---

## 9. Production Readiness Checklist

Before launching:

- [ ] Switch Stripe from Test Mode to Live Mode
- [ ] Update all Stripe environment variables with live keys
- [ ] Configure live Stripe webhook endpoint
- [ ] Domain DNS fully propagated and working
- [ ] SendGrid domain authenticated and verified
- [ ] SSL certificates working (Vercel handles this automatically)
- [ ] All environment variables set in production
- [ ] Database backed up
- [ ] Terms & Privacy policy reviewed by legal
- [ ] Test complete payment flow with real card
- [ ] Monitor logs for 24 hours after launch
- [ ] Set up error alerting (Sentry, LogRocket, etc.)
- [ ] Configure database usage alerts
- [ ] Set up cost monitoring for OpenAI API

---

## 10. Cost Estimates

### Supabase
- **Free:** 500MB database, 2GB bandwidth, 50MB file storage
- **Pro:** $25/month - 8GB database, 50GB bandwidth, 100GB file storage
- Estimate: Start with Free, upgrade when needed

### Stripe
- **Transaction fees:** 2.9% + $0.30 per successful charge
- Example: $9 plan = $0.56 fee, you keep $8.44
- No monthly fees

### SendGrid
- **Free:** 100 emails/day
- **Essentials:** $19.95/month - 50,000 emails/month
- Estimate: Start with Free

### OpenAI
- **GPT-4o-mini:** $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **GPT-4o:** $2.50 per 1M input tokens, $10.00 per 1M output tokens
- Example: 1000 emails/month ≈ $5-15 depending on model and length
- Your users are charged for this via their tiers

### Vercel
- **Free:** Hobby plan - 100GB bandwidth
- **Pro:** $20/month - 1TB bandwidth
- Estimate: Start with Free

**Total Monthly Costs (starting):** ~$0-50
**Total Monthly Costs (at scale):** ~$100-500+ depending on users

---

## 11. Troubleshooting

### Can't connect to Supabase
- Check URL and keys are correct
- Verify project is not paused (free tier auto-pauses after inactivity)
- Check IP allowlist if using database directly

### Stripe webhook not working
- Verify webhook URL is publicly accessible
- Check webhook secret matches
- Look at webhook logs in Stripe Dashboard
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Emails not sending
- Verify SendGrid API key has Full Access
- Check sender email is verified
- Look at SendGrid activity logs
- Verify SERVICE_EMAIL_ADDRESS matches verified sender

### Domain not working
- Wait for DNS propagation (can take 24-48 hours)
- Use `dig` or online DNS checkers to verify
- Check DNS records are correct
- Verify SSL certificate is active

---

## 12. Getting Help

If you're stuck:

1. **Check logs:**
   - Supabase: `supabase functions logs email-webhook`
   - Vercel: `vercel logs`
   - Stripe: Dashboard → Developers → Logs

2. **Test connectivity** for each service (see section 8)

3. **Review documentation:**
   - Supabase: https://supabase.com/docs
   - Stripe: https://stripe.com/docs
   - SendGrid: https://docs.sendgrid.com
   - Vercel: https://vercel.com/docs

4. **Community support:**
   - Supabase Discord
   - Stripe Discord
   - Email: support@llmbox.ai

---

## Next Steps

After completing this setup:

1. ✅ Run through TESTING_USAGE_TRACKING.md
2. ✅ Do a test payment with Stripe test card
3. ✅ Send test emails to verify full flow
4. ✅ Monitor for 24-48 hours before announcing
5. ✅ Set up monitoring and alerts

Good luck! 🚀

