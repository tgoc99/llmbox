# Project Scripts Reference

This document describes all available Deno tasks (scripts) for the llmbox project.

---

## Quick Reference

Run any task with:
```bash
deno task <task-name>
```

**Example:**
```bash
deno task deploy
deno task test
deno task logs:tail
```

---

## 🚀 Deployment Tasks

### `deno task deploy`
Deploy the Edge Function to Supabase production.

**Usage:**
```bash
deno task deploy
```

**What it does:**
- Deploys `email-webhook` function to Supabase
- Uses project ref: `nopocimtfthppwssohty`
- Requires Supabase CLI authentication

**When to use:**
- After making code changes
- After fixing bugs
- After adding new features

**Prerequisites:**
- Supabase CLI installed: `brew install supabase/tap/supabase`
- Authenticated: `supabase login`

---

### `deno task logs`
View Edge Function logs from Supabase.

**Usage:**
```bash
deno task logs
```

**What it does:**
- Fetches recent logs from `email-webhook` function
- Shows structured JSON log entries
- Useful for debugging

---

### `deno task logs:tail`
Live tail Edge Function logs (updates in real-time).

**Usage:**
```bash
deno task logs:tail
```

**What it does:**
- Continuously streams logs as they happen
- Press `Ctrl+C` to stop
- Great for monitoring during testing

**Example output:**
```json
{"level":"INFO","event":"webhook_received","timestamp":"2025-10-07T..."}
{"level":"INFO","event":"email_parsed","context":{"from":"user@example.com"}}
{"level":"INFO","event":"openai_response_received","context":{"tokenCount":150}}
{"level":"INFO","event":"email_sent","context":{"recipient":"user@example.com"}}
```

---

## 🧪 Testing Tasks

### `deno task test`
Run all tests (unit + integration).

**Usage:**
```bash
deno task test
```

**What it does:**
- Runs all test files in `tests/` directory
- Includes unit and integration tests
- Shows pass/fail summary

**Note:** Integration tests require API keys and will be skipped if credentials are not set.

**Example output:**
```
running 15 tests from ./tests/unit/
test emailParser extracts fields correctly ... ok (5ms)
test llmClient generates response ... ok (120ms)
...
test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

---

### `deno task test:unit`
Run only unit tests.

**Usage:**
```bash
deno task test:unit
```

**What it does:**
- Runs tests in `tests/unit/` directory
- Tests individual modules in isolation
- Fast execution (no external API calls)

**When to use:**
- During development
- Before committing code
- When you don't have API keys configured

---

### `deno task test:integration`
Run only integration tests.

**Usage:**
```bash
deno task test:integration
```

**What it does:**
- Runs tests in `tests/integration/` directory
- Makes **real API calls** to OpenAI and SendGrid
- Sends **real test emails** to verify delivery
- Tests complete end-to-end workflows
- Includes 27 comprehensive tests

**Prerequisites:**
```bash
# Required environment variables
export OPENAI_API_KEY="sk-your-key"
export SENDGRID_API_KEY="SG.your-key"
export SERVICE_EMAIL_ADDRESS="assistant@yourdomain.com"

# Optional - for receiving test emails
export TEST_RECIPIENT_EMAIL="test@yourdomain.com"
```

**Test Suites:**
1. **OpenAI Tests** (12 tests, ~20-30s)
   - Basic response generation
   - Technical support queries
   - Business inquiries
   - Complaint handling
   - Special characters
   - Performance benchmarks

2. **SendGrid Tests** (8 tests, ~15-25s)
   - Email sending and delivery
   - Email threading (In-Reply-To, References)
   - Long emails and special characters
   - Batch sending
   - Performance timing

3. **End-to-End Tests** (7 tests, ~30-50s)
   - Complete email workflows
   - Thread continuations
   - Different email types
   - Performance metrics

**When to use:**
- Before deploying to production
- To verify API keys work correctly
- After changing API integration code
- Before major releases

**⚠️ Important Notes:**
- These tests consume API credits (costs money)
- Test emails will be sent to TEST_RECIPIENT_EMAIL
- Check your inbox to verify email delivery
- Tests will be skipped if credentials are missing

**Alternative: Use the helper script**
```bash
# Interactive menu
./scripts/run-integration-tests.sh

