# Testing Usage Tracking & Billing System

This guide explains how to test the complete usage tracking, limits, and Stripe billing integration for LLMBox.

## Prerequisites

Before testing, ensure you have:

1. ✅ Database migration applied
2. ✅ All environment variables set (see EXTERNAL_SETUP.md)
3. ✅ Supabase project running
4. ✅ Stripe account configured (test mode)
5. ✅ SendGrid configured
6. ✅ OpenAI API key set
7. ✅ Web app running locally or deployed

## Test Environment Setup

### 1. Database Verification

First, verify the database schema is correct:

```bash
# Connect to your Supabase database
supabase db reset  # Only if needed - this will clear all data!

# Or apply migration manually
psql $DATABASE_URL -f supabase/migrations/20241008000000_initial_schema.sql

# Verify tables exist
psql $DATABASE_URL -c "\dt"
```

You should see:
- `users`
- `usage_logs`
- `pricing_tiers`

Verify pricing tiers are seeded:

```bash
psql $DATABASE_URL -c "SELECT tier_name, cost_limit_usd, price_cents FROM pricing_tiers ORDER BY sort_order;"
```

Expected output:
```
 tier_name | cost_limit_usd | price_cents
-----------+----------------+-------------
 free      |           1.00 |           0
 basic     |          10.00 |         900
 pro       |          50.00 |        2900
 enterprise|      999999.00 |        9900
```

### 2. Deploy Edge Functions

Deploy the updated email webhook:

```bash
# Deploy email webhook with database support
supabase functions deploy email-webhook --project-ref YOUR_PROJECT_REF

# Verify deployment
supabase functions list
```

### 3. Start Web App Locally

```bash
cd web
npm install
npm run dev
```

Web app should be running at `http://localhost:3000`

## Test Scenarios

### Test 1: New User Free Tier (Happy Path)

**Objective:** Verify new users can use the service up to $1 limit.

**Steps:**

1. Send an email to your service address from a NEW email address:
   ```
   To: chat@llmbox.ai  (or your configured address)
   From: test-user-1@example.com
   Subject: Test message
   Body: Hello, please write me a short poem.
   ```

2. Check Supabase logs:
   ```bash
   supabase functions logs email-webhook --project-ref YOUR_PROJECT_REF
   ```

3. Verify in logs:
   - ✅ User created automatically
   - ✅ Usage tracked with cost calculation
   - ✅ Email response sent

4. Check database:
   ```bash
   psql $DATABASE_URL -c "SELECT email, tier, cost_used_usd, cost_limit_usd FROM users WHERE email = 'test-user-1@example.com';"
   ```

   Expected:
   ```
   email                    | tier | cost_used_usd | cost_limit_usd
   -------------------------+------+---------------+----------------
   test-user-1@example.com  | free |      0.00XXX  |           1.00
   ```

5. Verify usage log:
   ```bash
   psql $DATABASE_URL -c "SELECT email, model, total_tokens, cost_usd FROM usage_logs WHERE email = 'test-user-1@example.com' ORDER BY created_at DESC LIMIT 1;"
   ```

**Expected Result:**
- User receives AI response
- Usage tracked in database
- Cost deducted from limit

---

### Test 2: Free Tier Limit Exceeded

**Objective:** Verify users hitting $1 limit receive upgrade email.

**Steps:**

1. Manually update a test user to be near the limit:
   ```bash
   psql $DATABASE_URL -c "UPDATE users SET cost_used_usd = 0.99 WHERE email = 'test-user-1@example.com';"
   ```

2. Send another email from the same address:
   ```
   To: chat@llmbox.ai
   From: test-user-1@example.com
   Subject: Another test
   Body: Can you help me with something?
   ```

3. Send one more email (this should trigger the limit):
   ```
   To: chat@llmbox.ai
   From: test-user-1@example.com
   Subject: One more test
   Body: Tell me a joke.
   ```

4. Check inbox for `test-user-1@example.com`:
   - ✅ Should receive limit exceeded email
   - ✅ Email should have link to `/pricing?email=test-user-1@example.com`
   - ✅ Should NOT receive AI response

5. Verify in logs:
   ```bash
   supabase functions logs email-webhook --project-ref YOUR_PROJECT_REF | grep "user_limit_exceeded"
   ```

**Expected Result:**
- Limit exceeded email sent
- No AI response generated
- User guided to upgrade page

---

### Test 3: Stripe Checkout Flow (Upgrade)

