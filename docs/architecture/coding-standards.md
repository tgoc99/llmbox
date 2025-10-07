# Coding Standards

## Core Standards

- **Languages & Runtimes:** TypeScript 5.x with strict mode, Deno latest
- **Style & Linting:** Deno fmt (default formatter), Deno lint (default linter)
- **Test Organization:** Tests in `tests/` directory, mirror source structure
- **Documentation:** ALWAYS USE CONTEXT7 MCP

**Configuration:**
```json
// deno.json
{
  "fmt": {
    "options": {
      "lineWidth": 100,
      "indentWidth": 2,
      "singleQuote": true
    }
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  }
}
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | camelCase.ts | `emailParser.ts` |
| Functions | camelCase | `parseIncomingEmail()` |
| Classes | PascalCase | `WebhookVerifier` |
| Interfaces | PascalCase with 'I' prefix (optional) | `IncomingEmail` or `IIncomingEmail` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| Environment Variables | UPPER_SNAKE_CASE | `OPENAI_API_KEY` |

## Critical Rules

- **Never use console.log in production code** - Use the structured `logger` module instead. Only exception: during local development.

- **All API responses must include error context** - When returning error responses, always include relevant context (but never expose API keys or sensitive data).

- **All external API calls must use retry logic** - Use the `retryLogic` utility for all OpenAI and SendGrid API calls. Never make direct API calls without retry handling.

- **Always validate webhook signatures** - Every webhook request must be verified using `webhookVerifier` before processing. Never skip signature verification.

- **Environment variables must use config module** - Access all environment variables through `config.ts`. Never use `Deno.env.get()` directly in business logic.

- **All functions must have TypeScript return types** - Never rely on type inference for function return values. Always explicitly declare return types.

- **Error objects must include correlation ID** - All logged errors must include the Message-ID for request tracing.

---
