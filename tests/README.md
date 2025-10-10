# Testing Guide

Complete testing documentation for the LLMBox monorepo.

## 📁 Test Structure

```
tests/
├── unit/                          # Fast, no external dependencies
│   ├── shared/                    # Shared utility tests
│   ├── email-webhook/             # LLMBox function tests
│   ├── personifeed/               # Personifeed function tests
│   └── database/                  # Database schema/migration tests
│
├── contract/                      # Contract/schema validation tests
│   ├── edge-function-contracts.test.ts
│   ├── email-format.test.ts
│   ├── database-schema.test.ts
│   └── type-safety.test.ts
│
└── integration/                   # Slow, real API calls
    ├── external-apis/             # External service tests
    │   ├── openai.test.ts
    │   ├── sendgrid.test.ts
    │   └── supabase-db.test.ts
    ├── llmbox/                    # LLMBox integration tests
    │   └── webhook-flow.test.ts
    └── personifeed/               # Personifeed integration tests
        ├── signup-flow.test.ts
        ├── cron-flow.test.ts
        └── reply-flow.test.ts
```

## 🎯 Test Types

### Unit Tests (`tests/unit/`)

**Speed:** ⚡️ Instant (< 1 second)\
**Cost:** Free\
**When to run:** Continuously during development

Tests pure functions and business logic with no external dependencies. All external APIs are mocked.

```bash
# Run all unit tests
deno task test:unit

# Run specific subsystems
deno task test:unit:shared
deno task test:unit:llmbox
deno task test:unit:personifeed
deno task test:unit:database

# Watch mode for active development
deno task test:unit:watch
```

**What's tested:**

- Email parsing logic
- Input validation
- Data formatting
- Error handling
- Configuration loading
- Type safety

---

### Contract Tests (`tests/contract/`)

**Speed:** ⚡️ Fast (< 5 seconds)\
**Cost:** Free\
**When to run:** Before commits, in CI

Validates contracts between services, schemas, and types. Ensures runtime behavior matches
compile-time expectations.

```bash
deno task test:contract
```

**What's tested:**

- Edge function request/response shapes
- Database schema structure
- Email format validation
- TypeScript type correctness
- API contracts

---

### Integration Tests (`tests/integration/`)

**Speed:** 🐢 Slow (2-10 minutes)\
**Cost:** $$$ (makes real API calls)\
**When to run:** Before deployment, sparingly

Tests real integrations with external services. **⚠️ Costs money and sends real emails!**

```bash
# All integration tests (expensive!)
deno task test:integration

# Test specific external APIs
deno task test:integration:openai      # OpenAI API calls
deno task test:integration:sendgrid    # SendGrid email sending
deno task test:integration:supabase    # Database operations

# Test specific services
deno task test:integration:llmbox      # LLMBox webhook flow
deno task test:integration:personifeed # Personifeed flows
```

**What's tested:**

- Real OpenAI API calls and responses
- Real email sending via SendGrid
- Real database CRUD operations
- Function-level workflows

---

## 🚀 Quick Reference

### Development Workflow

| Stage                | Command                     | Speed      | Cost   |
| -------------------- | --------------------------- | ---------- | ------ |
| **While coding**     | `deno task test:unit:watch` | ⚡️ Instant | Free   |
| **Before commit**    | `deno task check`           | ⚡️ 30s     | Free   |
| **After DB changes** | `deno task db:test`         | ⚡️ 30s     | Free/$ |
| **Before deploy**    | `deno task test:pre-deploy` | 🐢 2-5min  | $$$    |

### Common Commands

```bash
# DEFAULT: Fast tests only (unit + contract)
deno task test

# FULL VALIDATION: Everything (slow, expensive)
deno task test:all

# CI-SAFE: No API calls
deno task test:ci

# PRE-COMMIT: Format, lint, type-check, fast tests
deno task check

# PRE-DEPLOY: Fast tests + integration tests
deno task test:pre-deploy

# QUICK SANITY: Format, lint, unit tests only
deno task check:quick
```

## ⚙️ Environment Variables

### Required for Integration Tests

```bash
# External APIs
OPENAI_API_KEY="sk-..."
SENDGRID_API_KEY="SG..."
SERVICE_EMAIL_ADDRESS="assistant@mail.llmbox.pro"

# Supabase
SUPABASE_URL="https://nopocimtfthppwssohty.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Optional
TEST_RECIPIENT_EMAIL="test@yourdomain.com"
OPENAI_MODEL="gpt-4o-mini"
LOG_LEVEL="DEBUG"
```

**Setup:** Add these to your shell profile (`~/.zshrc`) or use the `./scripts/load-env.sh` script.

### Test Behavior Without API Keys

Tests gracefully skip when API keys are missing:

