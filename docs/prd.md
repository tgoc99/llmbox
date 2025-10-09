# Email-to-LLM Chat Service Product Requirements Document (PRD)

## Goals and Background Context

### Goals

1. **Enable conversational AI via email** - Users can interact with an LLM without leaving their
   inbox
2. **Seamless integration** - No app downloads, no new platforms to learn
3. **Rapid MVP deployment** - Minimal infrastructure, stateless architecture
4. **Future scalability** - Architecture supports conversation history and multi-user features

### Background Context

Email remains the most ubiquitous communication platform, yet accessing LLM capabilities typically
requires switching to web apps or specialized interfaces. This service bridges that gap by bringing
LLM conversations directly into the user's inbox.

The MVP focuses on **proof of concept**: demonstrating reliable email-to-LLM-to-email flow without
persistence complexity. Post-MVP will add conversation threading and history storage via Supabase
database.

### Change Log

| Date       | Version | Description | Author          |
| ---------- | ------- | ----------- | --------------- |
| 2025-01-07 | 1.0     | Initial PRD | PM Agent (John) |

---

## Requirements

### Functional

**FR1**: The system receives incoming emails via SendGrid Inbound Parse webhook

- Webhook endpoint accepts POST requests from SendGrid
- Validates webhook authenticity (SendGrid signature)

**FR2**: The system extracts plain text email content and sender information

- Parses email body (plain text only)
- Extracts sender email address
- Extracts subject line
- Extracts message-id and references headers for threading

**FR3**: The system sends email content to OpenAI API for processing

- Formats email content as LLM prompt
- Calls OpenAI API (GPT-4 or specified model)
- Handles API response

**FR4**: The system generates an email response from LLM output

- Formats LLM response as email body
- Maintains email thread (uses In-Reply-To and References headers)
- Sets appropriate subject line (Re: original subject)

**FR5**: The system sends response email via SendGrid

- Uses SendGrid API to send email
- Sets from address to service email address
- Sends to original sender's email address

**FR6**: The system handles errors gracefully

- Returns appropriate error responses to SendGrid webhook
- Logs errors for debugging
- Does not expose API keys or sensitive data in error messages

### Non Functional

**NFR1**: Response time target of under 30 seconds for complete email-to-response cycle

- Webhook processing: < 2 seconds
- LLM API call: < 20 seconds (depends on OpenAI)
- Email sending: < 5 seconds

**NFR2**: The system operates within Supabase free tier limits where feasible

- Edge Functions: 500K invocations/month
- Edge Functions: 400K GB-seconds compute/month

**NFR3**: API credentials are securely stored and accessed

- OpenAI API key stored in Supabase secrets/environment variables
- SendGrid API key stored in Supabase secrets/environment variables
- No credentials in source code

**NFR4**: The system is stateless for MVP

- No database reads or writes
- Each email processed independently
- No user authentication required

**NFR5**: The system handles concurrent requests

- Multiple emails can be processed simultaneously
- Edge Functions scale automatically

---

## Technical Assumptions

### Repository Structure: Monorepo

- Single repository for Edge Functions and future features
- Simple structure for MVP (single function)

### Service Architecture: Serverless (Supabase Edge Functions)

- Stateless Edge Functions handle webhook requests
- Auto-scaling, pay-per-use model
- No persistent server management required

### Testing Requirements: Unit + Integration Tests

- Unit tests for email parsing logic
- Unit tests for LLM prompt formatting
- Integration tests for SendGrid webhook handling
- Integration tests for OpenAI API calls
- Manual testing for end-to-end email flow

### Core Technologies

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

### Additional Technical Assumptions and Requests

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

## Epic List

**Epic 1: Foundation & Core Email-LLM Pipeline** Establish project infrastructure, SendGrid webhook
integration, OpenAI API integration, and basic email response flow - delivering the complete
end-to-end MVP functionality.

**Epic 2: Production Reliability & Security** Add robust error handling, email threading support,
SendGrid webhook signature verification, comprehensive logging, and production-ready monitoring -
making the service secure and reliable.

---

## Epic 1: Foundation & Core Email-LLM Pipeline

**Epic Goal**: Establish project infrastructure, SendGrid webhook integration, OpenAI API
integration, and basic email response flow to deliver a working end-to-end MVP where users can email
the service and receive LLM-generated responses.

### Story 1.1: Project Setup and Infrastructure

**As a** developer, **I want** the project scaffolding and Supabase Edge Functions setup completed,
**so that** I have a working local development environment and can deploy to Supabase.

#### Acceptance Criteria

1. Project repository initialized with TypeScript configuration for Deno/Supabase Edge Functions
2. Supabase CLI installed and configured for local development
3. Environment variables template created (.env.example) with placeholders for SENDGRID_API_KEY,
   OPENAI_API_KEY
4. Basic Edge Function created at `supabase/functions/email-webhook/index.ts` that responds with 200
   OK
