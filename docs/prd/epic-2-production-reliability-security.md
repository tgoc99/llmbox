# Epic 2: Production Reliability & Security

**Epic Goal**: Add robust error handling, email threading support, SendGrid webhook signature verification, comprehensive logging, and production-ready monitoring to make the service secure, reliable, and ready for real-world use.

## Story 2.1: SendGrid Webhook Signature Verification

**As a** system administrator,
**I want** SendGrid webhook requests to be cryptographically verified,
**so that** only legitimate requests from SendGrid are processed and malicious requests are rejected.

### Acceptance Criteria

1. Function extracts `X-Twilio-Email-Event-Webhook-Signature` header from incoming requests
2. Function extracts `X-Twilio-Email-Event-Webhook-Timestamp` header from incoming requests
3. Function retrieves SendGrid webhook verification key from environment variables (`SENDGRID_WEBHOOK_VERIFICATION_KEY`)
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

## Story 2.2: Email Threading Support

**As a** user,
**I want** my email conversations to be properly threaded,
**so that** my email client groups the conversation and I can follow the context.

### Acceptance Criteria

1. Function extracts `Message-ID` header from incoming email webhook payload
2. Function extracts `In-Reply-To` header from incoming email (if present, indicates reply to previous message)
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

## Story 2.3: Enhanced Error Handling and User Communication

**As a** user,
**I want** clear error messages when something goes wrong,
**so that** I understand what happened and can take appropriate action.

### Acceptance Criteria

1. OpenAI API timeout (>30s): Send email to user with message "I'm taking longer than usual to respond. Please try again in a few minutes."
2. OpenAI API rate limit error: Send email with "I'm experiencing high demand. Please try again in a few minutes."
3. OpenAI API invalid API key: Log critical error, send generic error email to user, alert admin (log ERROR level)
4. SendGrid API quota exceeded: Log critical error, do not retry (prevents loop)
5. SendGrid API invalid API key: Log critical error with detailed message
6. Malformed email payload (missing required fields): Log warning with details, return 400 to SendGrid
7. All error emails maintain proper email threading (In-Reply-To headers)
8. Error emails are professionally worded and include service name
9. Function never returns 5xx errors to SendGrid webhook (prevents retry storm)
10. All errors logged with structured data: error type, error message, timestamp, context (sender, subject)
11. Unit test: Each error type generates appropriate user email and log entry

## Story 2.4: Retry Logic and Idempotency

**As a** system,
**I want** resilient API call handling with retries,
**so that** transient failures don't cause user-facing errors.

### Acceptance Criteria

1. OpenAI API calls wrapped in retry logic with exponential backoff
2. Retry configuration: 3 attempts, delays of 1s, 2s, 4s
3. Retry only on transient errors: 429 (rate limit), 500, 502, 503, 504
4. Do not retry on: 400 (bad request), 401 (auth error), 403 (forbidden)
5. SendGrid API calls wrapped in retry logic (same configuration as OpenAI)
6. Each retry attempt logged with attempt number
7. After all retries exhausted: Log final failure, send error email to user
8. Function tracks processed Message-IDs to prevent duplicate processing (in-memory for MVP)
9. If duplicate Message-ID received within 10 minutes: Return 200 OK but skip processing, log "Duplicate request ignored"
10. Unit test: Retry logic attempts correct number of times with correct delays
11. Integration test: Transient API failure recovers on retry

## Story 2.5: Production Monitoring and Observability

**As a** developer,
**I want** comprehensive monitoring and structured logging,
**so that** I can track system health, debug issues quickly, and identify performance bottlenecks.

### Acceptance Criteria

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
