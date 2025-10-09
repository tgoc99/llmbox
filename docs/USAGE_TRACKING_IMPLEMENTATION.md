# Usage Tracking & Billing Implementation Summary

This document provides an overview of the usage tracking and Stripe billing system implementation for LLMBox.

## Implementation Date
October 8, 2025

## Overview

LLMBox now includes a complete usage tracking and billing system that:
- ✅ Tracks actual API costs in dollars (not tokens)
- ✅ Enforces $1 free tier limit
- ✅ Sends upgrade emails when limit is reached
- ✅ Integrates with Stripe for subscriptions
- ✅ Provides billing dashboard for users
- ✅ Handles subscription lifecycle events
- ✅ Includes legal Terms & Privacy pages

## Architecture

### Database Schema

Three main tables power the system:

1. **users** - Stores user account information
   - `email` - User's email address (unique identifier)
   - `tier` - Current plan (free, basic, pro, enterprise)
   - `cost_used_usd` - Actual dollars spent on API calls
   - `cost_limit_usd` - Dollar limit for current tier
   - `stripe_customer_id` - Link to Stripe customer
   - `subscription_status` - active, canceled, past_due, etc.

2. **usage_logs** - Detailed log of every API call
   - `user_id` - Reference to user
   - `message_id` - Email message ID
   - `prompt_tokens`, `completion_tokens`, `total_tokens`
   - `model` - Which OpenAI model was used
   - `cost_usd` - Calculated cost for this call

3. **pricing_tiers** - Plan configuration
   - `tier_name` - free, basic, pro, enterprise
   - `cost_limit_usd` - Dollar limit for tier
   - `price_cents` - Monthly subscription price
   - `stripe_price_id` - Link to Stripe price
   - `features` - JSON array of features

### File Structure

```
llmbox/
├── supabase/
│   ├── migrations/
│   │   └── 20241008000000_initial_schema.sql          # Database schema
│   └── functions/
│       └── email-webhook/
│           ├── database.ts                            # Database operations
│           ├── usageTracker.ts                        # Cost tracking logic
│           ├── limitEmailTemplate.ts                  # Limit notification emails
│           └── index.ts                               # Updated with limit checks
├── web/
│   ├── lib/
│   │   ├── stripe.ts                                  # Stripe client config
│   │   └── supabase.ts                                # Supabase client config
│   ├── app/
│   │   ├── pricing/page.tsx                           # Pricing page
│   │   ├── billing/page.tsx                           # Billing dashboard
│   │   ├── success/page.tsx                           # Post-payment success
│   │   ├── terms/page.tsx                             # Legal T&C
│   │   └── api/
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts                  # Create Stripe session
│   │       │   ├── webhook/route.ts                   # Handle Stripe events
│   │       │   └── portal/route.ts                    # Customer portal access
│   │       └── user/route.ts                          # Get user data
│   └── components/
│       └── Hero.tsx                                   # Updated with email & pricing
└── docs/
    ├── EXTERNAL_SETUP.md                              # Setup guide
    ├── TESTING_USAGE_TRACKING.md                      # Testing guide
    └── USAGE_TRACKING_IMPLEMENTATION.md               # This file
```

## Key Features

### 1. Cost-Based Tracking (Not Token-Based)

The system tracks actual dollar costs, not tokens. This is more accurate because:
- Different models have different pricing
- Input and output tokens cost different amounts
- Easier for users to understand

**Pricing (as of Oct 2024):**
- GPT-4o-mini: $0.15 input / $0.60 output per 1M tokens
- GPT-4o: $2.50 input / $10.00 output per 1M tokens

### 2. Free Tier

- Users get **$1 in API credits** before needing to upgrade
- No credit card required
- Automatic user creation on first email
- ~10-15 emails with GPT-4o-mini
- ~5-8 emails with GPT-4o

### 3. Pricing Tiers

| Tier | Price | Internal Limit | User-Facing Description |
|------|-------|----------------|------------------------|
| Free | $0 | $1 | Limited usage |
| Pro | $20/mo | $16 | More usage |
| Max | $100/mo | $100 | Much more usage |