5. Local development server starts successfully using `supabase functions serve`
6. Test deployment to Supabase succeeds and function is accessible via public URL
7. README.md includes setup instructions and deployment commands
8. Git repository with initial commit and .gitignore configured

### Story 1.2: SendGrid Inbound Webhook Endpoint

**As a** user, **I want** the system to receive my emails via SendGrid webhook, **so that** my email
content can be processed by the service.

#### Acceptance Criteria

1. Edge Function endpoint accepts POST requests from SendGrid Inbound Parse webhook
2. Function parses multipart/form-data payload from SendGrid
3. Function extracts the following fields from webhook payload:
   - `from` (sender email address)
   - `subject` (email subject line)
   - `text` (plain text email body)
   - `to` (recipient email address)
   - `headers` (for Message-ID extraction)
4. Function returns 200 OK response to SendGrid within 2 seconds
5. Function logs received email data (sender, subject, body preview) for debugging
6. Function handles malformed payloads and returns 400 Bad Request with error message
7. Manual test: Sending email to configured address triggers function and logs appear in Supabase
   logs
8. SendGrid Inbound Parse configured with subdomain MX record pointing to mx.sendgrid.net

### Story 1.3: OpenAI API Integration

**As a** developer, **I want** to integrate OpenAI API for LLM completions, **so that** the system
can generate intelligent responses to user emails.

#### Acceptance Criteria

1. OpenAI API client configured with API key from environment variables
2. Function creates prompt from email content with format:
   `"Respond to this email:\n\nFrom: {sender}\nSubject: {subject}\n\n{body}"`
3. Function calls OpenAI Chat Completions API (gpt-4 or gpt-3.5-turbo model)
4. API request includes:
   - System message: "You are a helpful email assistant. Respond professionally and concisely."
   - User message: formatted prompt from email content
   - max_tokens: 1000
   - temperature: 0.7
5. Function receives and parses LLM response successfully
6. Function extracts text content from API response
7. Function handles OpenAI API errors (rate limits, timeouts, invalid responses) and logs them
8. Unit test: Mock OpenAI API call returns expected response format
9. Integration test: Real API call with test email content generates reasonable response

### Story 1.4: SendGrid Outbound Email Response

**As a** user, **I want** to receive LLM-generated email responses in my inbox, **so that** I can
continue the conversation via email.

#### Acceptance Criteria

1. SendGrid Send API client configured with API key from environment variables
2. Function formats email response with:
   - `from`: Service email address (e.g., `assistant@mail.llmbox.pro`)
   - `to`: Original sender's email address
   - `subject`: `Re: {original subject}`
   - `text`: LLM-generated response content
3. Function sends email via SendGrid API
4. Function receives and validates SendGrid API response (202 Accepted)
5. Function handles SendGrid API errors and logs them appropriately
6. Function completes entire flow: receive webhook → call LLM → send email → return 200 to SendGrid
7. Manual test: End-to-end flow completes in under 30 seconds
8. Manual test: User receives email response in their inbox with LLM content
9. Unit test: Email formatting function creates correct SendGrid payload structure

### Story 1.5: Basic Error Handling and Logging

**As a** developer, **I want** comprehensive error handling and logging, **so that** I can debug
issues and understand system behavior.

#### Acceptance Criteria

1. All API calls (OpenAI, SendGrid) wrapped in try-catch blocks
2. Function logs the following events with timestamps:
   - Webhook received (sender, subject)
   - OpenAI API call started
   - OpenAI API response received (token count)
   - SendGrid email send started
   - SendGrid email sent successfully
   - Errors at each step
