# 📧 LLMBox - Email-to-AI Chat Service

A serverless email-to-AI service powered by Supabase Edge Functions, SendGrid, and OpenAI. Users
send emails and receive AI-generated responses with built-in web search capability.

---

## 🎯 Two Services in One Repository

This monorepo contains **two distinct services**:

### 1. **LLMBox** - Conversational AI via Email

- 📧 Receive emails via SendGrid Inbound Parse webhook
- 🤖 AI responses powered by OpenAI (GPT-4o-mini, GPT-4o)
- 🌐 Built-in web search - AI can fetch real-time information
- 📤 Automatic email replies with threading support
- ⚡ Stateless, webhook-triggered processing

### 2. **personi[feed]** - AI-Powered Daily Newsletter

- 📬 Personalized daily newsletters at 11am ET
- 🗓️ Database-backed user preferences and customization
- 💬 Email-based feedback for continuous personalization
- ⚡ Cron-scheduled newsletter generation
- 🎨 Dedicated landing page at `/personifeed`

📖 **See [PERSONIFEED-README.md](PERSONIFEED-README.md) for full personi[feed] documentation**

---

## ✨ Features (LLMBox)

- 📧 Receive emails via SendGrid Inbound Parse webhook
- 🤖 AI responses powered by OpenAI (GPT-4o-mini, GPT-4o)
- 🌐 Built-in web search - AI can fetch real-time information
- 📤 Automatic email replies with threading support
- 🛡️ Comprehensive error handling and structured logging
- ⚡ Serverless (Supabase Edge Functions - Deno runtime)
- 🎨 Modern Next.js landing page included
- ✅ Full test coverage (unit + integration)

## 🚀 Quick Start

### Prerequisites

