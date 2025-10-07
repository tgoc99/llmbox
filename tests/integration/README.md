# Integration Tests

This directory contains integration tests that make **real API calls** to external services. These tests verify that the application works correctly with actual OpenAI and SendGrid APIs.

## ⚠️ Important Notes

- **Real API Calls**: These tests make actual API calls and will consume API credits
- **Real Emails**: SendGrid tests will send actual emails to the configured recipient
- **Costs**: Running these tests repeatedly may incur costs on your OpenAI and SendGrid accounts
- **Environment Required**: Tests require valid API keys and will be skipped if credentials are missing

## Test Files

### 1. `openai.test.ts`
Tests OpenAI API integration for AI response generation.

**Tests included:**
- ✅ Basic response generation
- ✅ Reply context handling
- ✅ Timeout configuration
- ✅ Different email lengths
- ✅ Technical support queries
- ✅ Business inquiries
- ✅ Complaint handling
- ✅ Multi-paragraph emails
- ✅ Prompt formatting validation
- ✅ Special characters handling
- ✅ Consistency across multiple calls

### 2. `sendgrid.test.ts`
Tests SendGrid API integration for email sending.

**Tests included:**
- ✅ Basic email sending
- ✅ Email threading with In-Reply-To and References headers
- ✅ Long email bodies
- ✅ Special characters and emojis
- ✅ Outgoing email formatting
- ✅ Re: prefix handling
- ✅ Multiple sequential emails
- ✅ Performance timing

### 3. `end-to-end.test.ts`
Tests the complete workflow from receiving an email to sending a response.

**Tests included:**
- ✅ Complete email response workflow
- ✅ Technical support inquiry handling
- ✅ Customer complaint handling
- ✅ Email thread continuation
- ✅ Special characters in workflow
- ✅ Performance benchmarking
- ✅ Long detailed emails

## Prerequisites

### Required Environment Variables

```bash
# OpenAI API Key (required for OpenAI and E2E tests)
export OPENAI_API_KEY="sk-your-openai-api-key"

# SendGrid API Key (required for SendGrid and E2E tests)
export SENDGRID_API_KEY="SG.your-sendgrid-api-key"

# Service Email Address (required for SendGrid and E2E tests)
export SERVICE_EMAIL_ADDRESS="assistant@yourdomain.com"

# Test Recipient Email (optional - defaults to SERVICE_EMAIL_ADDRESS)
export TEST_RECIPIENT_EMAIL="test@yourdomain.com"
```

### Optional Configuration

```bash
# OpenAI Configuration (optional - defaults shown)
export OPENAI_MODEL="gpt-4o-mini"
export OPENAI_MAX_TOKENS="1000"
export OPENAI_TEMPERATURE="0.7"
export OPENAI_TIMEOUT_MS="30000"

# SendGrid Configuration (optional - defaults shown)
export SENDGRID_TIMEOUT_MS="10000"
```

## Running the Tests

### Run All Integration Tests

```bash
deno test tests/integration/ --allow-all --allow-env
```

### Run Specific Test File

```bash
# OpenAI tests only
deno test tests/integration/openai.test.ts --allow-all --allow-env

# SendGrid tests only
deno test tests/integration/sendgrid.test.ts --allow-all --allow-env

# End-to-end tests only
deno test tests/integration/end-to-end.test.ts --allow-all --allow-env
```

### Run with Verbose Output

```bash
deno test tests/integration/ --allow-all --allow-env -- --verbose
```

### Run Specific Test by Name

```bash
deno test tests/integration/ --allow-all --allow-env --filter "basic email"
```

## Test Behavior

### Automatic Skipping
Tests will automatically skip if required credentials are not set:

```
⚠️  OpenAI Integration Tests Skipped
   Set OPENAI_API_KEY environment variable to run these tests
```

### Success Output
Successful tests provide detailed feedback:

```
✅ OpenAI API integration test passed
   Model: gpt-4o-mini
   Tokens: 245
   Time: 1523ms
   Response preview: Thank you for your inquiry...

✅ SendGrid basic email test passed
   Recipient: test@example.com
   Subject: Re: Integration Test
   Check the recipient inbox to verify delivery
```

### Performance Metrics
Some tests include performance tracking:

