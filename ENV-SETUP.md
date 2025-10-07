# Environment Variables Setup Guide

This guide explains how to set up environment variables for integration tests.

---

## 🎯 Quick Setup (Choose One Method)

### Method 1: Shell Profile (Recommended for Permanent Setup)

Add to your shell profile so variables are always available:

```bash
# For Zsh (macOS default)
echo '
# llmbox Integration Test API Keys
export OPENAI_API_KEY="sk-your-actual-key-here"
export SENDGRID_API_KEY="SG.your-actual-key-here"
export SERVICE_EMAIL_ADDRESS="assistant@yourdomain.com"
export TEST_RECIPIENT_EMAIL="your-test-email@domain.com"
' >> ~/.zshrc

# Reload shell
source ~/.zshrc
```

**Then verify:**
```bash
echo $OPENAI_API_KEY    # Should show your key
deno task test:integration  # Should run tests
```

**Pros:** ✅ Always available, ✅ No extra steps before running tests
**Cons:** ⚠️ Shared across all terminal sessions

---

### Method 2: `.env` File (Recommended for Project-Specific)

Keep API keys in a project-specific `.env` file:

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Edit .env and add your actual API keys
nano .env
# or
code .env  # if using VS Code
```

**Your `.env` file should look like:**
```bash
OPENAI_API_KEY=sk-proj-abc123...
SENDGRID_API_KEY=SG.xyz789...
SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com
TEST_RECIPIENT_EMAIL=test@yourdomain.com
```

**Then run tests with environment loaded:**
```bash
# Option A: Use the helper script
./scripts/load-env.sh deno task test:integration

# Option B: Load manually each time
export $(cat .env | xargs) && deno task test:integration
```

**Pros:** ✅ Project-specific, ✅ Not in git, ✅ Easy to manage
**Cons:** ⚠️ Need to load before each test run

---

### Method 3: Inline (Quick One-Time Testing)

Set variables just for one command:

```bash
OPENAI_API_KEY="sk-..." \
SENDGRID_API_KEY="SG...." \
SERVICE_EMAIL_ADDRESS="assistant@domain.com" \
TEST_RECIPIENT_EMAIL="test@domain.com" \
deno task test:integration
```

**Pros:** ✅ Quick and temporary
**Cons:** ⚠️ Must retype for every test run

---

## 📋 Required Variables

| Variable | Required For | Where to Get It |
|----------|--------------|-----------------|
| `OPENAI_API_KEY` | OpenAI + E2E tests | https://platform.openai.com/api-keys |
| `SENDGRID_API_KEY` | SendGrid + E2E tests | https://app.sendgrid.com/settings/api_keys |
| `SERVICE_EMAIL_ADDRESS` | SendGrid + E2E tests | Your verified sender email in SendGrid |
| `TEST_RECIPIENT_EMAIL` | Optional | Where test emails should be sent (defaults to SERVICE_EMAIL_ADDRESS) |

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use `.env` files for project-specific keys
- ✅ Make sure `.env` is in `.gitignore` (already done)
- ✅ Use different API keys for testing vs production
- ✅ Rotate API keys periodically
- ✅ Use test-specific email addresses

### ❌ DON'T:
- ❌ Never commit API keys to git
- ❌ Never share API keys in screenshots or logs
- ❌ Don't use production keys for testing
- ❌ Don't commit `.env` file to version control

---

## 🧪 Verifying Setup

### Check if variables are set:
```bash
# Method 1: Check individual variables
echo $OPENAI_API_KEY
echo $SENDGRID_API_KEY
echo $SERVICE_EMAIL_ADDRESS

# Method 2: Use the helper script
./scripts/run-integration-tests.sh --check

# Method 3: Use the interactive menu
./scripts/run-integration-tests.sh
# Then select option 6: Check environment variables
```

### Test with dry run:
```bash
# This will show which tests would run
deno task test:integration
# If variables are set: tests run
# If variables are missing: tests skip gracefully
```

---

## 📝 Step-by-Step Setup

### For First-Time Users:

1. **Get your API keys:**
   - OpenAI: https://platform.openai.com/api-keys
   - SendGrid: https://app.sendgrid.com/settings/api_keys

2. **Choose your method** (`.env` recommended):
   ```bash
   cp .env.example .env
   nano .env  # Add your actual keys
   ```

3. **Verify setup:**
   ```bash
   ./scripts/run-integration-tests.sh --check
   ```

4. **Run tests:**
   ```bash
   # If using .env file:
   ./scripts/load-env.sh deno task test:integration

   # If using shell profile:
   deno task test:integration
   ```

---

## 🎯 Recommended Workflow

### For Daily Development:
```bash
# Use shell profile method so variables are always available
# Then just run:
deno task test:integration
```

### For CI/CD:
```bash
# Set secrets in your CI/CD platform
# GitHub Actions example:
# - Add secrets in repo Settings > Secrets > Actions
# - Reference in workflow:
#   env:
#     OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
#     SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
```

### For Team Members:
```bash
# Share .env.example (already in git)
# Each person creates their own .env with their keys
# .env is in .gitignore so it won't be committed
```

---

## 🔍 Troubleshooting

### "Tests are skipped"
**Problem:** Environment variables not set

**Solution:**
```bash
# Check if variables are set
./scripts/run-integration-tests.sh --check

# If not set, use one of the methods above
```

### "Using .env but tests still skip"
**Problem:** Variables not loaded

**Solution:**
```bash
# Make sure to use the load-env script:
./scripts/load-env.sh deno task test:integration

# Or load manually:
export $(cat .env | xargs) && deno task test:integration
```

### "Variables set but tests fail with 401"
**Problem:** Invalid or expired API keys

**Solution:**
```bash
# Verify your keys are correct
echo $OPENAI_API_KEY    # Check the value
echo $SENDGRID_API_KEY  # Check the value

# Try regenerating keys:
# - OpenAI: https://platform.openai.com/api-keys
# - SendGrid: https://app.sendgrid.com/settings/api_keys
```

---

## 📚 Additional Resources

- **Quick Start:** `tests/integration/QUICKSTART.md`
- **Full Documentation:** `tests/integration/README.md`
- **Deno Tasks:** `tests/integration/DENO-TASKS.md`
- **Helper Script:** `./scripts/run-integration-tests.sh --help`

---

## 💡 Pro Tips

1. **Use `.env` for development:**
   ```bash
   cp .env.example .env
   # Add your keys to .env
   ./scripts/load-env.sh deno task test:integration
   ```

2. **Create an alias for convenience:**
   ```bash
   # Add to ~/.zshrc:
   alias test:integration="./scripts/load-env.sh deno task test:integration"

   # Then just run:
   test:integration
   ```

3. **Use different keys for testing:**
   - Create separate API keys for development/testing
   - Label them clearly in your API provider dashboards
   - Makes it easier to rotate or revoke if needed

4. **Check costs regularly:**
   - Monitor API usage in provider dashboards
   - Set up billing alerts
   - Remember: integration tests make real API calls

---

## ✅ Quick Reference

| Method | Command | When to Use |
|--------|---------|-------------|
| **Shell Profile** | `source ~/.zshrc && deno task test:integration` | Permanent setup, daily use |
| **`.env` File** | `./scripts/load-env.sh deno task test:integration` | Project-specific, team work |
| **Inline** | `OPENAI_API_KEY=... deno task test:integration` | One-time testing |
| **Interactive** | `./scripts/run-integration-tests.sh` | First-time users, checking config |

---

**Need help?** See `tests/integration/README.md` for detailed troubleshooting.