# Or use command-line options
./scripts/run-integration-tests.sh --all      # All tests
./scripts/run-integration-tests.sh --openai   # OpenAI only
./scripts/run-integration-tests.sh --sendgrid # SendGrid only
./scripts/run-integration-tests.sh --e2e      # End-to-end only
./scripts/run-integration-tests.sh --config   # Show config
```

**Quick Start:**
See [tests/integration/QUICKSTART.md](../tests/integration/QUICKSTART.md) for a quick setup guide.

**Full Documentation:**
See [tests/integration/README.md](../tests/integration/README.md) for detailed documentation.

---

### `deno task test:watch`
Run tests in watch mode (re-runs on file changes).

**Usage:**
```bash
deno task test:watch
```

**What it does:**
- Watches for file changes
- Automatically re-runs tests when files change
- Great for TDD (Test-Driven Development)

**When to use:**
- During active development
- When writing new tests
- When refactoring code

---

### `deno task test:coverage`
Run tests with code coverage report.

**Usage:**
```bash
deno task test:coverage
```

**What it does:**
- Runs all tests
- Generates coverage report in `coverage/` directory
- Shows which lines are tested

**View coverage report:**
```bash
deno coverage coverage --html
open coverage/html/index.html
```

---

### `deno task test:endpoint`
Quick test to verify Edge Function is live.

**Usage:**
```bash
deno task test:endpoint
```

**What it does:**
- Makes GET request to Edge Function
- Expected response: `405 Method Not Allowed`
- Confirms function is deployed and responding

**Expected output:**
```json
{"error": "Method not allowed"}
```

**✅ If you see 405, the function is working!**

---

### `deno task test:webhook`
Test webhook with simulated SendGrid payload.

**Usage:**
```bash
deno task test:webhook
```

**What it does:**
- Sends POST request with form data
- Simulates SendGrid Inbound Parse webhook
- Tests full email processing flow

**Expected output:**
```json
{
  "status": "success",
  "messageId": "<test123@example.com>"
}
```

**What to check after:**
1. Check Supabase logs: `deno task logs`
2. Check your email inbox for AI response

---

## 🔧 Code Quality Tasks

### `deno task lint`
Lint code for issues.

**Usage:**
```bash
deno task lint
```

**What it does:**
- Checks code for common issues
- Enforces coding standards
- Reports warnings and errors

**Example issues detected:**
- Unused variables
- Missing return types
- console.log usage (should use logger)

---

### `deno task lint:fix`
Lint code and auto-fix issues.

**Usage:**
```bash
deno task lint:fix
```

**What it does:**
- Same as `deno task lint`
- Automatically fixes fixable issues
- Reports remaining issues

---

### `deno task fmt`
Format all code files.

**Usage:**
```bash
deno task fmt
```

**What it does:**
- Formats all `.ts` files
- Applies consistent style (100 char line width, single quotes)
- Modifies files in place

**When to use:**
- Before committing code
- After making changes
- To ensure consistent formatting

---

### `deno task fmt:check`
Check if code is properly formatted (doesn't modify files).

**Usage:**
```bash
deno task fmt:check
```

**What it does:**
- Checks if code matches formatting rules
- Doesn't modify files
- Exits with error if formatting issues found

**When to use:**
- In CI/CD pipelines
- Before committing
- To verify code is formatted

---

### `deno task check`
Type-check the Edge Function code.

**Usage:**
```bash
deno task check
```

**What it does:**
- Checks TypeScript types
- Verifies imports
- Reports type errors

**Example errors detected:**
- Type mismatches
- Missing return types
- Import errors

---

### `deno task check:all`
Run all quality checks + tests.

**Usage:**
```bash
deno task check:all
```

**What it does:**
1. Lints code (`deno task lint`)
2. Checks formatting (`deno task fmt:check`)
3. Type checks (`deno task check`)
4. Runs all tests (`deno task test`)

**When to use:**
- Before committing code
- Before deploying
- In CI/CD pipeline
- To verify everything works

**This is your "pre-commit" check!**

---

## 🔐 Secrets Management Tasks

### `deno task secrets:list`
List all configured secrets in Supabase.

**Usage:**
```bash
deno task secrets:list
```

**What it does:**
- Shows all secret names (not values!)
- Useful for verifying secrets are set

**Example output:**
```
SENDGRID_API_KEY
OPENAI_API_KEY
SERVICE_EMAIL_ADDRESS
OPENAI_MODEL
```

---

### `deno task secrets:set:key`
Set a secret in Supabase.

**Usage:**
```bash
deno task secrets:set:key KEY_NAME=value
```

**Examples:**

Set SendGrid API key:
```bash
deno task secrets:set:key SENDGRID_API_KEY=SG.your-key-here
```

Set OpenAI API key:
```bash
deno task secrets:set:key OPENAI_API_KEY=sk-proj-your-key-here
```

Set service email:
```bash
deno task secrets:set:key SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com
```

Set OpenAI model:
```bash
deno task secrets:set:key OPENAI_MODEL=gpt-3.5-turbo
```

**Set multiple secrets:**
```bash
deno task secrets:set:key SENDGRID_API_KEY=SG.xxx
deno task secrets:set:key OPENAI_API_KEY=sk-xxx
deno task secrets:set:key SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com
deno task secrets:set:key OPENAI_MODEL=gpt-3.5-turbo
```

**Verify secrets were set:**
```bash
deno task secrets:list
```

---

## ℹ️ Help Task

### `deno task help`
Display help message with all available tasks.

**Usage:**
```bash
deno task help
```

**What it does:**
- Shows categorized list of all tasks
- Includes brief description of each task
- Quick reference guide

---

## 📋 Common Workflows

### First-Time Setup

```bash
# 1. Install Supabase CLI
brew install supabase/tap/supabase

