# personi[feed] - AI-Powered Daily Newsletter

> Your personalized daily digest, delivered at 11am ET

personi[feed] is a daily AI newsletter service that generates personalized content based on your interests. Sign up with just an email and a prompt—no password required.

## 🎯 Key Features

- **100% Personalized**: Every newsletter tailored to your specific interests
- **Zero Friction**: No password, no login, no app—just email
- **Conversational**: Reply to any newsletter to refine future content
- **Daily Consistency**: Arrives every day at 11am ET

## 🏗️ Architecture

Built on the llmbox foundation with:

- **Backend**: Supabase Edge Functions (Deno + TypeScript)
- **Database**: Supabase PostgreSQL (users, customizations, newsletters)
- **LLM**: OpenAI API (gpt-4o-mini)
- **Email**: SendGrid (inbound + outbound)
- **Web**: Next.js 14 + React + TailwindCSS (deployed to Vercel)
- **Scheduling**: Supabase Cron (daily at 11am ET)

## 📁 Project Structure

```
llmbox/
├── supabase/
│   ├── functions/
│   │   ├── _shared/                    # Shared utilities
│   │   │   ├── logger.ts
│   │   │   ├── retryLogic.ts
│   │   │   ├── config.ts
│   │   │   ├── errors.ts
│   │   │   ├── types.ts
│   │   │   ├── cors.ts
│   │   │   └── supabaseClient.ts
│   │   ├── personifeed-signup/         # Signup handler
│   │   │   ├── index.ts
│   │   │   ├── database.ts
│   │   │   ├── validation.ts
│   │   │   └── types.ts
│   │   ├── personifeed-cron/           # Daily newsletter generator
│   │   │   ├── index.ts
│   │   │   ├── database.ts
│   │   │   ├── newsletterGenerator.ts
│   │   │   ├── emailSender.ts
│   │   │   └── types.ts
│   │   ├── personifeed-reply/          # Reply handler
│   │   │   ├── index.ts
│   │   │   ├── database.ts
│   │   │   ├── emailParser.ts
│   │   │   └── types.ts
│   │   ├── tests/                      # Function tests
│   │   │   ├── personifeed-signup-test.ts
│   │   │   ├── personifeed-cron-test.ts
│   │   │   └── personifeed-reply-test.ts
│   │   └── import_map.json             # Top-level imports
│   ├── migrations/
│   │   └── 20251009000000_personifeed_schema.sql
│   └── config.toml
├── web/
│   └── app/
│       └── personifeed/
│           └── page.tsx                # Landing page
├── tests/
│   └── integration/
│       ├── personifeed-signup.test.ts
│       ├── personifeed-cron.test.ts
│       └── personifeed-reply.test.ts
├── docs/
│   ├── personifeed-prd.md              # Product requirements
│   ├── personifeed-architecture.md     # System architecture
│   └── personifeed-deployment.md       # Deployment guide
└── PERSONIFEED-README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Deno 1.x
- Supabase CLI
- OpenAI API key
- SendGrid account

### 1. Clone & Install

```bash
git clone [repository-url]
cd llmbox

# Install web dependencies
deno task web:install
```

### 2. Set Up Database

```bash
# Apply migration
deno task db:push
```

### 3. Configure Secrets

```bash
# Set required environment variables
deno task secrets:set:key OPENAI_API_KEY=sk-...
deno task secrets:set:key SENDGRID_API_KEY=SG...
deno task secrets:set:key PERSONIFEED_EMAIL_DOMAIN=personifeed.llmbox.pro
```

### 4. Deploy Functions

```bash
# Deploy all personifeed functions
deno task deploy:personifeed:all
```

### 5. Configure Cron Job

Set up daily cron trigger in Supabase Dashboard:
- Schedule: `0 15 * * *` (11am ET = 3pm UTC)
- Target: `personifeed-cron` function

### 6. Deploy Web App

```bash
cd web
npm run build
vercel deploy --prod
```

## 🧪 Testing

### Unit Tests

```bash
# Run all personifeed unit tests
deno task test:personifeed
```

### Integration Tests

```bash
# Run all personifeed integration tests (requires API keys)
deno task test:integration:personifeed
```

## 📊 Database Schema

### users

| Column      | Type      | Description                        |
|-------------|-----------|------------------------------------|
| id          | UUID      | Primary key                        |
| email       | VARCHAR   | User email (unique)                |
| created_at  | TIMESTAMP | Signup timestamp                   |
| active      | BOOLEAN   | Newsletter subscription status     |

### customizations

| Column      | Type      | Description                        |
|-------------|-----------|------------------------------------|
| id          | UUID      | Primary key                        |
| user_id     | UUID      | Foreign key to users               |
| content     | TEXT      | Prompt or feedback (max 2000 chars)|
| type        | VARCHAR   | 'initial' or 'feedback'            |
| created_at  | TIMESTAMP | Creation timestamp                 |

### newsletters

| Column      | Type      | Description                        |
|-------------|-----------|------------------------------------|
| id          | UUID      | Primary key                        |
| user_id     | UUID      | Foreign key to users               |
| content     | TEXT      | Generated newsletter content       |
| sent_at     | TIMESTAMP | Delivery timestamp (null if failed)|
| status      | VARCHAR   | 'pending', 'sent', or 'failed'     |
| created_at  | TIMESTAMP | Generation timestamp               |

## 🔄 User Journey

```mermaid
sequenceDiagram
    participant User
    participant Web as Landing Page
    participant Signup as personifeed-signup
    participant DB as Database
    participant Cron as personifeed-cron
    participant OpenAI
    participant SendGrid
    participant Reply as personifeed-reply

    User->>Web: Visit /personifeed
    User->>Web: Enter email + prompt
    Web->>Signup: POST signup
    Signup->>DB: Store user + customization
    Signup-->>User: Success message

    Note over Cron: Daily at 11am ET
    Cron->>DB: Fetch active users
    loop For each user
        Cron->>DB: Get customizations
        Cron->>OpenAI: Generate newsletter
        OpenAI-->>Cron: Newsletter content
        Cron->>SendGrid: Send email
        SendGrid->>User: Deliver newsletter
        Cron->>DB: Store newsletter (status=sent)
    end

    User->>SendGrid: Reply with feedback
    SendGrid->>Reply: POST webhook
    Reply->>DB: Store feedback
    Reply->>SendGrid: Send confirmation
    SendGrid->>User: Deliver confirmation

    Note over Cron: Next day at 11am ET
    Cron->>OpenAI: Generate with feedback
    OpenAI-->>Cron: Updated newsletter
    Cron->>User: Deliver updated newsletter