**Objective:** Test upgrading from free to paid plan.

**Steps:**

1. Open web app pricing page:
   ```
   http://localhost:3000/pricing?email=test-user-1@example.com
   ```

2. Click "Upgrade Now" on Basic plan ($9/month)

3. Fill in Stripe test card:
   ```
   Card: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/25)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)
   ```

4. Complete checkout

5. Verify redirect to success page:
   ```
   http://localhost:3000/success?session_id=cs_test_...
   ```

6. Check database:
   ```bash
   psql $DATABASE_URL -c "SELECT email, tier, cost_limit_usd, cost_used_usd, subscription_status FROM users WHERE email = 'test-user-1@example.com';"
   ```

   Expected:
   ```
   email                    | tier  | cost_limit_usd | cost_used_usd | subscription_status
   -------------------------+-------+----------------+---------------+--------------------
   test-user-1@example.com  | basic |          10.00 |          0.00 | active
   ```

7. Check Stripe Dashboard:
   - ✅ Customer created
   - ✅ Subscription active
   - ✅ Webhook events processed

**Expected Result:**
- User upgraded to Basic tier
- Cost usage reset to $0
- Cost limit increased to $10
- Subscription status active

---

### Test 4: Usage After Upgrade

**Objective:** Verify paid users can use the service with new limits.

**Steps:**

1. Send email from upgraded user:
   ```
   To: chat@llmbox.ai
   From: test-user-1@example.com
   Subject: Test after upgrade
   Body: Write me a longer story about AI.
   ```

2. Verify response received

3. Check usage:
   ```bash
   psql $DATABASE_URL -c "SELECT email, cost_used_usd, cost_limit_usd FROM users WHERE email = 'test-user-1@example.com';"
   ```

4. Check usage logs:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*), SUM(cost_usd) FROM usage_logs WHERE email = 'test-user-1@example.com';"
   ```

**Expected Result:**
- User receives AI response
- Usage tracked correctly
- Still well under $10 limit

---

### Test 5: Inactive Subscription

**Objective:** Test behavior when subscription is canceled or past_due.

**Steps:**

1. Cancel subscription in Stripe Dashboard or update status manually:
   ```bash
   psql $DATABASE_URL -c "UPDATE users SET subscription_status = 'canceled' WHERE email = 'test-user-1@example.com';"
   ```

2. Send email from that user:
   ```
   To: chat@llmbox.ai
   From: test-user-1@example.com
   Subject: Test with canceled subscription
   Body: Hello?
   ```

3. Check inbox:
   - ✅ Should receive "subscription inactive" email
   - ✅ Should NOT receive AI response

4. Verify in logs:
   ```bash
   supabase functions logs email-webhook | grep "subscription_inactive"
   ```

**Expected Result:**
- Subscription inactive email sent
- User prompted to reactivate or update billing

---

### Test 6: Stripe Webhooks

**Objective:** Verify webhook handling for subscription lifecycle events.

**Steps:**

1. Use Stripe CLI to forward webhooks to localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. Trigger test events:
   ```bash
   # Test checkout completion
   stripe trigger checkout.session.completed

   # Test subscription update
   stripe trigger customer.subscription.updated

   # Test subscription deletion
   stripe trigger customer.subscription.deleted

   # Test invoice payment
   stripe trigger invoice.payment_succeeded
   ```

3. Check webhook logs in terminal

4. Verify database updates after each event

**Expected Result:**
- All webhook events processed correctly
- Database updated appropriately
- No errors in logs

---

### Test 7: Billing Dashboard

**Objective:** Test billing page shows correct usage stats.

**Steps:**

1. Navigate to billing page:
   ```
   http://localhost:3000/billing?email=test-user-1@example.com
   ```

2. Verify displayed information:
   - ✅ Current tier shown correctly
   - ✅ Usage bar shows correct percentage
   - ✅ Cost used and remaining shown
   - ✅ Billing period dates shown (for paid users)
   - ✅ Subscription status shown

3. Click "Manage Subscription in Stripe"
   - ✅ Redirects to Stripe Customer Portal
   - ✅ Can view/update payment methods
   - ✅ Can cancel subscription

**Expected Result:**
- Billing page loads successfully
- All stats accurate
- Stripe portal accessible

---

### Test 8: Multiple Users Concurrency

**Objective:** Verify system handles multiple users correctly.

**Steps:**

1. Send emails from 5 different email addresses simultaneously

2. Verify each user:
   ```bash
   psql $DATABASE_URL -c "SELECT email, tier, cost_used_usd FROM users ORDER BY created_at DESC LIMIT 5;"
   ```

3. Check all users have separate tracking

**Expected Result:**
- All users tracked independently
- No data mixing between users
- All receive responses

---

## Monitoring and Debugging

### View Logs

```bash
# Real-time email webhook logs
supabase functions logs email-webhook --project-ref YOUR_PROJECT_REF -f

