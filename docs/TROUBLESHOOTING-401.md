# Troubleshooting: 401 Missing Authorization Header

## The Issue

When testing your Edge Function, you get:

```json
{"code":401,"message":"Missing authorization header"}
```

---

## Why This Happens

By default, Supabase Edge Functions require authentication (JWT verification). However, **webhooks from external services like SendGrid cannot provide Supabase authentication tokens**.

---

## The Solution

You need to configure the Edge Function to allow **public access** (no JWT verification).

### Step 1: Create `supabase/config.toml`

This file should already exist, but if not, create it:

```toml
# Supabase Configuration

[functions.email-webhook]
# Allow public access (no JWT verification required)
# Required for webhooks from external services like SendGrid
verify_jwt = false
```

### Step 2: Redeploy

After creating/updating the config file, redeploy:

```bash
deno task deploy
```

Or manually:

```bash
supabase functions deploy email-webhook --project-ref nopocimtfthppwssohty --no-verify-jwt
```

### Step 3: Test Again

```bash
deno task test:endpoint
```

**Expected response:** `400 Bad Request` or validation error (not 401!)

**Why 400 is good:** It means authentication passed, but the request is missing required fields (which is expected for an empty test).

---

## Verification

### Test 1: Simple POST (Should Not Get 401)

```bash
curl -i -X POST https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Expected:** `400 Bad Request` with validation error (NOT 401)

### Test 2: Full Webhook Simulation

```bash
deno task test:webhook
```

**Expected:** `200 OK` with `{"status":"success","messageId":"..."}`

---

## Security Implications

### ⚠️ Important: Is This Safe?

**Yes, for webhooks!** Here's why:

1. **Webhooks require public endpoints** - SendGrid can't authenticate with Supabase
2. **Your code validates input** - The `emailParser.ts` validates all webhook fields
3. **Rate limiting** - Will be added in Epic 2
4. **Webhook signature verification** - Will be added in Epic 2 (validates requests actually come from SendGrid)

### What About Security?

**Current Security (Epic 1):**
- ✅ Input validation (validates email fields)
- ✅ Error handling (prevents crashes)
- ❌ No rate limiting (Epic 2)
- ❌ No webhook signature verification (Epic 2)

**This is acceptable for MVP**, but you should:
1. Monitor usage in Supabase logs
2. Track costs (OpenAI usage)
3. Add rate limiting soon (Epic 2)
4. Add webhook signature verification (Epic 2)

---

## Alternative: Use Anon Key (NOT Recommended for Webhooks)

If you want to keep JWT verification enabled, you'd need to pass the anon key:

```bash
# Get your anon key from Supabase dashboard
export SUPABASE_ANON_KEY="your-anon-key"

curl -X POST https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: multipart/form-data' \
  -F 'from=test@example.com'
```

**❌ Don't do this!** SendGrid can't pass your anon key, so webhooks won't work.

---

## Verifying Config is Applied

### Check Deployment Logs

When you deploy, you should see:

```
Deploying function email-webhook...
Using config from supabase/config.toml
verify_jwt: false
Deployment successful!
```

### Check Function Response

**Before config (401):**
```bash
curl -i -X POST https://...
HTTP/2 401
{"code":401,"message":"Missing authorization header"}
```

**After config (400 or 200):**
```bash
curl -i -X POST https://...
HTTP/2 400
{"error":"Required field missing from webhook: from",...}
```

**✅ Success!** Authentication is now bypassed.

---

## Common Mistakes

### 1. Config file in wrong location

**Wrong:**
```
/config.toml
/supabase/functions/config.toml
/supabase/functions/email-webhook/config.toml
```

**Correct:**
```
/supabase/config.toml
```

### 2. Didn't redeploy after creating config

**Solution:** Always redeploy after config changes:
```bash
deno task deploy
```

### 3. Using `--no-verify-jwt` flag instead of config file

**Works but not permanent:**
```bash
supabase functions deploy email-webhook --no-verify-jwt
```

**Better - use config file:**
```toml
[functions.email-webhook]
verify_jwt = false
```

Then deploy normally:
```bash
deno task deploy
```

---

## Testing Checklist

After fixing the 401 issue:

- [ ] Created `supabase/config.toml` with `verify_jwt = false`
- [ ] Redeployed: `deno task deploy`
- [ ] Test endpoint: `deno task test:endpoint`
- [ ] Expected: **400 Bad Request** (NOT 401)
- [ ] Test webhook: `deno task test:webhook`
- [ ] Expected: **200 OK** with success response
- [ ] Check logs: `deno task logs`
- [ ] See webhook processing events

---

## Summary

**Problem:** 401 Missing authorization header
**Cause:** Edge Function requires JWT by default
**Solution:** Set `verify_jwt = false` in `supabase/config.toml`
**Security:** Safe for webhooks (SendGrid can't provide Supabase auth)
**Next Step:** Add webhook signature verification in Epic 2

**Quick fix:**

```bash
# 1. Config already created at supabase/config.toml
# 2. Redeploy
deno task deploy

# 3. Test
deno task test:webhook

# 4. Should now work! ✅
```

---

**Still getting 401?**
- Verify config file location: `supabase/config.toml`
- Redeploy: `deno task deploy`
- Check deployment logs for errors
- Verify you're testing the right project ref

