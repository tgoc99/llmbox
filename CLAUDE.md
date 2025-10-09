# Email-to-LLM Chat Service - Claude AI Context

## Project Overview

**LLMBox** is an Email-to-LLM Chat Service that allows users to interact with AI assistants
(GPT-4o-mini, GPT-4o) directly through email. Users send emails to a configured address, and the
system responds with AI-generated replies, creating a seamless conversational experience within
their email client.

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
├── supabase/functions/
│   ├── _shared/                       # Shared utilities
│   │   ├── types.ts                   # TypeScript type definitions
│   │   ├── logger.ts                  # Structured logging
│   │   ├── retryLogic.ts              # Exponential backoff
│   │   ├── llmClient.ts               # OpenAI integration
│   │   ├── emailSender.ts             # SendGrid integration
│   │   ├── errors.ts                  # Custom error types
│   │   └── config.ts                  # Configuration
│   ├── email-webhook/                 # LLMBox email processor
│   │   ├── index.ts                   # Request handler
│   │   ├── emailParser.ts             # Email parsing logic
│   │   └── errorTemplates.ts          # User-facing error messages
│   ├── personifeed-signup/            # Personifeed signup handler
│   ├── personifeed-cron/              # Daily newsletter generator
│   └── personifeed-reply/             # Reply handler
├── tests/
│   ├── unit/                          # Fast, no external dependencies
│   │   ├── shared/                    # Shared utilities tests
│   │   ├── email-webhook/             # LLMBox tests
│   │   ├── personifeed/               # Personifeed tests
│   │   └── database/                  # Database schema tests
│   ├── contract/                      # Contract/schema validation
│   ├── integration/                   # Slow, real API calls
│   │   ├── external-apis/             # OpenAI, SendGrid, Supabase
│   │   ├── llmbox/                    # LLMBox integration tests
│   │   └── personifeed/               # Personifeed integration tests
│   ├── e2e/                           # Full user journeys
│   │   ├── llmbox/                    # Email-to-response flows
│   │   └── personifeed/               # Signup-newsletter-reply flows
│   └── README.md                      # Testing guide
├── web/                               # Next.js landing page
│   ├── app/                           # App Router pages
│   └── components/                    # React components
├── docs/
│   ├── prd.md                         # Product Requirements
│   ├── prd/                           # Detailed PRD sections
│   ├── architecture.md                # System architecture
│   └── personifeed-*.md               # Personifeed documentation
├── .cursorrules                       # Cursor IDE rules
├── CLAUDE.md                          # This file
├── README.md                          # LLMBox documentation
└── PERSONIFEED-README.md              # Personifeed documentation
```

## Development Workflow

### CI/CD

**GitHub Actions:**

- `.github/workflows/test.yml` - Automated testing on PRs and pushes
- `.github/workflows/deploy.yml` - Automated deployment to Supabase

**Git Hooks (Husky):**

- `.husky/pre-commit` - Runs format, lint, type-check, unit & contract tests
- `.husky/pre-push` - Runs full check task

**Setup:**

```bash
./.husky/install.sh  # Run once after cloning
```

See [docs/ci-cd-setup.md](docs/ci-cd-setup.md) for full documentation.

### Common Commands

```bash
# Deployment
deno task deploy              # Deploy Edge Function to Supabase
deno task logs                # View logs
deno task logs:tail           # Live tail logs

# Testing
deno task test                # Fast tests only (unit + contract)
deno task test:unit           # Unit tests only
deno task test:contract       # Contract/schema tests
deno task test:integration    # Integration tests (requires API keys, $$$)
deno task test:e2e            # E2E tests (very slow, $$$$)
deno task test:all            # Everything (slow, expensive)
deno task test:pre-deploy     # Fast + integration (run before deploy)
deno task test:ci             # CI-safe tests (no API calls)

# Code Quality
deno task fmt                 # Format code
deno task lint                # Lint code
deno task check               # Format, lint, type-check, fast tests
deno task check:all           # All checks + integration tests

# Web Development
deno task web:dev             # Run Next.js dev server
deno task web:build           # Build for production
deno task web:install         # Install web dependencies

# Secrets Management
deno task secrets:list        # List configured secrets
deno task secrets:set:key KEY=value  # Set a secret
```

## Testing Strategy

### Test Organization

The repository follows a comprehensive testing pyramid:

1. **Unit Tests** (`tests/unit/`) - Fast, no external dependencies
   - Shared utilities, parsers, validators
   - Run constantly during development
   - Command: `deno task test:unit` or `deno task test:unit:watch`

2. **Contract Tests** (`tests/contract/`) - Schema and type validation
   - Edge function contracts
   - Database schema validation
   - Email format validation
   - Command: `deno task test:contract`

3. **Integration Tests** (`tests/integration/`) - Real API calls (costs $$$)
   - OpenAI, SendGrid, Supabase integrations
   - Individual function workflows
   - Command: `deno task test:integration`
   - **⚠️ Only run before deployment or when debugging API issues**

4. **E2E Tests** (`tests/e2e/`) - Full user journeys (very slow, $$$$
   )
   - Complete signup-to-newsletter flows
   - Email-to-response workflows
   - Command: `deno task test:e2e`
   - **⚠️ Only run before major releases or weekly**

### Testing Workflow

```bash
# While developing
deno task test:unit:watch

# Before committing
deno task check

# Before deploying
deno task test:pre-deploy

# Weekly validation
deno task test:all
```

### Coverage Goals

- Unit tests: > 80%
- Contract tests: > 70%
- Integration tests: Key workflows covered
- E2E tests: Critical user journeys

See [tests/README.md](tests/README.md) for detailed testing guide.

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