**Note:** Internal limits are tracked in USD but not exposed to users. Users see simple usage-based descriptions. Pro tier has a 20% margin ($20 charge for $16 in credits).

### 4. Limit Enforcement

When a user exceeds their limit:
1. Webhook checks limit before processing
2. Sends beautiful HTML email with upgrade link
3. Does NOT generate AI response (saves costs)
4. Email includes link to pricing page with email pre-filled

### 5. Subscription Management

Users can:
- Upgrade from pricing page
- View usage statistics on billing page
- Access Stripe Customer Portal to:
  - Update payment method
  - Cancel subscription
  - View invoices
  - Download receipts

### 6. Webhook Handling

Stripe webhooks automatically:
- Activate subscription after successful payment
- Reset usage at start of new billing period
- Update subscription status (active, past_due, canceled)
- Downgrade to free tier when subscription ends

## Request Flow

### New Email Processing

```
1. Email arrives at SendGrid
   ↓
2. SendGrid forwards to email-webhook Edge Function
   ↓
3. Parse email (from, subject, body)
   ↓
4. Get or create user in database
   ↓
5. Check if user has remaining budget
   ├─ No → Send limit exceeded email, return
   ↓
6. Check if paid user has active subscription
   ├─ No → Send subscription inactive email, return
   ↓
7. Call OpenAI API
   ↓
8. Calculate cost based on tokens and model
   ↓
9. Log usage to database
   ↓
10. Update user's cost_used_usd
   ↓
11. Send AI response email
   ↓
12. Return 200 OK to SendGrid
```

### Upgrade Flow

```
1. User hits limit, receives upgrade email
   ↓
2. Clicks link to /pricing?email=user@example.com
   ↓
3. Selects plan, clicks "Upgrade Now"
   ↓
4. POST to /api/stripe/checkout
   ├─ Creates or retrieves Stripe customer
   ├─ Creates checkout session
   └─ Returns Stripe Checkout URL
   ↓
5. User redirected to Stripe Checkout
   ↓
6. User enters payment details
   ↓
7. Stripe processes payment
   ↓
8. Stripe sends checkout.session.completed webhook
   ↓
9. /api/stripe/webhook processes event
   ├─ Retrieves user from database
   ├─ Updates tier, cost_limit, subscription_status
   └─ Resets cost_used_usd to 0
   ↓
10. User redirected to /success
   ↓
11. User can now send emails with new limit
```

## Cost Calculation Logic

Located in `usageTracker.ts`:

```typescript
// Example calculation for GPT-4o-mini
const inputCost = (promptTokens / 1_000_000) * 0.15
const outputCost = (completionTokens / 1_000_000) * 0.60
const totalCost = inputCost + outputCost

// Stored with 6 decimal precision for accuracy
// e.g., 0.000123 USD = $0.000123
```

## Security Considerations

### Implemented
- ✅ Server-side API key storage only
- ✅ Supabase service role key never exposed to client
- ✅ Stripe webhook signature verification
- ✅ Input validation on all API routes
- ✅ HTTPS enforced on all endpoints
- ✅ No sensitive data in client-side code

### Recommended for Production
- [ ] Rate limiting on API routes
- [ ] Row Level Security (RLS) on Supabase tables
- [ ] Webhook signature verification for SendGrid
- [ ] CAPTCHA on signup/upgrade forms
- [ ] IP-based abuse detection
- [ ] Monitoring and alerting for suspicious activity

## Monitoring

### Key Metrics to Track

**Usage Metrics:**
- Total users by tier
- Daily active users
- Average cost per user
- Users near limit (>80% used)

**Revenue Metrics:**
- Monthly Recurring Revenue (MRR)
- Churn rate
- Upgrade rate (free → paid)
- Average Revenue Per User (ARPU)

**System Metrics:**
- API error rates
- Webhook failure rates
- Database query performance
- Email delivery rates

### Useful SQL Queries

See `TESTING_USAGE_TRACKING.md` for comprehensive queries.

Quick stats:

```sql
-- User distribution by tier
SELECT tier, COUNT(*) as count,
       SUM(cost_used_usd) as total_spent
FROM users
GROUP BY tier;

-- Revenue (estimated)
SELECT SUM(CASE
  WHEN tier = 'pro' THEN 20
  WHEN tier = 'max' THEN 100
  ELSE 0
END) as monthly_revenue
FROM users
WHERE subscription_status = 'active';

-- Users near limit
SELECT email, tier, cost_used_usd, cost_limit_usd,
       ROUND((cost_used_usd / cost_limit_usd * 100)::numeric, 2) as pct
FROM users
WHERE cost_used_usd > cost_limit_usd * 0.8
ORDER BY pct DESC;
```

## Testing

See `TESTING_USAGE_TRACKING.md` for complete testing guide.

**Quick test checklist:**
1. Send email from new address → verify user created
2. Send multiple emails → verify usage tracked
3. Manually set user near limit → verify limit email sent
4. Go through upgrade flow → verify subscription activated
5. Send email after upgrade → verify new limit applies
6. Cancel subscription in Stripe → verify downgrade to free

## Deployment Checklist

See `EXTERNAL_SETUP.md` for complete setup guide.

**Before launch:**
- [ ] Database migration applied
- [ ] All environment variables set
- [ ] Stripe products created (both test & live)
- [ ] Stripe webhooks configured
- [ ] SendGrid domain authenticated
- [ ] DNS records configured
- [ ] Test payment completed successfully
- [ ] All documentation reviewed
- [ ] Monitoring set up
- [ ] Legal pages reviewed

## Known Limitations & Future Improvements

### Current Limitations
- No usage analytics dashboard for admins
- No email notification for approaching limit (80%)
- No automatic retry for failed webhook events
- No referral or promo code system
- No annual billing option

### Future Improvements
- Admin dashboard for monitoring
- Usage reports via email
- Webhook event retry logic
- Promotional campaigns
- Team/organization accounts
- Usage-based pricing (pay-as-you-go)
- Multiple email addresses per account
- API access for developers
- White-label options for enterprises

## Support & Troubleshooting

### Common Issues

**Users not being created:**
- Check Supabase connection
- Verify service role key is set
- Check Edge Function logs

**Limit emails not sending:**
- Verify SendGrid configuration
- Check SERVICE_EMAIL_ADDRESS is verified
- Review email-webhook logs

**Stripe payments failing:**
- Ensure webhook endpoint is publicly accessible
- Verify webhook secret matches
- Check Stripe logs for detailed errors

**Usage not tracking correctly:**
- Verify OpenAI response includes usage field
- Check cost calculation logic
- Ensure database updates successful

### Getting Help

1. Check logs first (Supabase, Stripe, Vercel)
2. Review testing guide
3. Verify all environment variables
4. Check external setup guide
5. Contact support: support@llmbox.ai

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check webhook success rates
- Review new user signups

**Weekly:**
- Review usage patterns
- Check for abuse
- Update pricing if needed
- Review support tickets

**Monthly:**
- Analyze conversion rates
- Review churn metrics
- Update documentation
- Security audit
- Backup database

### Database Maintenance

```sql
-- Vacuum to reclaim space
VACUUM ANALYZE users;
VACUUM ANALYZE usage_logs;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Archive old usage logs (older than 1 year)
-- Consider moving to cold storage
DELETE FROM usage_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Credits

Built with:
- [Supabase](https://supabase.com) - Database + Edge Functions
- [Stripe](https://stripe.com) - Payment processing
- [SendGrid](https://sendgrid.com) - Email delivery
- [OpenAI](https://openai.com) - AI models
- [Next.js](https://nextjs.org) - Web framework
- [Vercel](https://vercel.com) - Hosting
- [TailwindCSS](https://tailwindcss.com) - Styling

## License

Proprietary - LLMBox © 2025

---

**Questions?** Read the full documentation:
- `EXTERNAL_SETUP.md` - Complete setup guide
- `TESTING_USAGE_TRACKING.md` - Comprehensive testing guide
- `architecture.md` - System architecture overview
- `prd.md` - Product requirements

Or contact: support@llmbox.ai