# 2. Login to Supabase
supabase login

# 3. Set secrets
deno task secrets:set:key SENDGRID_API_KEY=SG.your-key
deno task secrets:set:key OPENAI_API_KEY=sk-your-key
deno task secrets:set:key SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com
deno task secrets:set:key OPENAI_MODEL=gpt-3.5-turbo

# 4. Verify secrets
deno task secrets:list

# 5. Deploy
deno task deploy

# 6. Test
deno task test:endpoint
deno task test:webhook

# 7. Monitor logs
deno task logs:tail
```

---

### Daily Development Workflow

```bash
# 1. Make code changes
# ... edit files ...

# 2. Run tests in watch mode
deno task test:watch

# 3. Format code
deno task fmt

# 4. Run all checks
deno task check:all

# 5. Deploy if all checks pass
deno task deploy

# 6. Monitor logs
deno task logs:tail
```

---

### Before Committing Code

```bash
# Run all quality checks
deno task check:all
```

**This will:**
- ✅ Lint code
- ✅ Check formatting
- ✅ Type check
- ✅ Run all tests

**Only commit if all checks pass!**

---

### Debugging Production Issues

```bash
# 1. Tail logs in real-time
deno task logs:tail

# 2. In another terminal, test endpoint
deno task test:webhook

# 3. Watch logs for errors
# Look for ERROR or CRITICAL level events

# 4. If you find the issue, fix it and redeploy
deno task deploy

# 5. Verify fix
deno task test:webhook
```

---

### Testing Before Deployment

```bash
# 1. Run all quality checks
deno task check:all

# 2. Test endpoint is live
deno task test:endpoint

# 3. Test with simulated webhook
deno task test:webhook

# 4. Check logs for errors
deno task logs

# 5. If all good, deploy
deno task deploy
```

---

## 🚨 Troubleshooting

### "Supabase CLI not found"

**Problem:**
```
error: Failed to spawn supabase
```

**Solution:**
```bash
brew install supabase/tap/supabase
supabase login
```

---

### "Not authenticated with Supabase"

**Problem:**
```
error: Not logged in
```

**Solution:**
```bash
supabase login
```

**Follow the browser authentication flow.**

---

### "Tests failing with API errors"

**Problem:**
```
error: OpenAI API error: 401 Unauthorized
```

**Solution for integration tests:**
```bash
# Set environment variables for testing
export OPENAI_API_KEY=sk-your-key
export SENDGRID_API_KEY=SG.your-key

# Then run tests
deno task test:integration
```

**Note:** Unit tests don't require API keys (they use mocks).

---

### "Deploy fails"

**Problem:**
```
error: Failed to deploy function
```

**Solutions:**

1. **Check authentication:**
   ```bash
   supabase login
   ```

2. **Verify project ref:**
   - Should be `nopocimtfthppwssohty`
   - Check `deno.json` for correct project ref

3. **Check function code:**
   ```bash
   deno task check
   ```

4. **Try manual deploy:**
   ```bash
   supabase functions deploy email-webhook --project-ref nopocimtfthppwssohty
   ```

---

## 📖 Additional Resources

- **Deno Tasks Documentation:** https://deno.land/manual/tools/task_runner
- **Supabase CLI Documentation:** https://supabase.com/docs/reference/cli
- **Deployment Guide:** [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
- **Project README:** [../README.md](../README.md)

---

## Quick Command Cheat Sheet

```bash
# Deployment
deno task deploy          # Deploy to Supabase
deno task logs            # View logs
deno task logs:tail       # Live tail logs

# Testing
deno task test            # All tests
deno task test:unit       # Unit tests only
deno task test:integration # Integration tests only
deno task test:endpoint   # Quick endpoint test
deno task test:webhook    # Test with sample data

# Code Quality
deno task fmt             # Format code
deno task lint            # Lint code
deno task check           # Type check
deno task check:all       # All checks + tests

# Secrets
deno task secrets:list    # List secrets
deno task secrets:set:key KEY=value # Set secret

# Help
deno task help            # Show available tasks
```

---

**Need more help?** Run `deno task help` for a quick overview!

