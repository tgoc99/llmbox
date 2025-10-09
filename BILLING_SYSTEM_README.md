# LLMBox Usage Tracking & Billing System

**Status:** ✅ Complete and Ready for Testing

**Implementation Date:** October 8, 2025

## What Was Built

A complete usage tracking and Stripe-powered billing system for LLMBox that:

✅ **Tracks actual API costs** in dollars (not just tokens)
✅ **Enforces $1 free tier** limit before requiring payment
✅ **Sends beautiful upgrade emails** when users hit their limit
✅ **Integrates with Stripe** for seamless subscription payments
✅ **Provides billing dashboard** for users to manage subscriptions
✅ **Handles subscription lifecycle** (upgrades, cancellations, renewals)
✅ **Includes legal coverage** with Terms of Service & Privacy Policy

## Quick Links

📚 **Documentation:**
- [**Quick Start Guide**](docs/QUICKSTART_BILLING.md) - Get running in 30 minutes
- [**External Setup**](docs/EXTERNAL_SETUP.md) - Stripe, DNS, domain setup
- [**Testing Guide**](docs/TESTING_USAGE_TRACKING.md) - Comprehensive testing
- [**Environment Variables**](docs/ENV_VARIABLES.md) - All env vars explained
- [**Implementation Details**](docs/USAGE_TRACKING_IMPLEMENTATION.md) - Technical overview

## Pricing Tiers

| Tier | Monthly Cost | Usage Level | Internal Limit |
|------|-------------|-------------|----------------|
| **Free** | $0 | Limited usage | $1 |
| **Pro** | $20 | More usage | $16 |
| **Max** | $100 | Much more usage | $100 |

*Usage is measured internally based on AI model costs. Users see simple tier-based access. Pro tier gives users $16 in credits while charging $20 (20% margin).*

## How It Works

### For Users

1. **Send email** to `chat@llmbox.ai` - No signup required!
2. **Get AI response** - Powered by GPT-4o or GPT-4o-mini
3. **Track usage** automatically - Based on actual API costs
4. **Upgrade when needed** - Simple Stripe checkout when $1 limit reached

### Under the Hood

```
Email → SendGrid → Email Webhook → Check Limit
                                      ↓
                               (Under limit?)
                                      ↓
                                   Yes → OpenAI API
                                      ↓
                                 Track Cost
                                      ↓
                                Update Database
                                      ↓
                                Send Response
```

When limit exceeded:
```
Email → Check Limit → Over Limit! → Send Upgrade Email
                                    (with link to /pricing)
```

Upgrade flow:
```
User → Pricing Page → Stripe Checkout → Payment Success
                                              ↓
                                    Webhook Updates Database
                                              ↓
                                    User tier upgraded!
```

## File Structure

### Backend (Supabase Edge Functions)

```
supabase/
├── migrations/
│   └── 20241008000000_initial_schema.sql     # Database schema
└── functions/
    └── email-webhook/
        ├── database.ts                        # DB operations
        ├── usageTracker.ts                    # Cost tracking
        ├── limitEmailTemplate.ts              # Email templates
        └── index.ts                           # Updated main handler
```

### Frontend (Next.js Web App)

```
web/
├── lib/
│   ├── stripe.ts                             # Stripe client
│   └── supabase.ts                           # Supabase client
├── app/
│   ├── pricing/page.tsx                      # Pricing tiers
│   ├── billing/page.tsx                      # User dashboard
│   ├── success/page.tsx                      # Post-payment
│   ├── terms/page.tsx                        # Legal T&C
│   └── api/
│       ├── stripe/
│       │   ├── checkout/route.ts             # Create checkout session
│       │   ├── webhook/route.ts              # Handle Stripe events
│       │   └── portal/route.ts               # Customer portal
│       └── user/route.ts                     # Get user data
└── components/
    └── Hero.tsx                              # Updated with email
```

### Documentation

```
docs/
├── QUICKSTART_BILLING.md                     # Start here!
├── EXTERNAL_SETUP.md                         # Stripe, DNS, domain
├── TESTING_USAGE_TRACKING.md                 # Testing guide
├── ENV_VARIABLES.md                          # Environment vars
├── USAGE_TRACKING_IMPLEMENTATION.md          # Technical docs
├── architecture.md                           # System architecture
└── prd.md                                    # Product requirements
```

## Getting Started

### Prerequisites

- [ ] Supabase account & project
- [ ] Stripe account (test mode is fine)
- [ ] SendGrid account (free tier works)
- [ ] OpenAI API key
- [ ] Node.js 18+ installed

### Installation

```bash
# 1. Apply database migration
supabase db push --project-ref YOUR_PROJECT_REF

# 2. Install web app dependencies
cd web
npm install

# 3. Set environment variables (see docs/ENV_VARIABLES.md)
cp .env.example .env.local
# Edit .env.local with your keys

# 4. Deploy Edge Function
supabase functions deploy email-webhook --project-ref YOUR_PROJECT_REF

# 5. Start web app
npm run dev
```

Full setup guide: [docs/QUICKSTART_BILLING.md](docs/QUICKSTART_BILLING.md)

## Testing

### Quick Test

```bash
# 1. Send email to your service address
# From: newuser@example.com
# To: chat@llmbox.ai
# Body: "Hello! Write me a poem."

# 2. Check user was created
psql $DATABASE_URL -c "SELECT email, tier, cost_used_usd FROM users WHERE email = 'newuser@example.com';"

# 3. Test upgrade flow
# Visit: http://localhost:3000/pricing?email=newuser@example.com
# Use Stripe test card: 4242 4242 4242 4242

# 4. Verify upgrade
psql $DATABASE_URL -c "SELECT email, tier, cost_limit_usd FROM users WHERE email = 'newuser@example.com';"
```

