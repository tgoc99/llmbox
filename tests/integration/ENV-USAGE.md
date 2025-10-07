# Using .env File with Integration Tests

## ✅ Your Setup is Complete!

The integration tests are now configured to **automatically load your `.env` file**. You don't need to do anything extra!

---

## 🚀 Just Run the Tests

Simply run:

```bash
deno task test:integration
```

That's it! The `.env` file is loaded automatically.

---

## 📋 What Happens Behind the Scenes

When you run `deno task test:integration`, it:

1. ✅ Automatically runs `./scripts/load-env.sh`
2. ✅ Loads all variables from your `.env` file
3. ✅ Shows you which variables are loaded (with masked keys)
4. ✅ Runs the integration tests with those variables

**Example output:**
```
✅ Environment variables loaded from .env
   - OPENAI_API_KEY: sk-proj-...I8QA
   - SENDGRID_API_KEY: SG.SeVdY...y6ds
   - SERVICE_EMAIL_ADDRESS: mail@llmbox.pro

Check file:///Users/.../tests/integration/openai.test.ts
running 11 tests from ./tests/integration/openai.test.ts
OpenAI integration - generates response with real API ... ok (1s)
...
```

---

## 🎯 All Integration Test Commands

All of these **automatically load your `.env` file**:

```bash
# Run all integration tests
deno task test:integration

# Run specific test suites
deno task test:integration:openai       # OpenAI only
deno task test:integration:sendgrid     # SendGrid only
deno task test:integration:e2e          # End-to-end only

# Interactive menu
deno task test:integration:menu
```

---

## 📝 Your `.env` File Structure

Your `.env` file should contain:

```bash
# Required for OpenAI and E2E tests
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Required for SendGrid and E2E tests
SENDGRID_API_KEY=SG.your-actual-key-here
SERVICE_EMAIL_ADDRESS=mail@llmbox.pro

# Optional - where test emails will be sent
TEST_RECIPIENT_EMAIL=your-test-email@domain.com

# Optional configuration (uncomment to customize)
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_MAX_TOKENS=1000
# OPENAI_TEMPERATURE=0.7
# OPENAI_TIMEOUT_MS=30000
# SENDGRID_TIMEOUT_MS=10000
```

---

## ✏️ Editing Your `.env` File

```bash
# Open in nano
nano .env

# Or VS Code
code .env

# Or any editor
vim .env
```

After editing, just run the tests again - changes take effect immediately.

---

## 🔍 Verify Your Setup

Check which variables are loaded:

```bash
# Option 1: Run any integration test and check the output
deno task test:integration:openai
# First few lines will show loaded variables

# Option 2: Use the interactive menu
./scripts/run-integration-tests.sh
# Select option 6: Check environment variables

# Option 3: Check directly
cat .env
```

---

## ⚠️ If Variables Are Missing

If the script detects missing variables, you'll see:

```
⚠️  Some environment variables are missing in .env
   Variables set: 1/3 required
   Edit .env to add missing API keys
```

**Solution:** Edit your `.env` file and add the missing keys.

---

## 🔒 Security Reminders

✅ **Your `.env` file is safe:**
- ✅ Already in `.gitignore` (won't be committed to git)
- ✅ API keys are masked in output (only first 8 and last 4 chars shown)
- ✅ Never shared in logs or screenshots

❌ **Don't:**
- ❌ Commit `.env` to version control
- ❌ Share your `.env` file with others
- ❌ Use production keys for testing

---

## 💡 Pro Tips

### 1. Quick verification
```bash
# See what's loaded without running all tests
deno task test:integration:openai 2>&1 | head -10
```

### 2. Test one suite at a time
```bash
# Faster than running all tests
deno task test:integration:openai     # ~20-30 seconds
deno task test:integration:sendgrid   # ~15-25 seconds
deno task test:integration:e2e        # ~30-50 seconds
```

### 3. Check before major changes
```bash
# Run before deploying
deno task test:integration
```

### 4. Use test recipient email
```bash
# Add to .env to receive test emails at a different address
TEST_RECIPIENT_EMAIL=your-personal-email@gmail.com
```

---

## 🎯 Common Scenarios

### Scenario 1: First time running tests
```bash
# Just run - .env is already loaded automatically
deno task test:integration
```

### Scenario 2: Changed API keys
```bash
# 1. Edit .env
nano .env

# 2. Run tests - new keys are loaded automatically
deno task test:integration
```

### Scenario 3: Want to test specific functionality
```bash
# Test just OpenAI integration
deno task test:integration:openai

# Test just SendGrid integration
deno task test:integration:sendgrid

# Test complete workflows
deno task test:integration:e2e
```

### Scenario 4: Setting up for a team member
```bash
# They already have .env.example
# Just need to create .env and add their keys
cp .env.example .env
nano .env  # Add their API keys
deno task test:integration  # Works automatically!
```

---

## 📊 What Gets Tested

When you run integration tests with your `.env` file:

### With OpenAI Key Set:
- ✅ Makes real API calls to OpenAI
- ✅ Tests AI response generation
- ✅ Tests different email scenarios
- ✅ Measures performance and token usage

### With SendGrid Keys Set:
- ✅ Sends real emails via SendGrid
- ✅ Tests email formatting and threading
- ✅ **Emails arrive in your inbox** (check TEST_RECIPIENT_EMAIL)
- ✅ Tests special characters and long emails

### With All Keys Set:
- ✅ Tests complete workflows (receive → AI → send)
- ✅ End-to-end integration
- ✅ Performance benchmarks

---

## ⏱️ Expected Run Times

With your `.env` file loaded:

| Test Suite | Duration | API Calls | Cost |
|------------|----------|-----------|------|
| OpenAI | 20-30s | ~15 | ~$0.02 |
| SendGrid | 15-25s | ~8 | Depends on plan |
| End-to-End | 30-50s | ~14 | ~$0.03 |
| **All Tests** | **65-105s** | **~37** | **~$0.05** |

---

## 🎉 Summary

Your integration tests are now set up to automatically use your `.env` file!

**Just remember:**
1. ✅ Run `deno task test:integration` - that's it!
2. ✅ Edit `.env` whenever you need to change keys
3. ✅ Check your email inbox to verify SendGrid tests
4. ✅ Tests skip gracefully if variables are missing

**No extra steps needed** - the `.env` file is loaded automatically! 🚀

---

## 📚 Related Documentation

- **Quick Start:** [QUICKSTART.md](./QUICKSTART.md)
- **Full Guide:** [README.md](./README.md)
- **Deno Tasks:** [DENO-TASKS.md](./DENO-TASKS.md)
- **Environment Setup:** [../../ENV-SETUP.md](../../ENV-SETUP.md)

