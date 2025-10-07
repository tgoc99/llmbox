# Tech Stack

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Runtime** | Deno | Latest (Supabase managed) | JavaScript/TypeScript runtime for Edge Functions | Native to Supabase Edge Functions; modern, secure runtime with built-in TypeScript support |
| **Language** | TypeScript | 5.x | Primary development language | Type safety for API integrations; reduces runtime errors; excellent tooling support |
| **Serverless Platform** | Supabase Edge Functions | Latest | Serverless compute hosting | Zero-config scaling; generous free tier; integrated with Supabase ecosystem |
| **Email Inbound** | SendGrid Inbound Parse | API v3 | Receive and parse incoming emails | Industry-standard email parsing; reliable webhook delivery; handles MIME complexity |
| **Email Outbound** | SendGrid Send API | API v3 | Send response emails | Same provider as inbound (simplified billing); excellent deliverability; supports custom headers for threading |
| **LLM API** | OpenAI API | Latest | Generate intelligent email responses | Industry-leading language models (GPT-4/3.5-turbo); well-documented API; reliable service |
| **HTTP Client** | Deno native fetch | Built-in | HTTP requests to external APIs | Native to Deno; standards-compliant; no additional dependencies |
| **Secrets Management** | Supabase Secrets | Built-in | Store API keys securely | Integrated with Edge Functions; environment variable injection; no external service needed |
| **Logging** | Supabase Logs | Built-in | Centralized logging and monitoring | Native integration; queryable logs; no additional setup required |
| **Testing Framework** | Deno Test | Built-in | Unit and integration testing | Native to Deno; no additional dependencies; supports async testing |
| **Deployment** | Supabase CLI | Latest | Local development and deployment | Official tooling; consistent dev/prod parity; simple deployment workflow |
| **Version Control** | Git | 2.x+ | Source code management | Industry standard; integrates with all CI/CD platforms |
| **CI/CD (Optional)** | GitHub Actions | Latest | Automated testing and deployment | Free for public repos; excellent Supabase integration; widely used |

---