```
📊 Performance Metrics:
   AI Generation:    1523ms (75.2%)
   Email Formatting: 2ms (0.1%)
   Email Sending:    498ms (24.7%)
   Total Time:       2023ms
   Throughput:       29.7 emails/minute (theoretical)
```

## Verifying Test Results

### OpenAI Tests
- Check console output for response content and metrics
- Verify token counts are reasonable
- Ensure completion times are within acceptable ranges

### SendGrid Tests
- **Check the recipient's inbox** to verify emails were actually delivered
- Verify email threading works correctly in email client
- Check subject lines have proper "Re:" prefixes
- Verify special characters render correctly

### End-to-End Tests
- Check both console output and recipient inbox
- Verify the complete workflow functions correctly
- Review performance metrics to ensure acceptable speed

## Troubleshooting

### Tests Are Skipped

**Problem**: Tests show as skipped with warning messages

**Solution**: 
1. Check that all required environment variables are set
2. Verify API keys are valid and not expired
3. Ensure no extra spaces or quotes in environment variables

```bash
# Verify environment variables are set
echo $OPENAI_API_KEY
echo $SENDGRID_API_KEY
echo $SERVICE_EMAIL_ADDRESS
```

### OpenAI Tests Fail with 401 Error

**Problem**: `openai_auth_error` or 401/403 status

**Solution**:
1. Verify your OpenAI API key is correct
2. Check that your OpenAI account has available credits
3. Ensure the API key has the correct permissions

### SendGrid Tests Fail with 401 Error

**Problem**: `sendgrid_auth_error` or 401/403 status

**Solution**:
1. Verify your SendGrid API key is correct
2. Check that the API key has "Mail Send" permissions
3. Verify your SendGrid account is active

### Emails Not Arriving

**Problem**: Tests pass but emails don't arrive in inbox

**Solution**:
1. Check spam/junk folder
2. Verify SERVICE_EMAIL_ADDRESS is a verified sender in SendGrid
3. Check SendGrid activity logs in their dashboard
4. Ensure TEST_RECIPIENT_EMAIL is correct

### Timeout Errors

**Problem**: Tests fail with timeout errors

**Solution**:
1. Check your internet connection
2. Increase timeout values if needed:
   ```bash
   export OPENAI_TIMEOUT_MS="60000"
   export SENDGRID_TIMEOUT_MS="20000"
   ```
3. Try running tests again (APIs may have temporary issues)

### Rate Limit Errors

**Problem**: `sendgrid_rate_limit` or 429 status

**Solution**:
1. Wait a few minutes before running tests again
2. Reduce the number of tests running simultaneously
3. Check your SendGrid plan's rate limits

## Best Practices

### Development
- Run integration tests before committing major changes
- Use separate API keys for testing vs production
- Monitor API usage to avoid unexpected costs

### CI/CD
- Consider running integration tests on a schedule (e.g., nightly)
- Use separate test credentials for CI/CD pipelines
- Set up alerts for test failures

### Cost Management
- Don't run integration tests too frequently
- Use unit tests for rapid development iteration
- Reserve integration tests for verification before deployment

## Example Test Run

Here's what a successful test run looks like:

```bash
$ deno test tests/integration/openai.test.ts --allow-all --allow-env

running 12 tests from ./tests/integration/openai.test.ts

OpenAI integration - generates response with real API ... ok (1.5s)
  ✅ OpenAI API integration test passed
     Model: gpt-4o-mini
     Tokens: 85
     Time: 1523ms
     Response preview: Thank you for reaching out! I'd be happy to help...

OpenAI integration - handles email with reply context ... ok (1.3s)
  ✅ OpenAI API reply context test passed

OpenAI integration - respects timeout configuration ... ok (1.4s)
  ✅ OpenAI API timeout test passed
     Total time: 1421ms

[... more tests ...]

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out (18s)
```

## Getting Help

If you encounter issues not covered in this guide:

1. Check the main project README for general setup instructions
2. Review the test source code for detailed test logic
3. Check API provider documentation:
   - [OpenAI API Documentation](https://platform.openai.com/docs)
   - [SendGrid API Documentation](https://docs.sendgrid.com/)
4. Review application logs for detailed error messages

## Contributing

When adding new integration tests:

1. Follow the existing test structure and naming conventions
2. Include descriptive test names and comments
3. Add proper error handling and assertions
4. Update this README with new test descriptions
5. Ensure tests can be skipped when credentials are missing
6. Provide clear console output for test results

