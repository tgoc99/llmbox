# Email-to-LLM Chat Service - Claude AI Context

## Project Overview

**LLMBox** is an Email-to-LLM Chat Service that allows users to interact with AI assistants (GPT-4o-mini, GPT-4o) directly through email. Users send emails to a configured address, and the system responds with AI-generated replies, creating a seamless conversational experience within their email client.

### Key Features
- 📧 Receive emails via SendGrid Inbound Parse webhook
- 🤖 Generate intelligent responses using OpenAI API
- 🌐 Built-in web search capability (LLM can fetch real-time info)
- 📤 Send responses via SendGrid with email threading
- 🛡️ Comprehensive error handling and structured logging
- ⚡ Serverless architecture (Supabase Edge Functions)
- 🎨 Modern Next.js landing page

### Current Status
- ✅ **Epic 1 Complete:** Foundation & Core Email-LLM Pipeline
  - Project setup and infrastructure
  - SendGrid inbound/outbound integration
  - OpenAI API integration with web search
  - Error handling and structured logging
  - Comprehensive unit and integration tests
- ✅ **Landing Page Complete:** Next.js 14 web app ready to deploy
- ⏳ **Epic 2 (Future):** Production reliability and security enhancements

## Architecture

### Tech Stack
- **Runtime:** Deno + TypeScript (Supabase Edge Functions)
- **Email:** SendGrid (Inbound Parse + Send API)
- **LLM:** OpenAI API (gpt-4o-mini, gpt-4o with web search)
- **Infrastructure:** Supabase (serverless, no database in MVP)
- **Web:** Next.js 14 + React + TailwindCSS
- **Testing:** Deno test framework

### Deployment
- **Project ID:** nopocimtfthppwssohty
- **Region:** us-east-2
- **Endpoint:** https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook

## Project Structure

```
llmbox/
├── supabase/functions/email-webhook/  # Main serverless function
│   ├── index.ts                       # Request handler
│   ├── emailParser.ts                 # Email parsing logic
│   ├── llmClient.ts                   # OpenAI integration
│   ├── emailSender.ts                 # SendGrid sending
│   ├── logger.ts                      # Structured logging
│   ├── retryLogic.ts                  # Exponential backoff
│   ├── errors.ts                      # Custom error types
│   └── errorTemplates.ts              # User-facing error messages
├── tests/
│   ├── unit/                          # Unit tests
│   └── integration/                   # Integration tests (real API calls)
├── web/                               # Next.js landing page
│   ├── app/                           # App Router pages
│   └── components/                    # React components
├── docs/
│   ├── prd.md                         # Product Requirements
│   ├── prd/                           # Detailed PRD sections
│   └── architecture.md                # System architecture
├── .cursorrules                       # Cursor IDE rules
├── CLAUDE.md                          # This file
├── README.md                          # Main documentation
└── WEB-PROJECT-SUMMARY.md             # Web app guide
```

## Development Workflow

### Common Commands
```bash
# Deployment
deno task deploy              # Deploy Edge Function to Supabase
deno task logs                # View logs
deno task logs:tail           # Live tail logs

# Testing
deno task test                # All tests (unit + integration)
deno task test:unit           # Unit tests only
deno task test:integration    # Integration tests (requires API keys)

# Code Quality
deno task fmt                 # Format code
deno task lint                # Lint code
deno task check:all           # All checks + tests (run before commit)

# Web Development
deno task web:dev             # Run Next.js dev server
deno task web:build           # Build for production
deno task web:install         # Install web dependencies

# Secrets Management
deno task secrets:list        # List configured secrets
deno task secrets:set:key KEY=value  # Set a secret
```

### Environment Variables

Required secrets (set in Supabase):
- `OPENAI_API_KEY` - OpenAI API key (sk-proj-...)
- `SENDGRID_API_KEY` - SendGrid API key (SG....)
- `SERVICE_EMAIL_ADDRESS` - Verified sender email
- `OPENAI_MODEL` - Model to use (gpt-4o-mini or gpt-4o)
- `LOG_LEVEL` - Logging level (INFO recommended)
- `ENABLE_WEB_SEARCH` - Enable web search (true by default)

## Key Implementation Details

### Stateless Architecture (MVP)
- Each email processed independently
- No database persistence
- No user authentication required
- Email threading via headers (In-Reply-To, References)
- LLM has no memory between emails

### Error Handling Strategy
- Comprehensive try-catch blocks for all external APIs
- Exponential backoff retry logic
- User-friendly error emails (when appropriate)
- Structured JSON logging with correlation IDs
- Never expose API keys or internal errors to users

### Logging Standards
- **Never use console.log** - use structured logger only
- All logs in JSON format with timestamp, level, event, context
- Log levels: DEBUG, INFO, WARN, ERROR, CRITICAL
- Include messageId as correlation ID
- Performance monitoring for slow operations

### API Integration
- **OpenAI:** Official @openai/openai library with streaming support
- **SendGrid:** Official @sendgrid/mail library
- **Timeouts:** Configurable per API (30s OpenAI, 10s SendGrid)
- **Retries:** 3 attempts with exponential backoff
- **Rate Limiting:** Handled with appropriate user notifications

### Web Search Feature
- LLM can fetch real-time information from the web
- Enabled by default via ENABLE_WEB_SEARCH=true
- Uses OpenAI's built-in web search capability
- No additional configuration required

## Testing Strategy

### Unit Tests
- Email parsing logic
- LLM prompt formatting
- Error handling
- Retry logic
- Email threading
- Run with: `deno task test:unit`

### Integration Tests
- ⚠️ Make real API calls (costs money)
- OpenAI API integration
- SendGrid email sending
- End-to-end workflow
- Run with: `deno task test:integration`
- Requires API keys in environment

## Coding Standards

### TypeScript
- Strict mode enabled
- Explicit return types required
- No `any` types
- Interfaces over type aliases

### Code Style
- Deno fmt (lineWidth: 100, singleQuote: true)
- Descriptive variable names
- Early returns for readability
- Event handlers prefixed with `handle`

### Security
- No hardcoded secrets
- Input validation on all user data
- Sanitize email content
- Webhook signature verification (Epic 2)

## Performance Targets

- **Total processing:** < 30 seconds
- **Webhook parsing:** < 2 seconds
- **LLM API call:** < 20 seconds
- **Email sending:** < 5 seconds
- Warnings logged when thresholds exceeded

## Post-MVP Features (Planned)

- Conversation history (Supabase PostgreSQL)
- User authentication and management
- Rate limiting and abuse prevention
- Webhook signature verification
- Enhanced monitoring and alerting
- Multi-LLM provider support

## Documentation

- **README.md** - Main setup and deployment guide
- **WEB-PROJECT-SUMMARY.md** - Web landing page guide
- **docs/prd.md** - Product requirements
- **docs/architecture.md** - System architecture
- **tests/integration/README.md** - Integration testing guide
- **.cursorrules** - Cursor IDE coding standards

## Quick Reference

### Repository
- **GitHub:** (add your repo URL)
- **Main Branch:** main
- **Supabase Project:** nopocimtfthppwssohty

### External Services
- **Supabase:** https://supabase.com/dashboard
- **SendGrid:** https://app.sendgrid.com
- **OpenAI:** https://platform.openai.com

### Support Resources
- Check Supabase logs for errors
- Review structured logs with correlation IDs
- Consult troubleshooting sections in README.md
- Review test files for usage examples
