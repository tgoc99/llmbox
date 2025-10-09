# Epic 1: Foundation & Core Email-LLM Pipeline

**Epic Goal**: Establish project infrastructure, SendGrid webhook integration, OpenAI API
integration, and basic email response flow to deliver a working end-to-end MVP where users can email
the service and receive LLM-generated responses.

## Story 1.1: Project Setup and Infrastructure

**As a** developer, **I want** the project scaffolding and Supabase Edge Functions setup completed,
**so that** I have a working local development environment and can deploy to Supabase.

### Acceptance Criteria

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

## Story 1.2: SendGrid Inbound Webhook Endpoint

**As a** user, **I want** the system to receive my emails via SendGrid webhook, **so that** my email
content can be processed by the service.

### Acceptance Criteria

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

## Story 1.3: OpenAI API Integration

**As a** developer, **I want** to integrate OpenAI API for LLM completions, **so that** the system
can generate intelligent responses to user emails.

### Acceptance Criteria

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

## Story 1.4: SendGrid Outbound Email Response

**As a** user, **I want** to receive LLM-generated email responses in my inbox, **so that** I can
continue the conversation via email.

### Acceptance Criteria

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

## Story 1.5: Basic Error Handling and Logging

**As a** developer, **I want** comprehensive error handling and logging, **so that** I can debug
issues and understand system behavior.

### Acceptance Criteria

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
