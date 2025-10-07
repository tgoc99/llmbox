# Test Strategy and Standards

## Testing Philosophy

- **Approach:** Test-after development for MVP (write tests after implementing features)
- **Coverage Goals:** 80% code coverage for critical paths (webhook verification, API calls, retry logic)
- **Test Pyramid:** Heavy emphasis on unit tests (70%), moderate integration tests (25%), minimal E2E (5%)

## Test Types and Organization

### Unit Tests

- **Framework:** Deno Test (built-in)
- **File Convention:** `*.test.ts` co-located with source in `tests/unit/` directory
- **Location:** `tests/unit/`
- **Mocking Library:** Deno standard library mocking utilities

**Coverage Requirement:** 80% for critical modules

**AI Agent Requirements:**
- Generate tests for all public functions
- Cover edge cases and error conditions
- Follow AAA pattern (Arrange, Act, Assert)
- Mock all external dependencies (OpenAI API, SendGrid API)

**Example Test Structure:**
```typescript
import { assertEquals, assertRejects } from "https://deno.land/std/testing/asserts.ts";
import { parseIncomingEmail } from "../emailParser.ts";

Deno.test("emailParser - parses valid SendGrid payload", () => {
  // Arrange
  const payload = {
    from: "user@example.com",
    to: "service@domain.com",
    subject: "Test",
    text: "Hello",
    headers: "Message-ID: <abc123@mail.gmail.com>"
  };

  // Act
  const result = parseIncomingEmail(payload);

  // Assert
  assertEquals(result.from, "user@example.com");
  assertEquals(result.messageId, "<abc123@mail.gmail.com>");
});
```

### Integration Tests

- **Scope:** Test interactions between components and real external APIs
- **Location:** `tests/integration/`
- **Test Infrastructure:**
  - **OpenAI API:** Real API calls with test API key (use separate test account)
  - **SendGrid API:** Real API calls with test API key (send to test email addresses)
  - **Webhook:** ngrok or similar tool for local webhook testing

**Example Integration Test:**
```typescript
Deno.test("OpenAI integration - generates response", async () => {
  const client = new LLMClient(Deno.env.get("OPENAI_TEST_API_KEY")!);

  const response = await client.generateResponse({
    from: "test@example.com",
    subject: "Test",
    body: "Hello, how are you?"
  });

  assert(response.content.length > 0);
  assert(response.model.includes("gpt"));
});
```

### End-to-End Tests

- **Scope:** Full email flow from SendGrid webhook to email delivery
- **Environment:** Staging environment with real services
- **Test Data:** Test email accounts and known input/output pairs

**Manual E2E Test Process:**
1. Send email to staging service address
2. Verify webhook received in Supabase logs
3. Verify OpenAI API call in logs
4. Verify response email received in test inbox
5. Verify email threading (In-Reply-To headers)

## Test Data Management

- **Strategy:** In-memory test data fixtures; no persistent test database needed
- **Fixtures:** TypeScript objects in `tests/fixtures/` directory
- **Factories:** Test data builder functions for creating complex test objects
- **Cleanup:** N/A for MVP (stateless, no database)

**Example Fixture:**
```typescript
// tests/fixtures/emailFixtures.ts
export const validIncomingEmail = {
  from: "user@example.com",
  to: "service@domain.com",
  subject: "Test Subject",
  body: "Test email body",
  messageId: "<test123@mail.gmail.com>",
  inReplyTo: null,
  references: [],
  timestamp: new Date("2025-01-07T10:00:00Z")
};
```

## Continuous Testing

- **CI Integration:** GitHub Actions runs tests on every push and pull request
- **Performance Tests:** Monitor Edge Function execution time (target: <30s total)
- **Security Tests:** No automated security testing in MVP; manual security review before production

**GitHub Actions Workflow:**
```yaml