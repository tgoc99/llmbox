# Security

## Input Validation

- **Validation Library:** Deno standard library + custom validation functions
- **Validation Location:** At API boundary (webhook entry point) before any processing
- **Required Rules:**
  - All external inputs MUST be validated against expected schema
  - Validation at webhook entry point using `emailParser` module
  - Whitelist approach: Only accept known fields from SendGrid payload
  - Reject requests with missing required fields (from, to, subject, text, headers)
  - Validate email addresses using regex pattern
  - Validate Message-ID format

## Authentication & Authorization

- **Auth Method:** HMAC SHA-256 signature verification for SendGrid webhooks
- **Session Management:** N/A (stateless, no user sessions)
- **Required Patterns:**
  - MUST verify SendGrid webhook signature on every request using `webhookVerifier`
  - Use constant-time comparison for signature verification (prevents timing attacks)
  - Reject requests with missing or invalid `X-Twilio-Email-Event-Webhook-Signature` header
  - Validate timestamp to prevent replay attacks (reject requests >10 minutes old)
  - Never process webhooks without successful signature verification

## Secrets Management

- **Development:** `.env.local` file (gitignored) for local development
- **Production:** Supabase Secrets via CLI or Dashboard
- **Code Requirements:**
  - NEVER hardcode secrets in source code
  - Access secrets only via `config.ts` module which reads from `Deno.env`
  - No secrets in logs or error messages
  - Secrets must be set before deployment:
    - `SENDGRID_API_KEY`
    - `OPENAI_API_KEY`
    - `SENDGRID_WEBHOOK_VERIFICATION_KEY`
    - `SERVICE_EMAIL_ADDRESS` (from address for outbound emails)

## API Security

- **Rate Limiting:** Not implemented in MVP (rely on Supabase Edge Functions automatic scaling and OpenAI/SendGrid rate limits)
- **CORS Policy:** Not applicable (webhook endpoint, not browser-based)
- **Security Headers:** Automatic via Supabase Edge Functions platform
- **HTTPS Enforcement:** Automatic via Supabase (all Edge Functions are HTTPS-only)

## Data Protection

- **Encryption at Rest:** N/A for MVP (no data persistence)
- **Encryption in Transit:** All API calls use HTTPS (OpenAI, SendGrid, Supabase)
- **PII Handling:**
  - Email addresses considered PII
  - Never log full email bodies (log body preview only: first 100 characters)
  - Email content not persisted in MVP
- **Logging Restrictions:**
  - Never log API keys
  - Never log full email bodies
  - Never log SendGrid webhook verification keys
  - Log sender email addresses but consider anonymization for production

## Dependency Security

- **Scanning Tool:** `deno info` for dependency inspection; GitHub Dependabot for dependency alerts
- **Update Policy:** Review and update dependencies monthly; immediate updates for critical security vulnerabilities
- **Approval Process:** All new dependencies must be reviewed for security and licensing; prefer Deno standard library over third-party dependencies

## Security Testing

- **SAST Tool:** Deno lint for static analysis
- **DAST Tool:** None in MVP (manual security review)
- **Penetration Testing:** Not planned for MVP; recommended for production post-MVP