- [Supabase Account](https://supabase.com) (free tier)
- [SendGrid Account](https://sendgrid.com) (free tier)
- [OpenAI API Key](https://platform.openai.com) (requires billing)
- Domain with DNS access

### 5-Minute Deployment

```bash
# 1. Set secrets in Supabase
deno task secrets:set:key SENDGRID_API_KEY=SG.your-key
deno task secrets:set:key OPENAI_API_KEY=sk-proj-your-key
deno task secrets:set:key SERVICE_EMAIL_ADDRESS=assistant@mail.llmbox.pro
deno task secrets:set:key OPENAI_MODEL=gpt-4o-mini

# 2. Deploy
deno task deploy

# 3. Test
deno task test:endpoint
deno task logs
```

### External Setup (Required)

#### 1. SendGrid

1. Get API key: [SendGrid Dashboard](https://app.sendgrid.com) → Settings → API Keys
2. Verify sender domain: Settings → Sender Authentication
3. Configure Inbound Parse:
   - Domain: `email.yourdomain.com`
   - MX Record: `mx.sendgrid.net` (priority 10)
   - Webhook URL: `https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook`

#### 2. OpenAI

1. Get API key: [OpenAI Platform](https://platform.openai.com) → API Keys
2. Add billing method (required)
3. Choose model: `gpt-4o-mini` (recommended, faster, cheaper) or `gpt-4o`

#### 3. DNS Configuration

Add MX record to your domain:

```
Type: MX
Host: email.yourdomain.com
Priority: 10
Value: mx.sendgrid.net
```

**Wait 24-48 hours for DNS propagation**, then test by emailing: `test@email.yourdomain.com`

## 📁 Project Structure

```
llmbox/
├── supabase/functions/email-webhook/  # Main Edge Function
│   ├── index.ts                       # Request handler
│   ├── emailParser.ts                 # Email parsing
│   ├── llmClient.ts                   # OpenAI integration
│   ├── emailSender.ts                 # SendGrid sending
│   ├── logger.ts                      # Structured logging
│   └── retryLogic.ts                  # Exponential backoff
├── tests/
│   ├── unit/                          # Unit tests
│   └── integration/                   # Integration tests
├── web/                               # Next.js landing page
├── docs/
│   ├── prd.md                         # Product requirements
│   ├── prd/                           # Detailed PRD sections
│   └── architecture.md                # System architecture
├── .cursorrules                       # Cursor IDE coding standards
├── CLAUDE.md                          # Claude AI context
├── WEB-PROJECT-SUMMARY.md             # Web app guide
└── README.md                          # This file
```

## 🎯 Current Status

**Supabase Project:**

- **ID:** nopocimtfthppwssohty
- **Region:** us-east-2
- **Endpoint:** `https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook`

**Development:**

- ✅ Epic 1 Complete - Core email-LLM pipeline with web search
- ✅ Comprehensive tests (unit + integration)
- ✅ Next.js landing page
- ⏳ Epic 2 Planned - Webhook verification, rate limiting, enhanced monitoring

## 🛠️ Development

### Available Commands

```bash
# Deployment & Monitoring
deno task deploy          # Deploy to Supabase
deno task logs            # View logs
deno task logs:tail       # Live tail logs

# Testing
deno task test            # Run all tests
deno task test:unit       # Unit tests only
deno task test:integration # Integration tests (requires API keys)

# Code Quality
deno task fmt             # Format code
deno task lint            # Lint code
deno task check:all       # All checks + tests (run before commit)

# Web Development
deno task web:dev         # Run Next.js dev server
deno task web:build       # Build web for production
deno task web:install     # Install web dependencies

# Secrets
deno task secrets:list    # List configured secrets
deno task secrets:set:key KEY=value  # Set a secret
```

### Environment Variables

| Variable                | Required | Default       | Description                        |
| ----------------------- | -------- | ------------- | ---------------------------------- |
| `SENDGRID_API_KEY`      | Yes      | -             | SendGrid API key                   |
| `OPENAI_API_KEY`        | Yes      | -             | OpenAI API key                     |
| `SERVICE_EMAIL_ADDRESS` | Yes      | -             | Verified sender email              |
| `OPENAI_MODEL`          | No       | `gpt-4o-mini` | gpt-4o-mini or gpt-4o              |
| `LOG_LEVEL`             | No       | `INFO`        | DEBUG, INFO, WARN, ERROR, CRITICAL |
| `ENABLE_WEB_SEARCH`     | No       | `true`        | Enable AI web search               |

### Testing

```bash
# Run all tests
deno task test

# Unit tests only
deno task test:unit

# Integration tests (requires API keys, makes real API calls, costs money)
deno task test:integration
```

See [tests/integration/README.md](tests/integration/README.md) for integration test setup.

## 🔍 Troubleshooting

| Issue                      | Solution                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| **No email received**      | Check Supabase logs, verify API keys, confirm sender domain verified       |
| **Webhook not triggering** | Verify MX record, check DNS propagation (24-48 hours), confirm webhook URL |
| **OpenAI errors**          | Verify API key, check billing/usage limits, review logs                    |
| **Deployment fails**       | Verify project ID, check deployment permissions, review logs               |

### Viewing Logs

```bash
# View recent logs
deno task logs

# Live tail (recommended for debugging)
deno task logs:tail
```

Or: Supabase Dashboard → Project → Edge Functions → email-webhook → Logs

### Monitoring

**Structured Logging:**

- All logs in JSON format with timestamp, level, event, context
- Levels: DEBUG, INFO, WARN, ERROR, CRITICAL
- Each email tracked with correlation ID (`messageId`)
- Performance warnings for slow operations

**Key Events:**

- `webhook_received`, `email_parsed`, `openai_response_received`, `sendgrid_send_completed`,
  `processing_completed`
- Filter by `messageId` in Supabase logs to trace specific emails

**Performance Targets:**

- Webhook parsing: < 2s
- LLM API call: < 20s
- Email sending: < 5s
- Total: < 30s

## 🧪 Testing

Comprehensive test suite with 245+ tests covering unit, contract, integration, and E2E scenarios.

```bash
# Fast tests (unit + contract) - run constantly
deno task test              # 245+ tests in ~7s
deno task test:unit:watch   # Watch mode for development

# Before committing
deno task check             # Format, lint, type-check, tests

# Before deploying (includes integration tests, costs $)
deno task test:pre-deploy

# Full suite (expensive!)
deno task test:all
```

See [tests/README.md](tests/README.md) for comprehensive testing guide.

## 🔄 CI/CD

**GitHub Actions:**

- ✅ Automated testing on PRs and pushes
- ✅ Integration tests on main branch
- ✅ Automated deployment to Supabase on merge to main

**Git Hooks (Husky):**

- ✅ Pre-commit: Format, lint, type-check, unit & contract tests (~7s)
- ✅ Pre-push: Full check task

**Local Setup:**

```bash
# Install Git hooks (run once after cloning)
./.husky/install.sh
```

**GitHub Setup:**

```bash
# Quick: Add secrets from .env.local using GitHub CLI
gh auth login
cat .env.local | grep -E "OPENAI_API_KEY|SENDGRID_API_KEY|SERVICE_EMAIL_ADDRESS|SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY" | while IFS='=' read -r key value; do echo "$value" | gh secret set "$key"; done

# Add deployment secrets
gh secret set SUPABASE_ACCESS_TOKEN < <(cat ~/.supabase/access-token)
echo "YOUR_PROJECT_REF" | gh secret set SUPABASE_PROJECT_ID
```

See [docs/ci-cd-setup.md](docs/ci-cd-setup.md) for full documentation.

## 🎨 Web Landing Page

This project includes a production-ready Next.js 14 landing page.

```bash
# Quick start
deno task web:install
deno task web:dev

# Visit http://localhost:3000
```

**Deployment:** Deploy to Vercel in 5 minutes. Set root directory to `web`.

**Full Guide:** See [WEB-PROJECT-SUMMARY.md](WEB-PROJECT-SUMMARY.md) for complete web app
documentation.

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Claude AI context for development
- **[WEB-PROJECT-SUMMARY.md](WEB-PROJECT-SUMMARY.md)** - Web landing page guide
- **[docs/prd.md](docs/prd.md)** - Product requirements document
- **[docs/architecture.md](docs/architecture.md)** - System architecture
- **[tests/integration/README.md](tests/integration/README.md)** - Integration testing guide
- **[.cursorrules](.cursorrules)** - Coding standards for Cursor IDE

## 🏗️ Architecture

### Tech Stack

- **Runtime:** Deno + TypeScript
- **Infrastructure:** Supabase Edge Functions (serverless) + PostgreSQL
- **Email:** SendGrid (Inbound Parse + Send API)
- **AI:** OpenAI API (gpt-4o-mini, gpt-4o)
- **Web:** Next.js 14 + React + TailwindCSS
- **Database:** Supabase PostgreSQL (multi-tenant schema)
- **Testing:** Deno test framework

### Key Principles

- **Multi-Tenant:** Shared database with product isolation (`email-webhook`, `personifeed`)
- **Serverless:** Auto-scaling, pay-per-use
- **Data Tracking:** All emails, AI usage, and user interactions persisted
- **Error Handling:** Comprehensive try-catch, exponential backoff retries, user-friendly error
  emails
- **Logging:** Structured JSON logs with correlation IDs
- **Security:** No hardcoded secrets, input validation, row-level security (planned)

## 🚦 Development Roadmap

### Epic 1: Foundation & Core Pipeline ✅ Complete

- ✅ Project setup and infrastructure
- ✅ SendGrid inbound/outbound integration
- ✅ OpenAI integration with web search
- ✅ Error handling and structured logging
- ✅ Comprehensive tests
- ✅ Next.js landing page

### Epic 2: Multi-Tenant Database ✅ Complete

- ✅ Multi-tenant PostgreSQL schema
- ✅ Email tracking for all products
- ✅ AI usage tracking per user/product
- ✅ User management with email deduplication
- ✅ Personifeed subscriber and feedback tables

### Epic 3: Production Enhancements ⏳ Planned

- ☐ Row-level security policies
- ☐ Webhook signature verification
- ☐ Rate limiting and throttling
- ☐ Enhanced monitoring and alerting
- ☐ User authentication and dashboards

## 🤝 Contributing

### Coding Standards

- TypeScript strict mode, explicit return types
- Deno fmt (lineWidth: 100, singleQuote: true)
- Never use `console.log` - use structured logger
- Run `deno task check:all` before committing

See [.cursorrules](.cursorrules) for complete standards.

### Before Committing

```bash
deno task check:all  # Runs fmt, lint, type-check, and tests
```

## 📝 License

[Add your license here]

## 🆘 Support

- **Issues:** Check Supabase logs with `deno task logs:tail`
- **Documentation:** See docs/ folder for detailed guides
- **Architecture:** Review [docs/architecture.md](docs/architecture.md)
- **Tests:** See example usage in tests/ folder

---

**Status:** Production Ready | Epic 1 Complete ✅

**Project ID:** nopocimtfthppwssohty (us-east-2)