3. OpenAI API failures: Log error, send fallback email to user ("Sorry, I'm having trouble
   responding right now")
4. SendGrid API failures: Log error, still return 200 to SendGrid webhook (prevents retry loop)
5. Invalid webhook payload: Log warning, return 400 to SendGrid
6. Function execution timeout: Logs indicate where timeout occurred
7. All logs visible in Supabase Dashboard logs viewer
8. Error emails to users are clearly formatted with service contact info if needed

---

## Epic 2: Production Reliability & Security

**Epic Goal**: Add robust error handling, email threading support, SendGrid webhook signature
verification, comprehensive logging, and production-ready monitoring to make the service secure,
reliable, and ready for real-world use.

### Story 2.1: SendGrid Webhook Signature Verification

**As a** system administrator, **I want** SendGrid webhook requests to be cryptographically
verified, **so that** only legitimate requests from SendGrid are processed and malicious requests
are rejected.

#### Acceptance Criteria

1. Function extracts `X-Twilio-Email-Event-Webhook-Signature` header from incoming requests
2. Function extracts `X-Twilio-Email-Event-Webhook-Timestamp` header from incoming requests
3. Function retrieves SendGrid webhook verification key from environment variables
   (`SENDGRID_WEBHOOK_VERIFICATION_KEY`)
4. Function generates expected signature using HMAC-SHA256 with:
   - Key: verification key from SendGrid
   - Data: timestamp + request body
5. Function compares generated signature with received signature (constant-time comparison)
6. Valid signature: Request processed normally
7. Invalid signature: Return 403 Forbidden, log security warning with source IP
8. Missing signature headers: Return 401 Unauthorized, log warning
9. Timestamp validation: Reject requests older than 10 minutes (prevents replay attacks)
10. Unit test: Valid signature passes verification
11. Unit test: Invalid signature fails verification
12. Manual test: Requests from SendGrid dashboard pass verification

### Story 2.2: Email Threading Support

**As a** user, **I want** my email conversations to be properly threaded, **so that** my email
client groups the conversation and I can follow the context.

#### Acceptance Criteria

1. Function extracts `Message-ID` header from incoming email webhook payload
2. Function extracts `In-Reply-To` header from incoming email (if present, indicates reply to
   previous message)
3. Function extracts `References` header from incoming email (full thread history)
4. Response email includes:
   - `In-Reply-To` header: Set to original email's Message-ID
   - `References` header: Appends original Message-ID to existing References chain
5. SendGrid API payload correctly formatted with custom headers object
6. Email threading works in major email clients (Gmail, Outlook web, Apple Mail)
7. Unit test: Headers extracted correctly from webhook payload
8. Unit test: Response headers formatted correctly for SendGrid API
9. Manual test: Reply chain visible in email client after 3+ exchanges
10. Manual test: Email client shows conversation as single thread, not separate emails

### Story 2.3: Enhanced Error Handling and User Communication

**As a** user, **I want** clear error messages when something goes wrong, **so that** I understand
what happened and can take appropriate action.

#### Acceptance Criteria

1. OpenAI API timeout (>30s): Send email to user with message "I'm taking longer than usual to
   respond. Please try again in a few minutes."
2. OpenAI API rate limit error: Send email with "I'm experiencing high demand. Please try again in a
   few minutes."
3. OpenAI API invalid API key: Log critical error, send generic error email to user, alert admin
   (log ERROR level)
4. SendGrid API quota exceeded: Log critical error, do not retry (prevents loop)
5. SendGrid API invalid API key: Log critical error with detailed message
6. Malformed email payload (missing required fields): Log warning with details, return 400 to
   SendGrid
7. All error emails maintain proper email threading (In-Reply-To headers)
8. Error emails are professionally worded and include service name
9. Function never returns 5xx errors to SendGrid webhook (prevents retry storm)
10. All errors logged with structured data: error type, error message, timestamp, context (sender,
    subject)
11. Unit test: Each error type generates appropriate user email and log entry

### Story 2.4: Retry Logic and Idempotency

**As a** system, **I want** resilient API call handling with retries, **so that** transient failures
don't cause user-facing errors.

#### Acceptance Criteria

1. OpenAI API calls wrapped in retry logic with exponential backoff
2. Retry configuration: 3 attempts, delays of 1s, 2s, 4s
3. Retry only on transient errors: 429 (rate limit), 500, 502, 503, 504
4. Do not retry on: 400 (bad request), 401 (auth error), 403 (forbidden)
5. SendGrid API calls wrapped in retry logic (same configuration as OpenAI)
6. Each retry attempt logged with attempt number
7. After all retries exhausted: Log final failure, send error email to user
8. Function tracks processed Message-IDs to prevent duplicate processing (in-memory for MVP)
9. If duplicate Message-ID received within 10 minutes: Return 200 OK but skip processing, log
   "Duplicate request ignored"
10. Unit test: Retry logic attempts correct number of times with correct delays
11. Integration test: Transient API failure recovers on retry

### Story 2.5: Production Monitoring and Observability

**As a** developer, **I want** comprehensive monitoring and structured logging, **so that** I can
track system health, debug issues quickly, and identify performance bottlenecks.

#### Acceptance Criteria

1. All logs use structured JSON format with consistent fields:
   - `timestamp`: ISO 8601 format
   - `level`: DEBUG, INFO, WARN, ERROR, CRITICAL
   - `event`: Event name (e.g., "webhook_received", "openai_api_called")
   - `context`: Relevant data (sender, subject, message_id, duration_ms)
2. Function tracks and logs execution duration for each step:
   - Webhook parsing duration
   - OpenAI API call duration
   - SendGrid API call duration
   - Total request duration
3. Function logs success metrics:
   - Successful email processing count
   - Average OpenAI response time
   - Average end-to-end processing time
4. Function logs error metrics by type:
   - OpenAI API errors (by error type)
   - SendGrid API errors (by error type)
   - Webhook validation failures
5. Logs include correlation ID (Message-ID) for tracing full request lifecycle
6. Environment variable `LOG_LEVEL` controls logging verbosity (default: INFO)
7. Critical errors (API key issues, quota exceeded) logged at CRITICAL level
8. Performance threshold warnings: Log WARN if total processing >25 seconds
9. All logs queryable in Supabase Dashboard with timestamp and level filters
10. README includes section on monitoring and log analysis
11. README includes example log queries for common debugging scenarios