# Web app logs (if deployed to Vercel)
vercel logs

# Database queries
psql $DATABASE_URL
```

### Useful SQL Queries

```sql
-- View all users and their usage
SELECT email, tier, cost_used_usd, cost_limit_usd,
       ROUND((cost_used_usd / cost_limit_usd * 100)::numeric, 2) as usage_percent
FROM users
ORDER BY created_at DESC;

-- View recent usage logs
SELECT email, model, total_tokens, cost_usd, created_at
FROM usage_logs
ORDER BY created_at DESC
LIMIT 20;

-- View users near their limit
SELECT email, tier, cost_used_usd, cost_limit_usd
FROM users
WHERE cost_used_usd > cost_limit_usd * 0.8
ORDER BY cost_used_usd DESC;

-- View total revenue (approximate based on tiers)
SELECT tier, COUNT(*) as user_count,
       SUM(CASE
         WHEN tier = 'basic' THEN 9
         WHEN tier = 'pro' THEN 29
         WHEN tier = 'enterprise' THEN 99
         ELSE 0
       END) as monthly_revenue
FROM users
WHERE subscription_status = 'active'
GROUP BY tier;
```

### Check for Errors

```bash
# Search for errors in logs
supabase functions logs email-webhook --project-ref YOUR_PROJECT_REF | grep -i "error"

# Check webhook failures in Stripe Dashboard
# Go to: Developers > Webhooks > [your endpoint] > Recent events
```

## Test Checklist

Before considering the system production-ready:

- [ ] New users can sign up automatically via email
- [ ] Free tier ($1) enforced correctly
- [ ] Limit exceeded email sent when appropriate
- [ ] Stripe checkout flow works end-to-end
- [ ] Users can upgrade successfully
- [ ] Paid users can use service with new limits
- [ ] Inactive subscriptions handled correctly
- [ ] All Stripe webhooks process successfully
- [ ] Billing dashboard shows accurate data
- [ ] Stripe Customer Portal accessible
- [ ] Multiple users tracked independently
- [ ] Usage logs accurate for billing
- [ ] Error emails sent appropriately
- [ ] No sensitive data leaked in logs
- [ ] Terms & Privacy policy accessible

## Production Considerations

Before going to production:

1. **Switch Stripe to Live Mode**
   - Update all `STRIPE_*` environment variables
   - Configure live webhook endpoint
   - Test with real payment (small amount)

2. **Set Up Monitoring**
   - Configure alerts for failed webhooks
   - Monitor database size/performance
   - Set up error tracking (e.g., Sentry)

3. **Security**
   - Enable Stripe webhook signature verification
   - Add rate limiting for API routes
   - Review RLS policies on database

4. **Backup Strategy**
   - Configure automated database backups
   - Test restore procedures

5. **Legal**
   - Review Terms & Privacy policy with legal counsel
   - Add cookie consent if needed (GDPR)
   - Configure data retention policies

## Troubleshooting

### Issue: User not created in database

**Solution:**
- Check Supabase connection
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check Edge Function logs for errors

### Issue: Stripe webhook not working

**Solution:**
- Verify webhook endpoint URL in Stripe Dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches
- Test with Stripe CLI: `stripe listen --forward-to your-url/api/stripe/webhook`

### Issue: Usage not tracked correctly

**Solution:**
- Check OpenAI response includes `usage` field
- Verify token cost calculation in `usageTracker.ts`
- Ensure database connection successful

### Issue: Limit email not sent

**Solution:**
- Check SendGrid is configured
- Verify `SERVICE_EMAIL_ADDRESS` is set
- Check email-webhook logs for sending errors

## Support

If you encounter issues:

1. Check logs first (Supabase, Stripe, Vercel)
2. Verify all environment variables are set
3. Test in Stripe test mode before live mode
4. Review this testing guide again
5. Check database state manually with SQL queries

For questions, contact: support@llmbox.ai