- ✅ Unit tests run normally (no API keys needed)
- ✅ Contract tests run normally (no API keys needed)
- ⚠️ Integration tests skip with warning

---

## 📊 Coverage Goals

| Layer                 | Target | Command                   |
| --------------------- | ------ | ------------------------- |
| **Unit tests**        | > 80%  | `deno task test:coverage` |
| **Contract tests**    | > 70%  | Included in coverage      |
| **Integration tests** | > 60%  | Not measured              |

**View coverage:**

```bash
# Generate coverage data
deno task test:coverage

# View LCOV report
deno task test:coverage:report

# Generate HTML report
deno task test:coverage:html
```

---

## 🎨 Writing Tests

### Unit Test Template

```typescript
// tests/unit/shared/myFeature.test.ts
import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { myFunction } from '../../../supabase/functions/_shared/myFeature.ts';

Deno.test('myFunction - should handle valid input', () => {
  const result = myFunction('valid-input');
  assertEquals(result, 'expected-output');
});

Deno.test('myFunction - should throw on invalid input', () => {
  try {
    myFunction('invalid');
    throw new Error('Should have thrown');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});
```

### Integration Test Template

```typescript
// tests/integration/external-apis/myService.test.ts
import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const API_KEY = Deno.env.get('MY_API_KEY');
const shouldSkip = !API_KEY;

if (shouldSkip) {
  console.log('⚠️  Skipping test (missing MY_API_KEY)');
}

Deno.test({
  name: 'myService - performs real API call',
  ignore: shouldSkip,
  async fn() {
    // Test real API integration
    const response = await callRealAPI();
    assertEquals(response.status, 200);
  },
});
```

---

## 🚫 Testing Anti-Patterns

### ❌ Don't

- Run integration tests in watch mode (expensive)
- Test implementation details (test behavior, not internals)
- Mock everything in integration tests (defeats purpose)
- Skip edge cases in unit tests
- Hardcode production IDs/emails in tests
- Leave `console.log` in tests (use assertions)
- Commit failing tests

### ✅ Do

- Use unit tests for rapid development
- Mock external APIs in unit tests
- Use descriptive test names: `"should send email when user signs up"`
- Test error cases and edge cases
- Use factories/fixtures for test data
- Clean up test data after integration tests
- Skip expensive tests gracefully if API keys missing
- Run `deno task check` before every commit
- Run `deno task test:pre-deploy` before deployment

---

## 🐛 Troubleshooting

### Tests are skipped

**Problem:** "Skipping test (missing API_KEY)"

**Solution:**

```bash
# Check if env vars are set
echo $OPENAI_API_KEY

# Add to your shell profile
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.zshrc
source ~/.zshrc

# Or use load-env script
./scripts/load-env.sh deno task test:integration
```

### Integration tests fail with 401

**Problem:** "Unauthorized" errors from APIs

**Solution:**

- Verify API keys are correct
- Check API keys have proper permissions
- Check API keys haven't expired
- Verify you're using the right environment (test vs prod keys)

### Emails not arriving

**Problem:** SendGrid tests pass but no email received

**Solution:**

- Check spam/junk folder
- Verify sender email is verified in SendGrid
- Check SendGrid activity logs
- Confirm `TEST_RECIPIENT_EMAIL` is set correctly

### Tests timeout

**Problem:** Tests hang or timeout

**Solution:**

- Check internet connection
- Increase timeout values in test files
- Check API service status
- Verify Supabase project is active

### Database tests fail

**Problem:** Foreign key violations or constraint errors

**Solution:**

- Ensure migrations are up to date: `deno task db:push`
- Check test cleanup is working (delete test data)
- Verify you're using test database, not production
- Reset database if needed: `deno task db:reset`

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1

      # Always run: Fast, free
      - name: Lint
        run: deno task lint

      - name: Format check
        run: deno task fmt:check

      - name: Type check
        run: deno task type-check

      - name: Unit tests
        run: deno task test:ci

  integration-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1

      - name: Integration tests
        run: deno task test:integration
```

---

## 📚 Resources

- [Deno Testing](https://deno.land/manual/testing)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- [Supabase Testing](https://supabase.com/docs/guides/functions/unit-test)
- Main [README.md](../README.md) for project setup
- Integration tests [README.md](integration/README.md) for detailed integration testing info

---

## 🎯 Summary

- **Default (`deno task test`)**: Fast unit + contract tests
- **Pre-commit (`deno task check`)**: Format, lint, type-check, fast tests
- **Pre-deploy (`deno task test:pre-deploy`)**: Fast tests + integration tests
- **Full validation (`deno task test:all`)**: Everything (expensive!)

**Best practice:** Run unit tests constantly, integration tests before deployment.
