# Requirements

## Functional

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

## Non Functional

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
