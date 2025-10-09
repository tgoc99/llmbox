# Technical Assumptions

## Repository Structure: Monorepo

- Single repository for Edge Functions and future features
- Simple structure for MVP (single function)

## Service Architecture: Serverless (Supabase Edge Functions)

- Stateless Edge Functions handle webhook requests
- Auto-scaling, pay-per-use model
- No persistent server management required

## Testing Requirements: Unit + Integration Tests

- Unit tests for email parsing logic
- Unit tests for LLM prompt formatting
- Integration tests for SendGrid webhook handling
- Integration tests for OpenAI API calls
- Manual testing for end-to-end email flow

## Core Technologies

**Runtime & Language:**

- **Deno** (Supabase Edge Functions runtime)
- **TypeScript** - Type safety for email parsing and API interactions

**Email Infrastructure:**

- **SendGrid Inbound Parse Webhook** - Receives and parses incoming emails
- **SendGrid Send API** - Sends response emails
- Email threading via In-Reply-To and References headers

**LLM Integration:**

- **OpenAI API** (GPT-4 or GPT-3.5-turbo)
- Streaming responses not required for MVP (email is async)
- Simple completion endpoint

**Database (Post-MVP):**

- **Supabase PostgreSQL** - For conversation history
- **Supabase Auth** (future) - For user management

**Infrastructure:**

- **Supabase Edge Functions** - Serverless compute
- **Supabase Secrets/Environment Variables** - API key storage
- **Supabase Logs** - Error tracking and debugging

**Development & Deployment:**

- **Supabase CLI** - Local development and deployment
- **Git** - Version control
- **GitHub Actions** (optional) - CI/CD pipeline

## Additional Technical Assumptions and Requests

**Security:**

- SendGrid webhook signature verification (validates requests are from SendGrid)
- API keys stored in Supabase secrets, never in code
- No user authentication in MVP (open email address)
- Rate limiting deferred to post-MVP

**Email Processing:**

- Plain text email bodies only (HTML stripped by SendGrid if needed)
- No attachment handling in MVP
- Maximum email size: 30MB (SendGrid limit)
- Email threading maintained via standard email headers

**LLM Integration:**

- System prompt configurable via environment variable
- Token limits: 4000 tokens input, 1000 tokens output (configurable)
- Timeout: 30 seconds for OpenAI API calls
- No conversation context in MVP (each email independent)

**Error Handling:**

- Failed LLM calls: Send error email to user
- Failed email sends: Log error (no retry in MVP)
- Invalid webhook data: Return 400 to SendGrid
- Timeout handling: Return 200 to SendGrid, send error email async

**Observability:**

- Supabase Edge Function logs for debugging
- No dedicated monitoring/alerting in MVP
- Post-MVP: Add Supabase Analytics or external monitoring

---
