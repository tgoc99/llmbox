# Email-to-LLM Chat Service

A serverless email-based chat service that receives emails via SendGrid, generates intelligent responses using OpenAI's LLM, and sends replies back to users.

## Overview

This service allows users to interact with an AI assistant via email. Users send emails to a configured address, the system processes the email content through OpenAI's GPT models, and sends an intelligent response back to the user's inbox.

**Key Features:**
- Receive emails via SendGrid Inbound Parse webhook
- Generate intelligent responses using OpenAI API (GPT-3.5-turbo or GPT-4)
- Send responses via SendGrid Send API
- Email threading support (maintains conversation context)
- Comprehensive error handling and logging
- Serverless architecture using Supabase Edge Functions

## Prerequisites

- **Deno** - Latest version (managed by Supabase Edge Functions)
- **Git** - Version 2.x+ for version control
- **Supabase Account** - Free tier available at [supabase.com](https://supabase.com)
- **SendGrid Account** - Free tier available at [sendgrid.com](https://sendgrid.com)
- **OpenAI Account** - API key required from [platform.openai.com](https://platform.openai.com)

## Project Structure

```
llmbox/
├── supabase/
│   └── functions/
│       └── email-webhook/
│           └── index.ts              # Main Edge Function handler
├── tests/
│   ├── unit/                         # Unit tests
│   └── integration/                  # Integration tests
├── web/                              # Next.js landing page
│   ├── app/                          # Next.js App Router
│   ├── components/                   # React components
│   ├── public/                       # Static assets
│   └── package.json                  # Web dependencies
├── docs/
│   ├── prd.md                        # Product Requirements Document
│   ├── architecture.md               # Architecture documentation
│   └── WEB-DEPLOYMENT.md             # Web deployment guide
├── .gitignore                        # Git ignore file
├── .env.example                      # Environment variables template
├── deno.json                         # Deno configuration & tasks
└── README.md                         # This file
```

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd llmbox
```

### 2. Environment Variables

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# SendGrid API Keys
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_WEBHOOK_VERIFICATION_KEY=your_verification_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Service Configuration
SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com

# Logging Configuration
LOG_LEVEL=INFO
```

### 3. Supabase Setup

This project uses Supabase Edge Functions for serverless deployment.

**Project Information:**
- **Project URL:** https://nopocimtfthppwssohty.supabase.co
- **Project ID:** nopocimtfthppwssohty
- **Region:** us-east-2

**Edge Function URL:**
```
https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

### 4. SendGrid Configuration

#### A. Obtain SendGrid API Key

1. Log in to [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to Settings → API Keys
3. Create a new API key with "Full Access" or "Mail Send" permissions
4. Copy the API key and add it to your `.env.local` file

#### B. Configure Sender Domain (Required for Production)

1. Navigate to Settings → Sender Authentication
2. Choose "Domain Authentication" or "Single Sender Verification"
3. Follow DNS setup instructions
4. Wait for verification (may take 24-48 hours)
5. Use verified email address as `SERVICE_EMAIL_ADDRESS`

#### C. Configure Inbound Parse (To receive emails)

1. Navigate to Settings → Inbound Parse
2. Add your subdomain (e.g., `email.yourdomain.com`)
3. Configure MX record to point to `mx.sendgrid.net`
4. Set webhook URL to: `https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook`
5. Wait for DNS propagation (may take up to 48 hours)

### 5. OpenAI Configuration

1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys
3. Create a new API key
4. Copy the API key and add it to your `.env.local` file
5. Choose your model:
   - `gpt-3.5-turbo` - Faster, more cost-effective (recommended for MVP)
   - `gpt-4` - Higher quality, slower, more expensive

## Local Development

### Testing the Function Locally

The basic Edge Function is deployed and can be tested:

```bash
# Test with curl
curl https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

Expected response: `OK` with status 200

### Viewing Logs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select the llmbox project
3. Navigate to Edge Functions
4. Click on "email-webhook"
5. View logs in real-time

## Deployment

The Edge Function code is complete and ready to deploy. However, **external configuration is required** before the service will work.

### 📚 Deployment Guides

Choose the guide that fits your needs:

1. **[QUICK-START.md](QUICK-START.md)** - 🚀 Deploy in 5 minutes (if you have API keys)
2. **[WHAT-YOU-NEED-TO-DO.md](docs/WHAT-YOU-NEED-TO-DO.md)** - Complete overview of external setup
3. **[DEPLOYMENT-QUICK-START.md](docs/DEPLOYMENT-QUICK-START.md)** - Quick reference guide
4. **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Detailed deployment guide with troubleshooting
5. **[SCRIPTS.md](docs/SCRIPTS.md)** - Complete scripts/tasks reference

### Quick Summary

**What's already done:**
- ✅ Edge Function code (deployed to Supabase)
- ✅ Error handling and logging
- ✅ Tests and documentation

**What you need to do:**
1. ☐ SendGrid: Get API key, verify sender, configure inbound parse
2. ☐ OpenAI: Get API key, add billing
3. ☐ DNS: Add MX record for receiving emails
4. ☐ Supabase: Set secrets (API keys)
5. ☐ Wait for DNS propagation (24-48 hours)
6. ☐ Test with real email

**Total Time:** 30 minutes + 24-48 hours (DNS propagation)

### Redeploy After Changes

```bash
# Using Deno tasks (recommended - easiest)
deno task deploy

# Or using Supabase MCP tools
# The deployment will be handled through the Supabase MCP server

# Or manually using Supabase CLI
supabase functions deploy email-webhook --project-ref nopocimtfthppwssohty
```

### 🚀 Available Scripts

Run any task with `deno task <task-name>`:

```bash
# Deployment
deno task deploy          # Deploy to Supabase
deno task logs            # View logs
deno task logs:tail       # Live tail logs

# Testing
deno task test            # Run all tests
deno task test:unit       # Unit tests only
deno task test:webhook    # Test with sample webhook data
deno task test:endpoint   # Quick health check

# Code Quality
deno task fmt             # Format code
deno task lint            # Lint code
deno task check:all       # Run all checks + tests (before commit!)

# Web App
deno task web:install     # Install web dependencies
deno task web:dev         # Run web dev server (http://localhost:3000)
deno task web:build       # Build web for production
deno task web:start       # Start production web server

# Secrets
deno task secrets:list    # List configured secrets
deno task secrets:set:key KEY=value # Set a secret
```

**📚 Full scripts reference:** [docs/SCRIPTS.md](docs/SCRIPTS.md)

### Quick Start with Scripts

```bash
# 1. Set your secrets (one time setup)
deno task secrets:set:key SENDGRID_API_KEY=SG.your-key-here
deno task secrets:set:key OPENAI_API_KEY=sk-proj-your-key-here
deno task secrets:set:key SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com
deno task secrets:set:key OPENAI_MODEL=gpt-3.5-turbo

# 2. Verify secrets are set
deno task secrets:list

# 3. Deploy
deno task deploy

# 4. Test it's working
deno task test:endpoint
deno task test:webhook

# 5. Watch logs in real-time
deno task logs:tail
```

### Setting Secrets in Production

Use Deno tasks (recommended) or Supabase Dashboard/CLI to set environment variables:

```bash
# Via CLI (if installed)
supabase secrets set SENDGRID_API_KEY=your_key_here --project-ref nopocimtfthppwssohty
supabase secrets set OPENAI_API_KEY=your_key_here --project-ref nopocimtfthppwssohty
supabase secrets set SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com --project-ref nopocimtfthppwssohty
```

Or via Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Click "Environment Variables"
3. Add each secret

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENDGRID_API_KEY` | Yes | - | SendGrid API key for sending emails |
| `SENDGRID_WEBHOOK_VERIFICATION_KEY` | No | - | Webhook signature verification (Epic 2) |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for LLM processing |
| `OPENAI_MODEL` | No | `gpt-3.5-turbo` | Model to use (gpt-3.5-turbo or gpt-4) |
| `SERVICE_EMAIL_ADDRESS` | Yes | - | From address for outbound emails |
| `LOG_LEVEL` | No | `INFO` | Logging verbosity (DEBUG, INFO, WARN, ERROR, CRITICAL) |

## Testing

### Manual Testing

1. **Test Basic Function:**
   ```bash
   curl https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
   ```

2. **Test with Email (After SendGrid setup):**
   - Send an email to your configured address (e.g., anything@email.yourdomain.com)
   - Check Supabase logs for processing
   - Verify response email received in inbox

### Automated Testing

Unit and integration tests will be added in subsequent stories:

```bash
# Run unit tests (Story 1.2+)
deno test tests/unit/ --allow-all

# Run integration tests (Story 1.3+)
deno test tests/integration/ --allow-all --allow-env

# Run all tests with coverage
deno test --allow-all --coverage=coverage
```

## Troubleshooting

### Common Issues

**1. Edge Function returns 200 but no email received**
- Check Supabase logs for errors
- Verify SendGrid API key is set correctly
- Verify sender domain is verified in SendGrid
- Check OpenAI API key is valid

**2. SendGrid webhook not triggering**
- Verify MX record is configured correctly
- Check DNS propagation (may take 24-48 hours)
- Verify webhook URL is correct in SendGrid dashboard
- Check SendGrid Event Webhook logs

**3. OpenAI API errors**
- Verify API key is valid
- Check API usage limits
- Review rate limits for your tier
- Check logs for specific error messages

**4. Deployment issues**
- Verify Supabase project ID is correct
- Check that you have deployment permissions
- Review Edge Function logs for errors

## Monitoring and Debugging

### Log Structure and Format

All logs are output as structured JSON with the following format:

```json
{
  "timestamp": "2025-01-07T10:30:45.123Z",
  "level": "INFO",
  "event": "webhook_received",
  "context": {
    "messageId": "CAF=abc123@mail.gmail.com",
    "from": "user@example.com",
    "subject": "Hello",
    "bodyPreview": "Hello, how are you...",
    "hasInReplyTo": false,
    "referencesCount": 0
  }
}
```

### Log Levels

| Level | Description | When to Use |
|-------|-------------|-------------|
| `DEBUG` | Detailed debugging information | Development only, not in production |
| `INFO` | Normal operational events | Webhook received, API calls, emails sent |
| `WARN` | Warning conditions | Rate limits, slow operations, validation issues |
| `ERROR` | Error conditions that are handled | API failures, send failures |
| `CRITICAL` | Critical issues requiring immediate attention | Invalid API keys, quota exceeded |

### Accessing Logs in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** → **email-webhook**
4. Click the **Logs** tab
5. View real-time logs with filters

### Log Event Types

**Normal Flow Events:**
- `webhook_received` - Email webhook received from SendGrid
- `email_parsed` - Email successfully parsed
- `openai_call_started` - OpenAI API call initiated
- `openai_response_received` - OpenAI response received
- `sendgrid_send_started` - Email send initiated
- `sendgrid_send_completed` - Email sent successfully
- `email_sent` - Email delivery confirmed
- `processing_completed` - Full flow completed

**Error Events:**
- `validation_error` - Invalid webhook payload
- `openai_rate_limit` - OpenAI rate limit hit
- `openai_timeout` - OpenAI request timed out
- `openai_auth_error` - OpenAI authentication failed (CRITICAL)
- `openai_error` - Other OpenAI errors
- `sendgrid_rate_limit` - SendGrid rate limit hit
- `sendgrid_auth_error` - SendGrid authentication failed (CRITICAL)
- `sendgrid_bad_request` - Malformed SendGrid request
- `sendgrid_server_error` - SendGrid server error
- `sendgrid_send_failed` - Email send failed
- `error_email_sent` - Error notification sent to user
- `unexpected_error` - Unexpected internal error

**Performance Events:**
- `slow_webhook_parsing` - Parsing took > 2 seconds
- `slow_openai_call` - OpenAI call took > 20 seconds
- `slow_email_send` - Email send took > 5 seconds
- `slow_total_processing` - Total processing took > 25 seconds

### Using Correlation IDs for Tracing

Every log entry includes a `messageId` field that serves as a correlation ID. Use this to trace a request through the entire lifecycle:

**Example Query in Supabase Logs:**
```
messageId: "CAF=abc123@mail.gmail.com"
```

This will show all events related to that specific email:
1. webhook_received
2. email_parsed
3. openai_call_started
4. openai_response_received
5. sendgrid_send_started
6. sendgrid_send_completed
7. processing_completed

### Common Debugging Scenarios

#### Scenario 1: Email Not Received

**Check logs for:**
- `webhook_received` - Was webhook triggered?
- `email_parsed` - Was email parsed successfully?
- `openai_response_received` - Was LLM response generated?
- `sendgrid_send_completed` - Was email sent?

**Filter by log level:**
- Set filter to `ERROR` or `CRITICAL` to see failures

#### Scenario 2: Slow Response Times

**Check logs for:**
- `slow_webhook_parsing` - Parsing taking too long?
- `slow_openai_call` - OpenAI API slow? (may need to switch models)
- `slow_email_send` - SendGrid slow?
- `slow_total_processing` - Overall performance issue?

**Look at timing in `processing_completed` event:**
```json
{
  "event": "processing_completed",
  "context": {
    "totalProcessingTimeMs": 28000,
    "parsingTimeMs": 1200,
    "llmTimeMs": 22000,
    "emailSendTimeMs": 3500
  }
}
```

#### Scenario 3: OpenAI Errors

**Check for these events:**
- `openai_rate_limit` - Rate limit hit (WARN level)
- `openai_timeout` - Request timed out (WARN level)
- `openai_auth_error` - Invalid API key (CRITICAL level)
- `openai_error` - Other errors (ERROR level)

**User receives error email?**
- Check for `error_email_sent` event
- Error emails are sent for most OpenAI failures

#### Scenario 4: SendGrid Errors

**Check for these events:**
- `sendgrid_rate_limit` - Rate limit hit
- `sendgrid_auth_error` - Invalid API key (CRITICAL)
- `sendgrid_bad_request` - Malformed request
- `sendgrid_server_error` - SendGrid server issue

**Note:** No error email sent to user for SendGrid failures (prevents email loop)

### Performance Monitoring

**Target Metrics:**
- **Total processing time:** < 30 seconds
- **Webhook parsing:** < 2 seconds
- **LLM API call:** < 20 seconds
- **Email sending:** < 5 seconds

**Performance warnings are logged when thresholds exceeded.**

### Log Filtering Examples

**Find all errors for a specific email:**
```
messageId: "your-message-id" AND level: ERROR
```

**Find all rate limit issues:**
```
event: *rate_limit*
```

**Find all critical issues:**
```
level: CRITICAL
```

**Find slow operations:**
```
event: slow_*
```

### Log Retention

- **Supabase Free Tier:** 7 days (typical)
- **Supabase Paid Tier:** Extended retention based on plan
- For long-term storage, consider exporting to external logging service

### Troubleshooting Guide

| Symptom | Check Logs For | Solution |
|---------|----------------|----------|
| No webhook triggered | `webhook_received` missing | Check SendGrid Inbound Parse config, verify MX records |
| Parsing fails | `validation_error` | Check SendGrid webhook payload format |
| No LLM response | `openai_auth_error` or `openai_error` | Verify OPENAI_API_KEY is valid |
| No email sent | `sendgrid_auth_error` or `sendgrid_send_failed` | Verify SENDGRID_API_KEY and sender domain |
| Slow performance | `slow_*` events | Check OpenAI model (switch to gpt-3.5-turbo), check API status |
| Rate limits hit | `*_rate_limit` events | Upgrade API plan or implement request throttling |

## Architecture

For detailed architecture documentation, see:
- [Product Requirements Document](docs/prd.md)
- [Architecture Documentation](docs/architecture.md)
- [Epic 1: Foundation & Core Email-LLM Pipeline](docs/prd/epic-1-foundation-core-email-llm-pipeline.md)

## Complete Setup Guide

### Step-by-Step Setup

#### 1. Obtain SendGrid API Key

1. Sign up or log in at [SendGrid](https://sendgrid.com)
2. Navigate to **Settings → API Keys**
3. Click **Create API Key**
4. Name: "Email-LLM Service"
5. Permissions: Select **Full Access** or **Mail Send**
6. Click **Create & View**
7. **Copy the API key immediately** (it won't be shown again)
8. Add to environment: `SENDGRID_API_KEY=SG.your-key-here`

#### 2. Verify Sender Domain in SendGrid

**For Production Use:**

1. Navigate to **Settings → Sender Authentication**
2. Click **Authenticate Your Domain**
3. Select your DNS host provider
4. Enter your domain (e.g., `yourdomain.com`)
5. Add the provided DNS records (CNAME, TXT) to your DNS provider:
   - **CNAME records for DKIM**
   - **TXT record for SPF**
6. Click **Verify** once DNS records are added
7. Wait for verification (may take 24-48 hours for DNS propagation)
8. Once verified, use an email on that domain as `SERVICE_EMAIL_ADDRESS`

**For Testing (Quick Start):**

1. Navigate to **Settings → Sender Authentication**
2. Click **Single Sender Verification**
3. Fill in your personal email address
4. Click verification link sent to your email
5. Use this email as `SERVICE_EMAIL_ADDRESS`

#### 3. Obtain OpenAI API Key

1. Sign up or log in at [OpenAI Platform](https://platform.openai.com)
2. Navigate to **API Keys** section
3. Click **Create new secret key**
4. Name: "Email-LLM Service"
5. **Copy the API key immediately**
6. Add to environment: `OPENAI_API_KEY=sk-your-key-here`

#### 4. Configure MX Records for Inbound Email

To receive emails at your domain:

1. **Choose a subdomain** for receiving emails (e.g., `email.yourdomain.com`)
2. **Add MX record** in your DNS provider:
   ```
   Type: MX
   Host: email.yourdomain.com
   Priority: 10
   Value: mx.sendgrid.net
   ```
3. **Configure Inbound Parse in SendGrid:**
   - Navigate to **Settings → Inbound Parse**
   - Click **Add Host & URL**
   - Subdomain: `email`
   - Domain: `yourdomain.com`
   - Destination URL: `https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook`
   - Check **Spam Check** and **Send Raw**
4. Wait for DNS propagation (may take up to 48 hours)
5. Test by sending email to: `anything@email.yourdomain.com`

#### 5. Set Secrets in Supabase

**Via Supabase Dashboard:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings → Edge Functions**
4. Click **Environment Variables**
5. Add the following secrets:
   - `SENDGRID_API_KEY`: Your SendGrid API key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SERVICE_EMAIL_ADDRESS`: Your verified sender email
   - `OPENAI_MODEL`: `gpt-3.5-turbo` (or `gpt-4`)
   - `LOG_LEVEL`: `INFO`

**Via Supabase CLI (if installed):**

```bash
supabase secrets set SENDGRID_API_KEY=SG.your-key --project-ref nopocimtfthppwssohty
supabase secrets set OPENAI_API_KEY=sk-your-key --project-ref nopocimtfthppwssohty
supabase secrets set SERVICE_EMAIL_ADDRESS=assistant@yourdomain.com --project-ref nopocimtfthppwssohty
supabase secrets set OPENAI_MODEL=gpt-3.5-turbo --project-ref nopocimtfthppwssohty
```

### End-to-End Testing Instructions

#### Prerequisites for Testing

- All secrets configured in Supabase
- Sender domain verified in SendGrid
- MX records configured and propagated
- DNS changes fully propagated (wait 24-48 hours after setup)

#### Test 1: Verify Edge Function is Running

```bash
curl https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook
```

Expected: `200 OK` response (may return an error if not POST request, which is fine)

#### Test 2: Send Test Email

1. **Send an email** from your personal inbox to: `test@email.yourdomain.com`
2. **Subject:** "Hello Assistant"
3. **Body:** "Can you help me with something?"
4. **Wait** up to 30 seconds for processing

#### Test 3: Monitor Logs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Edge Functions → email-webhook → Logs**
3. Look for the following events:
   - `webhook_received` - Email was received
   - `email_parsed` - Email was successfully parsed
   - `llm_response_generated` - OpenAI generated response
   - `sendgrid_send_started` - Email send initiated
   - `sendgrid_send_completed` - Email sent successfully
   - `processing_completed` - Full flow completed

#### Test 4: Check Your Inbox

1. Check your email inbox (the address you sent from)
2. You should receive a response email within 30 seconds
3. Verify the response:
   - **Subject:** "Re: Hello Assistant"
   - **From:** Your configured `SERVICE_EMAIL_ADDRESS`
   - **Body:** AI-generated response from OpenAI
   - **Threading:** Email should appear in the same thread

#### Test 5: Test Email Threading

1. **Reply** to the AI's response
2. Write another question in your reply
3. Send the reply
4. Wait 30 seconds
5. Check that the new response:
   - Appears in the same thread
   - References previous conversation (if context is maintained)

#### Test 6: Verify Performance

Check Supabase logs for processing times:

- **Total processing time:** Should be < 30 seconds
- **Webhook parsing:** Should be < 2 seconds
- **LLM call:** Should be < 20 seconds
- **Email send:** Should be < 5 seconds

If any step exceeds threshold, you'll see `slow_*` warning in logs.

#### Test 7: Error Scenarios (Optional)

**Test Invalid API Key:**
1. Temporarily set invalid `OPENAI_API_KEY` in Supabase secrets
2. Send test email
3. Check logs for `CRITICAL` level error
4. Verify you receive error email: "Sorry, I'm having trouble responding right now."
5. Restore correct API key

**Test Rate Limiting:**
1. Send 10+ emails rapidly
2. Watch for rate limit warnings in logs
3. Verify rate limit error email received

### Troubleshooting End-to-End Flow

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| No email received at service | MX record not configured | Check DNS settings, wait for propagation |
| Webhook not triggered | Inbound Parse not configured | Verify SendGrid Inbound Parse settings |
| Email received but no response | API keys invalid | Check Supabase secrets are set correctly |
| Response received but not in thread | Threading headers missing | Check `formatOutgoingEmail` includes In-Reply-To |
| Processing takes > 30 seconds | OpenAI model too slow | Consider switching from gpt-4 to gpt-3.5-turbo |
| SendGrid auth error | API key invalid | Generate new SendGrid API key with Full Access |
| Sender not verified error | Domain not verified | Complete domain verification in SendGrid |

## Web Landing Page

This project includes a beautiful, modern landing page built with Next.js 14, React, and TailwindCSS.

### Quick Start

```bash
# Install dependencies
deno task web:install

# Run development server
deno task web:dev

# Visit http://localhost:3000
```

### Web Deployment

The landing page can be deployed to Vercel, Netlify, or any static hosting provider.

**📚 Full deployment guide:** [docs/WEB-DEPLOYMENT.md](docs/WEB-DEPLOYMENT.md)

### Web Features

- ⚡ Built with Next.js 14 (App Router)
- 🎨 Styled with TailwindCSS
- 📱 Fully responsive design
- ♿ Accessible components
- 🚀 Optimized for performance
- 🎯 SEO-ready with metadata

## Development Roadmap

### Epic 1: Foundation & Core Email-LLM Pipeline
- ✅ **Story 1.1:** Project Setup and Infrastructure
- ✅ **Story 1.2:** SendGrid Inbound Webhook Endpoint
- ✅ **Story 1.3:** OpenAI API Integration
- ✅ **Story 1.4:** SendGrid Outbound Email Response
- ⏳ **Story 1.5:** Basic Error Handling and Logging
- ✅ **Landing Page:** Next.js web app

### Epic 2: Production Reliability & Security (Future)
- Webhook signature verification
- Rate limiting and throttling
- Enhanced monitoring and alerting

## Contributing

This project follows strict coding standards defined in [docs/architecture/coding-standards.md](docs/architecture/coding-standards.md).

**Key Standards:**
- TypeScript 5.x with strict mode
- Deno fmt for formatting (lineWidth: 100, singleQuote: true)
- Deno lint with recommended rules
- Never use console.log (use structured logger module)
- All functions must have explicit return types
- All external API calls must use retry logic

## License

[Add your license here]

## Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review [Architecture Documentation](docs/architecture.md)
- Check Supabase logs for error details

---

**Project Status:** Story 1.1 Complete ✅ | Epic 1 In Progress ⏳
