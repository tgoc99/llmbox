# Quick Start: Usage Tracking & Billing

Get LLMBox's usage tracking and Stripe billing up and running in 30 minutes.

## Prerequisites

- Supabase account & project
- Stripe account (test mode)
- SendGrid account
- OpenAI API key
- Node.js 18+ and npm

## Step-by-Step Setup

### 1. Database Setup (5 min)

Apply the migration to create tables:

```bash
cd llmbox

# Option A: Using Supabase CLI (recommended)
supabase db push --project-ref YOUR_PROJECT_REF

# Option B: Using psql directly
psql $DATABASE_URL -f supabase/migrations/20241008000000_initial_schema.sql
```

Verify tables created:

```bash
psql $DATABASE_URL -c "SELECT tier_name, cost_limit_usd FROM pricing_tiers;"
```

You should see 4 tiers: free, basic, pro, enterprise.

### 2. Create Stripe Products (10 min)

1. Log in to https://dashboard.stripe.com
2. Switch to **Test Mode** (toggle in top right)
3. Go to **Products** → **Add Product**

Create two products:

**Pro Plan:**
- Name: LLMBox Pro
- Description: For everyday productivity - more usage
- Price: $20.00/month (recurring)
- Copy the Price ID (starts with `price_`)

**Max Plan:**
- Name: LLMBox Max
- Description: Get the most out of LLMBox - much more usage
- Price: $100.00/month (recurring)
- Copy the Price ID

Update database with Price IDs:

```bash
psql $DATABASE_URL << EOF
UPDATE pricing_tiers SET stripe_price_id = 'price_XXXXX' WHERE tier_name = 'pro';
UPDATE pricing_tiers SET stripe_price_id = 'price_YYYYY' WHERE tier_name = 'max';
EOF
```

### 3. Set Environment Variables (5 min)

Create `web/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_...
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
NEXT_PUBLIC_WEB_APP_URL=http://localhost:3000
WEB_APP_URL=http://localhost:3000
LOG_LEVEL=INFO
```

Set Supabase Edge Function secrets:

```bash
supabase secrets set \
  OPENAI_API_KEY=sk-... \
  SENDGRID_API_KEY=SG... \
  SERVICE_EMAIL_ADDRESS=chat@llmbox.ai \
  OPENAI_MODEL=gpt-4o-mini \
  LOG_LEVEL=INFO \
  WEB_APP_URL=http://localhost:3000 \
  --project-ref YOUR_PROJECT_REF
```

### 4. Deploy Edge Function (3 min)

```bash
supabase functions deploy email-webhook --project-ref YOUR_PROJECT_REF
```

Verify deployment:

```bash
supabase functions list
```

### 5. Start Web App (2 min)

```bash
cd web
npm install
npm run dev
```

Web app should be running at http://localhost:3000

### 6. Set Up Stripe Webhook (5 min)

**For local testing:**

```bash
# In a new terminal
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret that appears (starts with `whsec_`).

Update your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart the web app.

**For production:** See `EXTERNAL_SETUP.md`

### 7. Test It Out! (5 min)

**Test 1: Send an email**

Send an email to your service address from a new email account:

```
To: chat@llmbox.ai
Subject: Test
Body: Hello! Write me a short poem.
```

Check database:

```bash
psql $DATABASE_URL -c "SELECT email, tier, cost_used_usd, cost_limit_usd FROM users ORDER BY created_at DESC LIMIT 1;"
```

You should see your new user with some cost tracked!

**Test 2: Pricing page**

Visit http://localhost:3000/pricing

**Test 3: Upgrade flow**

1. Open http://localhost:3000/pricing?email=test@example.com
2. Click "Try LLMBox" on Pro plan
3. Use Stripe test card:
   - Card: 4242 4242 4242 4242
   - Expiry: 12/34
   - CVC: 123
   - ZIP: 12345
4. Complete checkout
5. You should be redirected to success page

Check database:

```bash
psql $DATABASE_URL -c "SELECT email, tier, cost_limit_usd, subscription_status FROM users WHERE email = 'test@example.com';"
```

Should show tier = 'pro', cost_limit_usd = 16.00, subscription_status = 'active'!

**Test 4: Billing dashboard**

Visit http://localhost:3000/billing?email=test@example.com

Should show your upgraded account with usage stats!

## You're Done! 🎉

Your usage tracking and billing system is now working!

## What's Next?

### For Development

1. **Test edge cases** - See `TESTING_USAGE_TRACKING.md` for comprehensive test scenarios
2. **Customize pricing** - Adjust tiers and limits in database
3. **Update branding** - Customize colors, email templates, etc.

### For Production

1. **Complete external setup** - See `EXTERNAL_SETUP.md`
   - Configure domain and DNS
   - Set up SendGrid domain authentication
   - Switch Stripe to live mode
   - Deploy to Vercel

2. **Security hardening**
   - Enable Stripe webhook signature verification
   - Add rate limiting
   - Enable Supabase RLS policies
   - Review Terms & Privacy policy

3. **Monitoring**
   - Set up error tracking (Sentry, LogRocket)
   - Configure alerts for failed webhooks
   - Monitor usage and costs
   - Set up database backups

## Common Issues

### "User not found" when trying to upgrade

**Solution:** The user must send at least one email first to be created in the database.

### Stripe webhook events not processing

**Solution:**
- Ensure `stripe listen` is running (local)
- Check webhook URL is publicly accessible (production)
- Verify webhook secret matches

### Usage not being tracked

**Solution:**
- Check Supabase Edge Function logs: `supabase functions logs email-webhook`
- Verify database connection
- Ensure OpenAI response includes usage field

### Can't access billing page

**Solution:**
- User must exist in database (send an email first)
- Check email address is correct in URL
- Verify API route is working: `curl http://localhost:3000/api/user?email=test@example.com`

## Useful Commands

```bash
# View Edge Function logs
supabase functions logs email-webhook --project-ref YOUR_PROJECT_REF -f

# Check database
psql $DATABASE_URL -c "SELECT * FROM users;"

# Test Stripe webhook locally
stripe trigger checkout.session.completed

# View Vercel logs (if deployed)
vercel logs

# Run web app in dev mode
cd web && npm run dev
```

## Documentation Index

- 📖 **This file** - Quick start guide
- 🔧 `EXTERNAL_SETUP.md` - Complete external setup (Stripe, DNS, etc.)
- 🧪 `TESTING_USAGE_TRACKING.md` - Comprehensive testing guide
- 📊 `USAGE_TRACKING_IMPLEMENTATION.md` - Technical implementation details
- 🔐 `ENV_VARIABLES.md` - Environment variables reference
- 🏗️ `architecture.md` - System architecture
- 📋 `prd.md` - Product requirements

## Support

Having issues?

1. Check the documentation files above
2. Review logs (Supabase, Stripe, Vercel)
3. Verify all environment variables are set
4. Test with Stripe test mode first
5. Contact: support@llmbox.ai

---

**Happy building! 🚀**

