# Email-to-LLM Chat Service

## Project Overview

This is an Email-to-LLM Chat Service that allows users to interact with Large Language Models (LLMs) directly through email. Users send emails to a specific address, and the system responds with AI-generated replies, creating a seamless conversational experience within their email client.

## Architecture

- **Runtime**: Deno with TypeScript (Supabase Edge Functions)
- **Email Infrastructure**: SendGrid (Inbound Parse + Send API)
- **LLM Integration**: OpenAI API (GPT-4/GPT-3.5-turbo)
- **Infrastructure**: Supabase Edge Functions (serverless)
- **Database**: None for MVP (stateless), Supabase PostgreSQL planned for post-MVP

## Project Structure

```
/
├── docs/
│   └── prd.md                    # Product Requirements Document
├── supabase/
│   └── functions/
│       └── email-webhook/
│           └── index.ts          # Main webhook handler
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── CLAUDE.md                     # This file
└── README.md                     # Setup and usage instructions
```

## Development Commands

### Local Development
```bash
# Start Supabase functions locally
supabase functions serve

# Deploy function to Supabase
supabase functions deploy email-webhook
```

### Environment Variables

Required environment variables (store in Supabase secrets):
- `OPENAI_API_KEY` - OpenAI API key for LLM completions
- `SENDGRID_API_KEY` - SendGrid API key for sending emails
- `SENDGRID_WEBHOOK_VERIFICATION_KEY` - For webhook signature verification
- `LOG_LEVEL` - Logging verbosity (DEBUG, INFO, WARN, ERROR, CRITICAL)

## Key Implementation Details

### MVP Scope (Stateless)
- Each email processed independently
- No conversation history or user management
- Simple email-to-LLM-to-email flow
- SendGrid webhook → OpenAI API → SendGrid send

### Post-MVP Features
- Conversation threading and history
- User authentication and management
- Rate limiting and abuse prevention
- Advanced monitoring and analytics

## Testing Strategy

- **Unit Tests**: Email parsing, LLM prompt formatting, error handling
- **Integration Tests**: SendGrid webhook handling, OpenAI API calls
- **Manual Testing**: End-to-end email flow

## Security Considerations

- SendGrid webhook signature verification
- API keys stored in Supabase secrets (never in code)
- No user authentication in MVP (open email address)
- Input validation and sanitization
- Proper error handling without exposing sensitive data

## Performance Targets

- Total response time: < 30 seconds
- Webhook processing: < 2 seconds
- LLM API call: < 20 seconds
- Email sending: < 5 seconds