# Integration Tests

Integration tests that make **real API calls** to OpenAI and SendGrid. These verify the application works with actual external services.

## ⚠️ Important

- Makes real API calls (costs money)
- Sends real emails via SendGrid
- Tests skip gracefully if API keys not provided
- Do not run excessively - use unit tests for rapid development

## Test Files

- **`openai.test.ts`** - OpenAI API integration (response generation, timeouts, various email types)
- **`sendgrid.test.ts`** - SendGrid API integration (email sending, threading, formatting)
- **`end-to-end.test.ts`** - Complete workflow (webhook → OpenAI → SendGrid)

## Setup

### Required Environment Variables

```bash
export OPENAI_API_KEY="sk-your-key"
export SENDGRID_API_KEY="SG.your-key"
export SERVICE_EMAIL_ADDRESS="assistant@yourdomain.com"
export TEST_RECIPIENT_EMAIL="test@yourdomain.com"  # optional
```

**Tip:** Add these to your shell profile (`~/.zshrc`) or use `.env` file with load script.

## Running Tests

```bash
# All integration tests (recommended)
deno task test:integration

# Or run specific tests
deno test tests/integration/openai.test.ts --allow-all --allow-env
deno test tests/integration/sendgrid.test.ts --allow-all --allow-env
deno test tests/integration/end-to-end.test.ts --allow-all --allow-env
```

**Auto-skipping:** Tests skip gracefully if API keys not set.

**Success output:** Shows response preview, token counts, timing, performance metrics.

## Verifying Results

- **OpenAI tests:** Check console for response content and token counts
- **SendGrid tests:** Check recipient inbox for actual email delivery
- **E2E tests:** Verify both console output and inbox

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Tests skipped** | Verify environment variables are set: `echo $OPENAI_API_KEY` |
| **401 errors** | Verify API keys are correct and have proper permissions |
| **Emails not arriving** | Check spam folder, verify sender in SendGrid, check SendGrid activity logs |
| **Timeout errors** | Check internet connection, increase timeout env vars |
| **Rate limits** | Wait before retrying, check API plan limits |

## Best Practices

- Use separate API keys for testing vs production
- Don't run excessively - integration tests cost money
- Use unit tests for rapid development
- Run integration tests before major deployments
- Monitor API usage in provider dashboards

## Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- Main [README.md](../../README.md) for project setup

