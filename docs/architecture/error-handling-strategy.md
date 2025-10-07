# Error Handling Strategy

## General Approach

- **Error Model:** Structured error objects with type, message, and context
- **Exception Hierarchy:**
  - `WebhookError` - Invalid or unauthorized webhook requests
  - `LLMError` - OpenAI API failures
  - `EmailError` - SendGrid API failures
  - `ValidationError` - Invalid data formats
- **Error Propagation:** Errors logged immediately; user-facing errors sent via email; webhook always returns 200 or appropriate HTTP status

## Logging Standards

- **Library:** Deno native `console` with structured JSON formatting
- **Format:** JSON with consistent fields: `timestamp`, `level`, `event`, `context`, `error`
- **Levels:** DEBUG, INFO, WARN, ERROR, CRITICAL
- **Required Context:**
  - **Correlation ID:** Message-ID from email (traces full request lifecycle)
  - **Service Context:** Function name, version, execution time
  - **User Context:** Sender email (anonymized in production logs if needed)

**Log Format Example:**
```typescript
{
  "timestamp": "2025-01-07T10:30:45.123Z",
  "level": "INFO",
  "event": "webhook_received",
  "context": {
    "messageId": "CAF=abc123@mail.gmail.com",
    "from": "user@example.com",
    "subject": "Hello",
    "functionVersion": "1.0"
  }
}
```

## Error Handling Patterns

### External API Errors

**OpenAI API:**
- **Retry Policy:** 3 attempts with exponential backoff (1s, 2s, 4s)
- **Circuit Breaker:** Not implemented in MVP (stateless - no shared state for circuit breaker)
- **Timeout Configuration:** 30 seconds per request
- **Error Translation:**
  - 429 Rate Limit → Retry, then send user error email
  - 500/502/503/504 → Retry, then send user error email
  - 401/403 → Log CRITICAL, send generic error to user
  - Timeout → Send user error email ("taking longer than usual")

**SendGrid API:**
- **Retry Policy:** Same as OpenAI (3 attempts, exponential backoff)
- **Timeout Configuration:** 10 seconds per request
- **Error Translation:**
  - 429 Rate Limit → Retry, then log error (do not send error email - creates loop)
  - 500/502/503 → Retry, then log error
  - 401/403 → Log CRITICAL error (invalid API key)
  - 400 → Log error with details (malformed request)

### Business Logic Errors

- **Custom Exceptions:**
  - `InvalidEmailFormatError` - Malformed email payload
  - `MissingRequiredFieldError` - Required email fields missing
  - `SignatureVerificationError` - Invalid webhook signature
- **User-Facing Errors:** All errors result in clear, actionable email responses to user
- **Error Codes:** Not used in MVP (email-based communication doesn't need error codes)

### Data Consistency

- **Transaction Strategy:** N/A for MVP (stateless, no database)
- **Compensation Logic:** N/A for MVP
- **Idempotency:** Message-ID tracking in-memory (10-minute window) prevents duplicate processing

---
