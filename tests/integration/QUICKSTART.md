# Integration Tests Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Set Environment Variables

Create a `.env` file or export these variables:

```bash
# Required for all tests
export OPENAI_API_KEY="sk-your-openai-api-key-here"
export SENDGRID_API_KEY="SG.your-sendgrid-api-key-here"
export SERVICE_EMAIL_ADDRESS="assistant@yourdomain.com"

# Optional - for receiving test emails
export TEST_RECIPIENT_EMAIL="your-test-email@yourdomain.com"
```

### 2. Run Tests

#### Option A: Using the Helper Script (Recommended)

```bash
# Interactive menu
./scripts/run-integration-tests.sh

# Or use command-line options
./scripts/run-integration-tests.sh --all        # All tests
./scripts/run-integration-tests.sh --openai     # OpenAI only
./scripts/run-integration-tests.sh --sendgrid   # SendGrid only
./scripts/run-integration-tests.sh --e2e        # End-to-end only
./scripts/run-integration-tests.sh --config     # Show config
```

#### Option B: Direct Deno Commands

```bash
# All tests
deno test tests/integration/ --allow-all --allow-env

# Specific test file
deno test tests/integration/openai.test.ts --allow-all --allow-env
deno test tests/integration/sendgrid.test.ts --allow-all --allow-env
deno test tests/integration/end-to-end.test.ts --allow-all --allow-env
```

## 📝 What to Expect

### OpenAI Tests (12 tests, ~20-30 seconds)
Tests AI response generation with various email types:
- Basic responses
- Technical support
- Business inquiries
- Complaint handling
- Special characters
- Performance benchmarks

### SendGrid Tests (8 tests, ~15-25 seconds)
Tests email sending functionality:
- Basic email delivery
- Email threading
- Long emails
- Special characters
- Multiple emails
- Performance timing

**⚠️ Important**: These tests send real emails! Check your inbox at `TEST_RECIPIENT_EMAIL` to verify delivery.

### End-to-End Tests (7 tests, ~30-50 seconds)
Tests the complete workflow (receive → process → respond):
- Complete email workflows
- Different email types
- Thread continuations
- Performance metrics

## ✅ Verifying Success

### OpenAI Tests
Look for output like:
```
✅ OpenAI API integration test passed
   Model: gpt-4o-mini
   Tokens: 245
   Time: 1523ms
   Response preview: Thank you for your inquiry...
```

### SendGrid Tests
Look for output like:
```
✅ SendGrid basic email test passed
   Recipient: test@example.com
   Subject: Re: Integration Test
   Check the recipient inbox to verify delivery
```

**Then check your email inbox** to verify the test emails arrived!

### End-to-End Tests
Look for output like:
```
🎉 End-to-end test completed successfully!
   Total workflow time: 2523ms
   - AI generation: 1523ms
   - Email sending: 1000ms

📬 Check test@example.com inbox to verify delivery
```

## 🔍 Troubleshooting

### Tests Are Skipped
**Problem**: `⚠️ Tests Skipped - credentials not set`

**Fix**: Make sure environment variables are exported:
```bash
echo $OPENAI_API_KEY      # Should show your key
echo $SENDGRID_API_KEY    # Should show your key
echo $SERVICE_EMAIL_ADDRESS  # Should show your email
```

### OpenAI 401 Error
**Problem**: `openai_auth_error` or authentication failure

**Fix**:
1. Check your API key is correct
2. Verify you have credits: https://platform.openai.com/account/usage
3. Try a new API key

### SendGrid 401 Error
**Problem**: `sendgrid_auth_error` or authentication failure

**Fix**:
1. Check your API key is correct
2. Verify key has "Mail Send" permission in SendGrid dashboard
3. Ensure your account is active

### Emails Not Arriving
**Problem**: Tests pass but no emails in inbox

**Fix**:
1. Check spam/junk folder
2. Verify `SERVICE_EMAIL_ADDRESS` is a verified sender in SendGrid
3. Check SendGrid Activity log: https://app.sendgrid.com/email_activity
4. Wait a few minutes (sometimes delayed)

### Timeout Errors
**Problem**: Tests fail with timeout

**Fix**: Increase timeout values:
```bash
export OPENAI_TIMEOUT_MS="60000"    # 60 seconds
export SENDGRID_TIMEOUT_MS="20000"  # 20 seconds
```

## 💡 Pro Tips

1. **First Time Running**: Use the helper script with `--check` to verify setup:
   ```bash
   ./scripts/run-integration-tests.sh --check
   ```

2. **Save Time**: Run specific test files instead of all tests:
   ```bash
   # Only test what you changed
   deno test tests/integration/openai.test.ts --allow-all --allow-env
   ```

3. **Cost Control**: These tests use real APIs (costs money). Don't run them continuously.

4. **CI/CD**: Consider running these tests on a schedule (e.g., nightly) rather than on every commit.

5. **Debugging**: Run individual tests by name:
   ```bash
   deno test tests/integration/ --allow-all --allow-env --filter "basic email"
   ```

## 📊 Expected Run Times

| Test Suite | Tests | Estimated Time | API Calls |
|------------|-------|----------------|-----------|
| OpenAI     | 12    | 20-30 seconds  | ~15       |
| SendGrid   | 8     | 15-25 seconds  | ~8        |
| End-to-End | 7     | 30-50 seconds  | ~14       |
| **Total**  | **27**| **65-105 sec** | **~37**   |

## 🎯 Next Steps

After tests pass:

1. ✅ Check your email inbox to verify SendGrid emails arrived
2. ✅ Review the console output for any warnings
3. ✅ If modifying code, run tests again to verify changes
4. ✅ Consider running unit tests for faster iteration:
   ```bash
   deno test tests/unit/ --allow-all
   ```

## 📚 More Information

- Full documentation: [README.md](./README.md)
- Test source code: `openai.test.ts`, `sendgrid.test.ts`, `end-to-end.test.ts`
- Main project docs: [../../docs/](../../docs/)

## ❓ Need Help?

1. Read the full [README.md](./README.md) for detailed troubleshooting
2. Check [TROUBLESHOOTING-401.md](../../docs/TROUBLESHOOTING-401.md) for auth issues
3. Review test output carefully - it includes helpful diagnostic info
4. Check API provider status pages:
   - OpenAI: https://status.openai.com/
   - SendGrid: https://status.sendgrid.com/

