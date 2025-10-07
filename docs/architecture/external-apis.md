# External APIs

## SendGrid Inbound Parse API

- **Purpose:** Receive and parse incoming emails
- **Documentation (ALWAYS USE CONTEXT7 MCP):** https://docs.sendgrid.com/for-developers/parsing-email/inbound-email
- **Base URL(s):** Webhook receiver (our Edge Function URL)
- **Authentication:** HMAC signature verification (webhook sends signature in headers)
- **Rate Limits:** No explicit limit (webhook-based, SendGrid controls delivery)

**Key Endpoints Used:**
- N/A (inbound webhook - SendGrid calls our endpoint)

**Integration Notes:**
- Requires MX record configuration pointing to `mx.sendgrid.net`
- Webhook sends multipart/form-data with email content
- Includes headers for email threading (Message-ID, In-Reply-To, References)
- Maximum email size: 30MB
- Must respond with 2xx status within 30 seconds to avoid retry

## SendGrid Send API

- **Purpose:** Send email responses to users
- **Documentation (ALWAYS USE CONTEXT7 MCP):** https://docs.sendgrid.com/api-reference/mail-send/mail-send
- **Base URL(s):** `https://api.sendgrid.com/v3/mail/send`
- **Authentication:** Bearer token (API key in Authorization header)
- **Rate Limits:** Varies by plan (free tier: 100 emails/day)

**Key Endpoints Used:**
- `POST /v3/mail/send` - Send email with custom headers

**Integration Notes:**
- Requires verified sender domain
- Supports custom headers for email threading (In-Reply-To, References)
- Returns 202 Accepted on success
- Retry on 5xx errors only
- API key stored in Supabase Secrets as `SENDGRID_API_KEY`

## OpenAI API

- **Purpose:** Generate intelligent email responses using LLM
- **Documentation (ALWAYS USE CONTEXT7 MCP):** https://platform.openai.com/docs/api-reference/chat
- **Base URL(s):** `https://api.openai.com/v1/chat/completions`
- **Authentication:** Bearer token (API key in Authorization header)
- **Rate Limits:** Varies by tier (free tier: 3 requests/minute, 200 requests/day)

**Key Endpoints Used:**
- `POST /v1/chat/completions` - Generate chat completion

**Integration Notes:**
- Use `gpt-4` or `gpt-3.5-turbo` model (configurable via env var)
- System message: "You are a helpful email assistant. Respond professionally and concisely."
- Max tokens: 1000 (response), 4000 (input)
- Temperature: 0.7
- Timeout: 30 seconds
- Retry on 429 (rate limit) and 5xx errors
- API key stored in Supabase Secrets as `OPENAI_API_KEY`

---
