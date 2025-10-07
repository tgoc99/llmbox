# Integration Test Deno Tasks

## Available Tasks

The following Deno tasks have been added to make running integration tests easier:

### Run All Integration Tests
```bash
deno task test:integration
```
Runs all 27 integration tests (OpenAI + SendGrid + End-to-End).

**Equivalent to:**
```bash
deno test --allow-all --allow-env tests/integration/
```

---

### Run OpenAI Tests Only
```bash
deno task test:integration:openai
```
Runs only the 12 OpenAI API integration tests.

**What it tests:**
- AI response generation
- Different email types (support, business, complaints)
- Special characters
- Performance

**Estimated time:** 20-30 seconds

---

### Run SendGrid Tests Only
```bash
deno task test:integration:sendgrid
```
Runs only the 8 SendGrid API integration tests.

**What it tests:**
- Email sending and delivery
- Email threading
- Special characters
- Batch sending
- Performance

**Estimated time:** 15-25 seconds

**⚠️ Note:** These tests send real emails!

---

### Run End-to-End Tests Only
```bash
deno task test:integration:e2e
```
Runs only the 7 end-to-end workflow tests.

**What it tests:**
- Complete email processing workflows
- OpenAI + SendGrid integration
- Different email scenarios
- Performance benchmarks

**Estimated time:** 30-50 seconds

---

### Run Interactive Menu
```bash
deno task test:integration:menu
```
Opens an interactive menu for running tests with configuration checking.

**Features:**
- Check environment variables
- View current configuration
- Select which tests to run
- Colored output
- Error checking

**Same as:**
```bash
./scripts/run-integration-tests.sh
```

---

## Quick Examples

### Before Deployment
```bash
# Run all integration tests to verify everything works
deno task test:integration
```

### Testing OpenAI Changes
```bash
# Only test OpenAI if you changed AI-related code
deno task test:integration:openai
```

### Testing Email Sending
```bash
# Only test SendGrid if you changed email-related code
deno task test:integration:sendgrid
```

### Full Workflow Verification
```bash
# Test complete workflow from incoming email to response
deno task test:integration:e2e
```

### Interactive Selection
```bash
# Use menu to choose and configure
deno task test:integration:menu
```

---

## Environment Variables Required

All integration tasks require these environment variables:

```bash
# OpenAI (required for OpenAI and E2E tests)
export OPENAI_API_KEY="sk-your-openai-api-key"

# SendGrid (required for SendGrid and E2E tests)
export SENDGRID_API_KEY="SG.your-sendgrid-api-key"
export SERVICE_EMAIL_ADDRESS="assistant@yourdomain.com"

# Optional - for receiving test emails
export TEST_RECIPIENT_EMAIL="test@yourdomain.com"
```

**Pro tip:** Add these to your `.zshrc` or `.bashrc` so they're always available.

---

## Test Status

Tests will automatically skip if required credentials are missing:

```bash
$ deno task test:integration:openai

⚠️  OpenAI Integration Tests Skipped
   Set OPENAI_API_KEY environment variable to run these tests
```

This is expected behavior - tests won't fail, they'll just skip gracefully.

---

## Comparison: Direct vs Task

| Method | Command |
|--------|---------|
| **Deno Task** | `deno task test:integration` |
| **Direct** | `deno test --allow-all --allow-env tests/integration/` |
| | |
| **Deno Task** | `deno task test:integration:openai` |
| **Direct** | `deno test --allow-all --allow-env tests/integration/openai.test.ts` |
| | |
| **Deno Task** | `deno task test:integration:sendgrid` |
| **Direct** | `deno test --allow-all --allow-env tests/integration/sendgrid.test.ts` |
| | |
| **Deno Task** | `deno task test:integration:e2e` |
| **Direct** | `deno test --allow-all --allow-env tests/integration/end-to-end.test.ts` |

**Recommendation:** Use Deno tasks - they're shorter and easier to remember!

---

## All Testing Tasks

For reference, here are all available testing tasks:

```bash
deno task test                       # Run all tests (unit + integration)
deno task test:unit                  # Run unit tests only
deno task test:integration           # Run all integration tests
deno task test:integration:openai    # Run OpenAI integration tests
deno task test:integration:sendgrid  # Run SendGrid integration tests
deno task test:integration:e2e       # Run end-to-end integration tests
deno task test:integration:menu      # Run integration tests (interactive)
deno task test:watch                 # Run tests in watch mode
deno task test:coverage              # Run tests with coverage
deno task test:endpoint              # Test if endpoint is live
deno task test:webhook               # Test webhook with sample data
```

---

## Workflow Examples

### Daily Development
```bash
# Fast iteration with unit tests
deno task test:unit

# Or use watch mode
deno task test:watch
```

### Before Committing
```bash
# Run all checks including tests
deno task check:all
```

### Before Deploying
```bash
# Verify everything works with real APIs
deno task test:integration

# Or check specific integrations
deno task test:integration:openai
deno task test:integration:sendgrid
```

### After Deployment
```bash
# Verify endpoint is live
deno task test:endpoint

# Test with sample webhook data
deno task test:webhook
```

---

## Tips

1. **Save Time**: Run specific test suites instead of all tests
   ```bash
   deno task test:integration:openai  # Just AI tests
   ```

2. **Check Setup**: Use the interactive menu to verify configuration
   ```bash
   deno task test:integration:menu
   # Then select option 6 to check environment variables
   ```

3. **Cost Control**: Integration tests cost money (API credits)
   - Use unit tests for rapid iteration
   - Run integration tests before deployments
   - Don't run them continuously

4. **Verify Delivery**: After SendGrid tests, check your inbox
   ```bash
   deno task test:integration:sendgrid
   # Then check TEST_RECIPIENT_EMAIL inbox
   ```

5. **View Help Anytime**:
   ```bash
   deno task help
   ```

---

## See Also

- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
- [README.md](./README.md) - Comprehensive documentation
- [INTEGRATION-TESTS-SUMMARY.md](./INTEGRATION-TESTS-SUMMARY.md) - Implementation details
- [../../docs/SCRIPTS.md](../../docs/SCRIPTS.md) - All project scripts

---

## Summary

**Yes!** The current `deno task test:integration` runs all the new integration tests. Plus, you now have:

✅ `test:integration` - Run all integration tests (OpenAI + SendGrid + E2E)
✅ `test:integration:openai` - Run OpenAI tests only
✅ `test:integration:sendgrid` - Run SendGrid tests only
✅ `test:integration:e2e` - Run end-to-end tests only
✅ `test:integration:menu` - Interactive test runner

All tasks are ready to use! 🚀