Comprehensive testing: [docs/TESTING_USAGE_TRACKING.md](docs/TESTING_USAGE_TRACKING.md)

## Database Schema

### Users Table

Stores account information and usage limits:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'free',              -- free, basic, pro, enterprise
  cost_used_usd NUMERIC DEFAULT 0,       -- Actual $ spent
  cost_limit_usd NUMERIC DEFAULT 1.00,   -- $ limit for tier
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Usage Logs Table

Tracks every API call for billing accuracy:

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  message_id TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  model TEXT,
  cost_usd NUMERIC NOT NULL,            -- Calculated cost
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pricing Tiers Table

Configures available plans:

```sql
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY,
  tier_name TEXT UNIQUE,
  cost_limit_usd NUMERIC,
  price_cents INTEGER,
  stripe_price_id TEXT,
  features JSONB,
  sort_order INTEGER
);
```

## Key Features

### 1. Automatic User Creation

Users don't need to sign up - they're created automatically when they send their first email.

### 2. Real-Time Cost Tracking

Every API call is tracked with:
- Exact token counts (input & output)
- Model used
- Calculated cost in USD
- Timestamp

### 3. Smart Limit Enforcement

Before processing each email:
- Check if user has remaining budget
- Check if paid user has active subscription
- Send appropriate notification if blocked

### 4. Beautiful Emails

Limit exceeded email includes:
- Current usage stats
- Link to pricing page (email pre-filled)
- Explanation of tiers
- Clear call-to-action

### 5. Seamless Stripe Integration

- Hosted Stripe Checkout (PCI compliant)
- Customer Portal for self-service
- Automatic webhook handling
- Subscription lifecycle management

### 6. User Dashboard

Users can view:
- Current tier and status
- Usage statistics with progress bar
- Remaining budget
- Billing period dates
- Quick access to Stripe portal

### 7. Legal Protection

Comprehensive Terms of Service and Privacy Policy covering:
- Service description and limitations
- Acceptable use policy
- Data collection and sharing
- Payment terms
- Liability disclaimers

## Environment Variables

See [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) for complete reference.

**Quick reference:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SERVICE_EMAIL_ADDRESS=chat@llmbox.ai

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# App
NEXT_PUBLIC_WEB_APP_URL=http://localhost:3000
```

## Production Deployment

### Checklist

- [ ] Switch Stripe from test to live mode
- [ ] Update all environment variables with live keys
- [ ] Configure production webhook URLs
- [ ] Set up custom domain and DNS
- [ ] Authenticate SendGrid domain
- [ ] Deploy web app to Vercel
- [ ] Test complete flow with real payment
- [ ] Set up monitoring and alerts
- [ ] Review legal pages with counsel

See [docs/EXTERNAL_SETUP.md](docs/EXTERNAL_SETUP.md) for detailed steps.

## Monitoring

### Key Metrics

**Usage:**
- Users by tier
- Daily active users
- Average cost per user
- Users near limit

**Revenue:**
- Monthly Recurring Revenue (MRR)
- Conversion rate (free → paid)
- Churn rate
- Average Revenue Per User (ARPU)

**System:**
- API error rates
- Webhook success rates
- Email delivery rates
- Database performance

### SQL Queries

```sql
-- User distribution
SELECT tier, COUNT(*) FROM users GROUP BY tier;

-- Monthly revenue
SELECT SUM(CASE
  WHEN tier = 'basic' THEN 9
  WHEN tier = 'pro' THEN 29
  WHEN tier = 'enterprise' THEN 99
END) FROM users WHERE subscription_status = 'active';

-- Users near limit
SELECT email, cost_used_usd, cost_limit_usd,
       ROUND((cost_used_usd / cost_limit_usd * 100)::numeric, 2) as pct
FROM users WHERE cost_used_usd > cost_limit_usd * 0.8;
```

## Support

### Documentation

- **Quick Start:** [docs/QUICKSTART_BILLING.md](docs/QUICKSTART_BILLING.md)
- **Setup:** [docs/EXTERNAL_SETUP.md](docs/EXTERNAL_SETUP.md)
- **Testing:** [docs/TESTING_USAGE_TRACKING.md](docs/TESTING_USAGE_TRACKING.md)
- **Env Vars:** [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md)
- **Technical:** [docs/USAGE_TRACKING_IMPLEMENTATION.md](docs/USAGE_TRACKING_IMPLEMENTATION.md)

### Troubleshooting

Common issues and solutions in each guide. Check logs first:

```bash
# Edge Function logs
supabase functions logs email-webhook --project-ref YOUR_PROJECT_REF -f

# Web app logs (Vercel)
vercel logs

# Database queries
psql $DATABASE_URL
```

### Contact

- Email: support@llmbox.ai
- Documentation: docs/
- Repository: /Users/thomasoconnor/Desktop/llmbox/

## What's Next?

### Immediate

1. Follow [QUICKSTART_BILLING.md](docs/QUICKSTART_BILLING.md)
2. Test locally with Stripe test mode
3. Deploy to production following [EXTERNAL_SETUP.md](docs/EXTERNAL_SETUP.md)

### Future Enhancements

- Admin dashboard for monitoring
- Usage reports via email
- Annual billing option
- Team/organization accounts
- Referral program
- API access for developers
- White-label options

## License

Proprietary - LLMBox © 2025

---

**Ready to get started?** → [docs/QUICKSTART_BILLING.md](docs/QUICKSTART_BILLING.md)

**Questions?** → support@llmbox.ai

