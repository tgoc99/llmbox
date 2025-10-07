# Source Tree

```plaintext
email-llm-service/
├── supabase/
│   ├── functions/
│   │   └── email-webhook/
│   │       ├── index.ts              # Main Edge Function handler
│   │       ├── webhookVerifier.ts    # SendGrid HMAC signature verification
│   │       ├── emailParser.ts        # Parse SendGrid webhook payload
│   │       ├── llmClient.ts          # OpenAI API client with retry logic
│   │       ├── emailSender.ts        # SendGrid Send API client
│   │       ├── logger.ts             # Structured logging utilities
│   │       ├── retryLogic.ts         # Exponential backoff retry handler
│   │       ├── types.ts              # TypeScript interfaces and types
│   │       └── config.ts             # Configuration and env var access
│   ├── config.toml                   # Supabase project configuration
│   └── .env.local                    # Local development secrets (gitignored)
├── tests/
│   ├── unit/
│   │   ├── webhookVerifier.test.ts   # Unit tests for signature verification
│   │   ├── emailParser.test.ts       # Unit tests for email parsing
│   │   ├── llmClient.test.ts         # Unit tests with mocked OpenAI
│   │   ├── emailSender.test.ts       # Unit tests with mocked SendGrid
│   │   └── retryLogic.test.ts        # Unit tests for retry behavior
│   └── integration/
│       ├── webhook.test.ts           # Integration test for full webhook flow
│       ├── openai.test.ts            # Integration test with real OpenAI API
│       └── sendgrid.test.ts          # Integration test with real SendGrid
├── docs/
│   ├── prd.md                        # Product Requirements Document
│   ├── architecture.md               # This document
│   └── api-examples.md               # Example API requests/responses
├── scripts/
│   ├── deploy.sh                     # Deployment script
│   └── test-webhook.sh               # Local webhook testing script
├── .github/
│   └── workflows/
│       ├── test.yml                  # CI pipeline for tests
│       └── deploy.yml                # CD pipeline for deployment
├── .gitignore                        # Git ignore file
├── .env.example                      # Environment variables template
├── deno.json                         # Deno configuration
├── import_map.json                   # Deno import map (if needed)
└── README.md                         # Project documentation
```

**Key Directory Explanations:**

- **`supabase/functions/email-webhook/`** - Single Edge Function containing all core logic
- **`tests/`** - Separated unit and integration tests for comprehensive coverage
- **`docs/`** - All project documentation centralized
- **`scripts/`** - Deployment and testing automation
- **`.github/workflows/`** - CI/CD automation (optional but recommended)

---