```

## 🛠️ Development Workflow

### Local Development

```bash
# Start web dev server
deno task web:dev

# Run unit tests in watch mode
deno task test:watch

# Lint and format
deno task lint
deno task fmt
```

### Deploy Changes

```bash
# Deploy functions
deno task deploy:personifeed:all

# Apply database migrations
deno task db:push

# Deploy web app
cd web && vercel deploy --prod
```

## 📋 Available Tasks

```bash
# Deployment
deno task deploy:personifeed:all    # Deploy all functions
deno task db:push                   # Apply database migrations

# Testing
deno task test:personifeed              # Run unit tests
deno task test:integration:personifeed  # Run integration tests

# Development
deno task web:dev                   # Start web dev server
deno task lint                      # Lint code
deno task fmt                       # Format code

# Utilities
deno task secrets:list              # List all secrets
deno task secrets:set:key KEY=value # Set a secret
deno task help                      # Show all tasks
```

## 💰 Cost Estimation

For **100 users/day**:

| Service       | Usage                  | Cost      |
|---------------|------------------------|-----------|
| OpenAI API    | ~3,000 requests/month  | ~$30/mo   |
| SendGrid      | 3,000 emails/month     | Free      |
| Supabase      | 500MB database         | Free      |
| Vercel        | Static site            | Free      |
| **Total**     |                        | **~$30/mo** |

### Cost Optimization

- Use `gpt-4o-mini` instead of `gpt-4o` (10x cheaper)
- Limit `max_tokens` to 2000 (shorter responses)
- Batch process users (10 at a time) in cron job

## 🔒 Security

- ✅ API keys stored as Supabase secrets
- ✅ JWT verification enabled for cron function
- ✅ Input validation on all user inputs
- ✅ Email format validation
- ✅ Prompt length limits (2000 characters)
- ✅ Database access via service role key
- ✅ CORS headers configured

## 📈 Monitoring

### Key Metrics

- **Signup Rate**: New users per day
- **Delivery Rate**: Successful newsletters / total users
- **Reply Rate**: Feedback customizations per user
- **Error Rate**: Failed operations / total operations

### View Logs

```bash
# View function logs
supabase functions logs personifeed-signup --project-ref [your-ref]
supabase functions logs personifeed-cron --project-ref [your-ref]
supabase functions logs personifeed-reply --project-ref [your-ref]
```

Or use Supabase Dashboard → Edge Functions → Logs

## 🐛 Troubleshooting

### Newsletters not sending

1. Check OpenAI API key is set
2. Verify SendGrid API key is set
3. Check sender email is authenticated
4. Review cron function logs

### Replies not processed

1. Verify SendGrid Inbound Parse is configured
2. Check MX records are correct
3. Test reply function with curl
4. Review reply function logs

### Signup form not working

1. Check browser console for errors
2. Verify CORS headers are set
3. Test signup function directly
4. Review signup function logs

## 📚 Documentation

- **PRD**: `docs/personifeed-prd.md` - Product requirements
- **Architecture**: `docs/personifeed-architecture.md` - System design
- **Deployment**: `docs/personifeed-deployment.md` - Setup guide

## 🗺️ Roadmap

### MVP (Complete)
- ✅ Landing page with signup form
- ✅ Database schema and migrations
- ✅ Daily newsletter generation
- ✅ Email-based customization via replies
- ✅ Comprehensive testing

### Post-MVP
- ⏳ Unsubscribe functionality
- ⏳ Preference management page
- ⏳ Webhook signature verification
- ⏳ Newsletter analytics
- ⏳ Multiple delivery times

## 📄 License

[Your License]

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines first.

## 🙏 Acknowledgments

Built on the llmbox foundation, reusing:
- Structured logging
- Retry logic with exponential backoff
- OpenAI integration
- SendGrid email handling
- Next.js web infrastructure

Powered by:
- [Supabase](https://supabase.com/) - Backend platform
- [OpenAI](https://openai.com/) - LLM API
- [SendGrid](https://sendgrid.com/) - Email delivery
- [Vercel](https://vercel.com/) - Web hosting
- [Next.js](https://nextjs.org/) - React framework
- [TailwindCSS](https://tailwindcss.com/) - Styling

