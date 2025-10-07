# Quick Start - Deploy in 5 Minutes

The fastest way to deploy your email-to-LLM service using Deno tasks.

---

## Prerequisites

- ✅ Code is complete (already done!)
- ✅ SendGrid API key
- ✅ OpenAI API key
- ✅ Supabase CLI installed: `brew install supabase/tap/supabase`
- ✅ Authenticated with Supabase: `supabase login`

**Don't have API keys yet?** See [docs/WHAT-YOU-NEED-TO-DO.md](docs/WHAT-YOU-NEED-TO-DO.md)

---

## 5-Minute Deployment

### Step 1: Set Secrets (2 minutes)

```bash
# Set all required secrets at once
deno task secrets:set:key SENDGRID_API_KEY=SG.your-sendgrid-key-here
deno task secrets:set:key OPENAI_API_KEY=sk-proj-your-openai-key-here
deno task secrets:set:key SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com
deno task secrets:set:key OPENAI_MODEL=gpt-3.5-turbo
```

**Verify they're set:**
```bash
deno task secrets:list
```

**Expected output:**
```
SENDGRID_API_KEY
OPENAI_API_KEY
SERVICE_EMAIL_ADDRESS
OPENAI_MODEL
```

---

### Step 2: Deploy (1 minute)

```bash
deno task deploy
```

**Expected output:**
```
Deploying function email-webhook...
Function deployed successfully!
Function URL: https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

**Note:** The `supabase/config.toml` file configures the function to allow public access (`verify_jwt = false`), which is required for SendGrid webhooks to work.

---

### Step 3: Test (2 minutes)

**Test 1: Health check**
```bash
deno task test:endpoint
```

**Expected:** `405 Method Not Allowed` ✅ (This is correct!)

**Test 2: Webhook simulation**
```bash
deno task test:webhook
```

**Expected:** `{"status":"success","messageId":"..."}`

**Test 3: Check logs**
```bash
deno task logs
```

**Look for these events:**
- `webhook_received`
- `email_parsed`
- `openai_response_received`
- `email_sent`

**If you see these, it's working!** 🎉

---

### Step 4: Monitor (Optional)

**Live tail logs:**
```bash
deno task logs:tail
```

**Keep this running while testing.**

---

## Real Email Test (After DNS Setup)

**Prerequisite:** MX record configured and propagated (24-48 hours)

**Send test email:**
1. Email to: `test@email.yourdomain.com`
2. Subject: "Hello Assistant"
3. Body: "Can you help me?"
4. Wait 30 seconds
5. Check inbox for AI response

**While waiting, monitor logs:**
```bash
deno task logs:tail
```

---

## Common Commands

```bash
# Deploy
deno task deploy              # Deploy function
deno task logs                # View logs
deno task logs:tail           # Live tail logs

# Test
deno task test                # Run all tests
deno task test:endpoint       # Quick health check
deno task test:webhook        # Test with sample data

# Secrets
deno task secrets:list        # List secrets
deno task secrets:set:key KEY=value  # Set secret

# Before Commit
deno task check:all           # All checks + tests
```

---

## Troubleshooting

### "Supabase CLI not found"
```bash
brew install supabase/tap/supabase
supabase login
```

### "Not authenticated"
```bash
supabase login
```

### "Test fails with API error"
- Verify secrets are set: `deno task secrets:list`
- Check API keys are valid
- Check OpenAI billing is set up

### "No email response"
- Wait for DNS propagation (24-48 hours)
- Verify sender is verified in SendGrid
- Check logs: `deno task logs`

---

## Next Steps

1. ✅ **Monitor first emails** - Check logs for any errors
2. ✅ **Track costs** - OpenAI dashboard for usage
3. ✅ **Test error scenarios** - Invalid emails, rate limits
4. ✅ **Review performance** - Should be < 30 seconds per email

**Full documentation:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## Complete Scripts Reference

**See:** [docs/SCRIPTS.md](docs/SCRIPTS.md) for all available commands.

---

**That's it!** Your email-to-LLM service is deployed. 🚀

