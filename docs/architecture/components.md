# Components

## Email Webhook Handler

**Responsibility:** Primary Edge Function that receives SendGrid webhooks, orchestrates LLM processing, and sends email responses.

**Key Interfaces:**
- HTTP POST endpoint: `/email-webhook` (public, receives SendGrid webhooks)
- Responds with HTTP status codes: 200 (success), 400 (bad request), 401/403 (auth failures)

**Dependencies:**
- External: SendGrid Inbound Parse (webhook source)
- External: OpenAI API (LLM processing)
- External: SendGrid Send API (email delivery)
- Internal: Supabase Secrets (API keys)

**Technology Stack:**
- Deno runtime
- TypeScript
- Native fetch API for HTTP requests
- Crypto module for HMAC verification

**Internal Structure:**
```
email-webhook/
├── index.ts              # Main handler entry point
├── webhookVerifier.ts    # SendGrid signature verification
├── emailParser.ts        # Parse SendGrid payload
├── llmClient.ts          # OpenAI API integration
├── emailSender.ts        # SendGrid Send API integration
├── logger.ts             # Structured logging utilities
├── retryLogic.ts         # Exponential backoff retry handler
└── types.ts              # TypeScript interfaces
```

## Component Diagram

```mermaid
graph TD
    Webhook[SendGrid Webhook] -->|POST /email-webhook| Handler[Main Handler<br/>index.ts]
    Handler --> Verifier[Webhook Verifier<br/>webhookVerifier.ts]
    Verifier -->|Valid| Parser[Email Parser<br/>emailParser.ts]
    Verifier -->|Invalid| Reject[Return 403]

    Parser --> LLM[LLM Client<br/>llmClient.ts]
    LLM -->|With Retry| OpenAI[OpenAI API]
    OpenAI --> LLM

    LLM --> Sender[Email Sender<br/>emailSender.ts]
    Sender -->|With Retry| SendGrid[SendGrid API]
    SendGrid --> Sender

    Handler --> Logger[Logger<br/>logger.ts]
    Sender --> Logger
    LLM --> Logger

    style Handler fill:#4F46E5
    style Verifier fill:#10B981
    style LLM fill:#F59E0B
    style Sender fill:#EC4899
```

---
