# personi[feed] - Daily AI Newsletter Product Requirements Document (PRD)

## Goals and Background Context

### Goals

1. **Daily personalized AI newsletters** - Users receive a custom AI-generated newsletter tailored to their interests every day at 11am ET
2. **Zero friction onboarding** - No password, no sign-in, just email + initial prompt
3. **User-directed customization** - Users can reply to any newsletter to refine future content
4. **Rapid MVP deployment** - Leverage existing llmbox infrastructure and code for fast time-to-market
5. **Scalable architecture** - Database-backed design supports growth and feature expansion

### Background Context

Daily newsletters remain one of the highest-engagement content formats, yet most are generic and not personalized to individual preferences. personi[feed] bridges this gap by allowing users to define exactly what they want in their daily digest using natural language prompts.

The MVP focuses on **core functionality**: daily scheduled newsletter generation and email-based customization. By leveraging the existing llmbox codebase (OpenAI integration, SendGrid, Next.js), development time is drastically reduced.

Unlike llmbox (which is conversational and stateless), personi[feed] requires persistence to store user preferences and track customizations over time.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-09 | 1.0 | Initial PRD | PM Agent |

---

## Requirements

### Functional Requirements

**FR1**: Landing page for newsletter signup
- Next.js landing page with email input field
- Large text area for initial prompt (e.g., "Send me the top 3 AI news stories, a motivational quote, and the weather in NYC")
- Submit button to register for daily newsletter
- No password or authentication required
- Validates email format before submission
- Displays confirmation message after successful signup

**FR2**: Store user preferences in database
- Save user email and initial prompt to Supabase PostgreSQL
- Track when user signed up (created_at timestamp)
- Store all customization prompts from reply emails
- Each user identified by email address (unique constraint)

**FR3**: Daily newsletter generation via cron job
- Supabase Edge Function triggered by cron at 11:00am ET daily
- Fetch all active users from database
- For each user, collect initial prompt + all customization feedback
- Generate newsletter content via OpenAI API with specialized system prompt
- Send personalized newsletter to user via SendGrid

**FR4**: Email-based customization via replies
- Users can reply to any newsletter email
- Reply email triggers Supabase Edge Function (SendGrid Inbound Parse webhook)
- Extract user email and reply content
- Store feedback in database linked to user
- Send confirmation email: "Thanks! Your feedback will be reflected in tomorrow's newsletter."
- Do NOT generate new newsletter immediately

**FR5**: Newsletter content generation
- System prompt: "You are creating a personalized daily newsletter. Use the user's preferences and any customization feedback to generate relevant, engaging content."
- Combine user's initial prompt + all feedback strings into context for LLM
- Generate newsletter with proper formatting (markdown or plain text)
- Include date/time in newsletter header
- Keep newsletter concise (target: 500-1000 words)

**FR6**: Error handling
- Invalid email format on signup: Show error message on landing page
- Duplicate email signup: Show error message telling them to respond to email instead
- User not found on reply: Create new user with reply as initial prompt
- OpenAI API failure: Log error, skip user for that day, retry next day
- SendGrid failure: Log error, attempt retry with exponential backoff

### Non-Functional Requirements

**NFR1**: Performance targets
- Landing page load time: < 2 seconds
- Newsletter generation per user: < 60 seconds
- Total cron job execution time: < 5 minutes for 100 users (parallelizable)
- Reply confirmation email: < 10 seconds

**NFR2**: Database performance
- Use Supabase PostgreSQL (free tier: 500MB)
- Indexes on user email and created_at columns
- Query optimization for daily fetch (fetch all active users in single query)

**NFR3**: Cost optimization
- Target free tiers: Supabase (500MB DB), Vercel (hosting), SendGrid (100 emails/day)
- OpenAI cost: ~$0.01 per newsletter (gpt-4o-mini), ~$1/day for 100 users
- Total monthly cost for 100 users: ~$30 (primarily OpenAI)

**NFR4**: Reliability
- Cron job must execute reliably at 11am ET daily (use Supabase Cron)
- Failed newsletter sends should not block other users
- Email deliverability: Use verified SendGrid sender domain
- Retry logic for transient API failures

**NFR5**: Security
- No passwords required, but validate email ownership via email delivery
- API keys stored in Supabase secrets
- Input validation on all user-provided content (initial prompt, feedback)
- Sanitize prompts to prevent prompt injection attacks

---

## Technical Assumptions

### Repository Structure: Monorepo (shared with llmbox)
- Single repository for both llmbox and personi[feed]
- Separate Supabase Edge Functions for each service but shared folder with utils per this https://supabase.com/docs/guides/functions/development-tips
- Shared web landing pages (separate directories)
- Shared utilities where applicable (logger, config, retry logic, e-mail sending)

### Service Architecture: Serverless + Database
- Supabase Edge Functions for compute (3 functions):
  1. `personifeed-signup` - Handle landing page form submissions
  2. `personifeed-cron` - Daily newsletter generation (cron-triggered)
  3. `personifeed-reply` - Handle reply emails (webhook-triggered)
- Supabase PostgreSQL for data persistence
- Supabase Cron for scheduled execution
- Next.js 14 for landing page (deployed to Vercel)

### Testing Requirements: Unit + Integration + Manual
- Unit tests for newsletter generation logic
- Unit tests for prompt formatting
- Integration tests for database operations
- Integration tests for OpenAI API calls
- Integration tests for SendGrid sends
- Manual testing for end-to-end signup → newsletter → reply flow

### Core Technologies

**Runtime & Language:**
- **Deno** (Supabase Edge Functions runtime)
- **TypeScript** - Type safety for all logic

**Frontend:**
- **Next.js 14** (App Router)
- **React 18**
- **TailwindCSS** - Styling

**Backend:**
- **Supabase Edge Functions** - Serverless compute
- **Supabase PostgreSQL** - Data persistence
- **Supabase Cron** - Scheduled jobs

**Email Infrastructure:**
- **SendGrid Inbound Parse** - Receive reply emails
- **SendGrid Send API** - Send newsletters and confirmations

**LLM Integration:**
- **OpenAI API** - Newsletter generation (gpt-4o-mini or gpt-4o)
- **OpenAI Responses API** - Structured newsletter generation

**Reused from llmbox:**
- Email sending logic (emailSender.ts)
- Email parsing logic (emailParser.ts)
- OpenAI client (llmClient.ts - adapted for newsletter generation)
- Structured logging (logger.ts)
- Retry logic (retryLogic.ts)
- Configuration management (config.ts)
- Next.js + TailwindCSS setup

### Additional Technical Assumptions

**Database Schema:**
- `users` table: id, email, created_at, active
- `customizations` table: id, user_id, content, type (initial | feedback), created_at
- `newsletters` table: id, user_id, content, sent_at, status (pending | sent | failed)

**Cron Configuration:**
- Run daily at 11:00am ET (UTC-5 or UTC-4 depending on DST)
- Use Supabase cron syntax: `0 11 * * *` (adjusted for timezone)
- Handle timezone conversion in Edge Function

**Email Processing:**
- Replies maintain email threading (In-Reply-To headers)
- Confirmation emails are simple text (no HTML)
- Newsletters can be plain text or basic HTML (markdown-to-HTML conversion)
- Maximum prompt length: 2000 characters

**LLM Configuration:**
- Model: gpt-4o-mini (cost-effective) or gpt-4o (higher quality)
- System prompt emphasizes personalization and brevity
- Token limits: 8000 tokens input, 2000 tokens output
- Temperature: 0.7 (balanced creativity)
- Include web search if beneficial (ENABLE_WEB_SEARCH=true)

---

## Epic List

**Epic 1: Foundation & Landing Page**
Develop landing page, database schema, and signup flow - allowing users to register for daily newsletters.

**Epic 2: Newsletter Generation & Delivery**
Implement cron-triggered newsletter generation, OpenAI integration, and email delivery - delivering the core MVP functionality.

**Epic 3: Reply Handling & Customization**
Add reply email webhook, feedback storage, and confirmation emails - enabling user-directed customization.

---

## Epic 1: Foundation & Landing Page

**Epic Goal**: Create landing page with signup form, establish database schema, and implement signup flow to allow users to register for daily newsletters.

### Story 1.1: Database Schema & Setup

**As a** developer,
**I want** the database schema and Supabase project configured,
**so that** I can store user preferences and newsletter data.

#### Acceptance Criteria

1. Supabase project created (or reuse existing llmbox project with separate tables)
2. SQL migration created with following tables:
   - `users` (id UUID, email VARCHAR UNIQUE, created_at TIMESTAMP, active BOOLEAN)
   - `customizations` (id UUID, user_id UUID, content TEXT, type VARCHAR, created_at TIMESTAMP)
   - `newsletters` (id UUID, user_id UUID, content TEXT, sent_at TIMESTAMP, status VARCHAR)
3. Foreign key constraints: customizations.user_id → users.id, newsletters.user_id → users.id
4. Indexes created: users.email, customizations.user_id, newsletters.user_id
5. Row Level Security (RLS) policies disabled for MVP (service role access only)
6. Migration applied successfully via Supabase CLI
7. Test data inserted and queryable

### Story 1.2: Landing Page Design & Implementation

**As a** potential user,
**I want** an attractive landing page that explains personi[feed],
**so that** I understand the service and can sign up easily.

#### Acceptance Criteria

1. Next.js 14 app created in `web-personifeed/` directory
2. Landing page includes:
   - Hero section with service name and tagline
   - Clear value proposition (e.g., "Your AI-powered daily digest, tailored to you")
   - Email input field (validated)
   - Large text area for initial prompt with placeholder example
   - Submit button ("Start My Daily Newsletter")
   - Character count for prompt (max 2000)
3. Responsive design (mobile, tablet, desktop)
4. TailwindCSS styling matching modern design standards
5. Form validation: email format, non-empty prompt
6. Loading state on submit (spinner + disabled button)
7. Success message after submission
8. Error handling with user-friendly messages

### Story 1.3: Signup API Endpoint

**As a** user,
**I want** to submit my email and preferences,
**so that** I receive my first newsletter tomorrow.

#### Acceptance Criteria

1. Supabase Edge Function created: `personifeed-signup`
2. Function accepts POST requests with JSON body: `{ email, initialPrompt }`
3. Function validates email format (regex)
4. Function validates prompt length (1-2000 characters)
5. Function checks if user exists (query by email)
6. If user exists: Update customizations table with new initial customization
7. If new user: Insert into users table, insert initial customization into customizations table
8. Function returns 200 OK with success message
9. Function returns 400 for validation errors
10. Function returns 500 for database errors
11. All operations logged with structured logging
12. Integration test: Submit signup, verify database entry

### Story 1.4: Landing Page Integration

**As a** developer,
**I want** the landing page form to call the signup API,
**so that** user signups are persisted to the database.

#### Acceptance Criteria

1. Form submit handler calls `personifeed-signup` Edge Function
2. Success response: Display "Success! Your first newsletter arrives tomorrow at 11am ET."
3. Error response: Display error message to user
4. Form resets after successful submission
5. Loading spinner shown during API call
6. Network errors handled gracefully
7. CORS configured correctly (Edge Function allows web domain)
8. Manual test: Submit form, verify database entry, receive success message
9. Manual test: Invalid email shows error
10. Manual test: Empty prompt shows error

---

## Epic 2: Newsletter Generation & Delivery

**Epic Goal**: Implement cron-triggered newsletter generation, OpenAI API integration, and SendGrid email delivery to provide daily personalized newsletters.

### Story 2.1: Newsletter Generation Logic

**As a** developer,
**I want** a function that generates personalized newsletter content,
**so that** each user receives relevant, engaging content.

#### Acceptance Criteria

1. Function `generateNewsletter(userId)` created
2. Function fetches user email from users table
3. Function fetches all customizations for user (initial + feedback) ordered by created_at
4. Function formats context for LLM:
   - System prompt: "You are creating a personalized daily newsletter..."
   - User context: Initial prompt + all feedback strings combined
5. Function calls OpenAI API using reused llmClient (adapted)
6. Function formats newsletter with:
   - Header: "Your Daily Digest - [Date]"
   - Generated content
   - Footer: "Reply to customize future newsletters"
7. Function returns newsletter content as string
8. Unit test: Mock OpenAI response, verify formatting
9. Integration test: Real OpenAI call, verify content quality

### Story 2.2: Cron Job Setup

**As a** user,
**I want** newsletters delivered automatically every day at 11am ET,
**so that** I receive timely, consistent content.

#### Acceptance Criteria

1. Supabase Edge Function created: `personifeed-cron`
2. Function configured with cron trigger: `0 11 * * *` (11am ET, adjusted for timezone)
3. Function queries all active users from database (WHERE active = true)
4. For each user, function calls `generateNewsletter(userId)`
5. Function stores generated content in newsletters table (status = pending)
6. Function sends email via SendGrid (reuse emailSender.ts)
7. On successful send: Update newsletters.status = sent, set sent_at timestamp
8. On failed send: Update newsletters.status = failed, log error
9. Function continues processing remaining users if one fails
10. Function logs execution metrics: total users, successful sends, failed sends, duration
11. Manual test: Trigger cron manually, verify all active users receive newsletters

### Story 2.3: Newsletter Email Formatting

**As a** user,
**I want** newsletters formatted clearly and professionally,
**so that** they are pleasant to read.

#### Acceptance Criteria

1. Email subject: "Your Daily Digest - [Date]"
2. Email from: `newsletter@mail.personifeed.com` (or configured sender)
3. Email to: User's registered email
4. Email body: Plain text or HTML (based on configuration)
5. Plain text format:
   - Header with date
   - Generated content (line breaks preserved)
   - Footer with instructions to reply
6. HTML format (optional):
   - Basic styling (headings, paragraphs)
   - Responsive design
7. Email includes unsubscribe instructions (future: link to unsubscribe page)
8. Manual test: Receive newsletter, verify formatting on multiple email clients

### Story 2.4: Error Handling & Retry Logic

**As a** system administrator,
**I want** robust error handling for newsletter generation,
**so that** transient failures don't prevent delivery.

#### Acceptance Criteria

1. OpenAI API failures: Retry with exponential backoff (reuse retryLogic.ts)
2. After 3 failed attempts: Log error, skip user, mark newsletter as failed
3. SendGrid API failures: Retry with exponential backoff
4. After 3 failed attempts: Log error, mark newsletter as failed
5. Database errors: Log critical error, continue processing other users
6. Function never throws unhandled exceptions (all errors caught and logged)
7. Cron job execution timeout: 5 minutes (sufficient for 100 users)
8. Logs include user email, error type, retry attempts
9. Integration test: Simulate OpenAI timeout, verify retry and eventual failure

---

## Epic 3: Reply Handling & Customization

**Epic Goal**: Add reply email webhook, feedback storage, and confirmation emails to enable user-directed customization of future newsletters.

### Story 3.1: Reply Webhook Endpoint

**As a** user,
**I want** to reply to newsletters to customize future content,
**so that** my newsletter evolves with my preferences.

#### Acceptance Criteria

1. Supabase Edge Function created: `personifeed-reply`
2. Function accepts POST requests from SendGrid Inbound Parse webhook
3. Function parses email payload using reused emailParser.ts
4. Function extracts sender email and body text
5. Function queries users table to find user by email
6. If user not found: Create new user with reply as initial customization
7. If user found: Insert reply text into customizations table (type = 'feedback')
8. Function validates prompt length (max 2000 characters)
9. Function logs reply received with user email and prompt preview
10. SendGrid Inbound Parse configured with webhook URL
11. Integration test: Send test reply email, verify database entry

### Story 3.2: Confirmation Email

**As a** user,
**I want** confirmation that my feedback was received,
**so that** I know it will be reflected in tomorrow's newsletter.

#### Acceptance Criteria

1. After storing feedback, function generates confirmation email
2. Email subject: "Re: Your Daily Digest - [Date]"
3. Email body: "Thanks for your feedback! Your customization will be reflected in tomorrow's newsletter at 11am ET."
4. Email maintains threading (In-Reply-To and References headers)
5. Function sends email via SendGrid (reuse emailSender.ts)
6. If send fails: Log error but still return 200 to webhook (prevent retry loop)
7. Manual test: Reply to newsletter, receive confirmation email
8. Manual test: Email threading preserved in email client

### Story 3.3: Feedback Integration

**As a** user,
**I want** my feedback reflected in future newsletters,
**so that** the content improves over time.

#### Acceptance Criteria

1. Newsletter generation function fetches all customizations (initial + feedback)
2. Customizations ordered chronologically (oldest first)
3. Context sent to LLM includes: "User's initial request: [initial customization]. User feedback: [feedback 1, feedback 2, ...]"
4. LLM system prompt emphasizes incorporating feedback
5. Multiple feedback items combined into coherent context
6. Newsletter content reflects feedback (manual verification)
7. Manual test: Sign up → receive newsletter → send feedback → receive updated newsletter next day

### Story 3.4: User Management

**As a** system administrator,
**I want** basic user management capabilities,
**so that** I can handle edge cases and troubleshoot issues.

#### Acceptance Criteria

1. Users can be deactivated (active = false) via direct database update
2. Deactivated users excluded from daily newsletter cron job
3. No UI for user management in MVP (database access only)
4. Logs include user ID and email for troubleshooting
5. Future: Add unsubscribe link in newsletter footer
6. Future: Landing page to manage preferences

---

## Out of Scope (Post-MVP)

- **Unsubscribe page**: Self-service unsubscribe link in emails
- **Preference management page**: Web page to update prompts, change delivery time
- **Multiple newsletters per day**: Allow users to choose delivery frequency
- **Newsletter analytics**: Track open rates, click rates
- **Content personalization beyond prompts**: Learn from user engagement
- **Social sharing**: Share newsletter content on social media
- **Newsletter archives**: Web page to view past newsletters
- **Team/family plans**: Multiple users sharing preferences
- **Mobile app**: Native iOS/Android apps
- **Webhook signature verification**: SendGrid webhook authentication (use existing llmbox implementation)

---

## Success Metrics

### MVP Success Criteria (First 30 Days)

1. **Signups**: 50+ users
2. **Daily delivery rate**: >95% (newsletters delivered successfully)
3. **User engagement**: >20% reply with feedback at least once
4. **System uptime**: >99% (cron job executes daily without failures)
5. **Newsletter quality**: Subjective - positive feedback from early users

### Future Metrics (Post-MVP)

- Email open rate: >40%
- Click-through rate (if links included): >10%
- Retention rate: >80% after 30 days
- Average feedback interactions per user per month: >2
- User satisfaction score: >4/5

---

## Dependencies & Risks

### Dependencies

- **Supabase**: Database, Edge Functions, Cron - _Risk_: Service downtime affects all functionality
- **OpenAI API**: Newsletter generation - _Risk_: API outages or rate limits delay newsletters
- **SendGrid**: Email delivery - _Risk_: Email delivery issues or account suspension
- **llmbox codebase**: Reused utilities and patterns - _Risk_: Changes to llmbox may require updates

### Risks

1. **OpenAI API costs**: Unexpected usage spike increases costs - _Mitigation_: Set daily user limits, monitor costs
2. **Email deliverability**: Newsletters marked as spam - _Mitigation_: Use verified domain, follow SendGrid best practices
3. **Prompt injection attacks**: Users craft malicious prompts - _Mitigation_: Input validation, sanitization, OpenAI safety settings
4. **Cron job failures**: Missed daily execution - _Mitigation_: Monitoring, alerting, manual retry capability
5. **Database growth**: User and newsletter data exceeds free tier - _Mitigation_: Data retention policies, upgrade plan

---

## Timeline & Phasing

### MVP Phase (2-3 Weeks)

- **Week 1**: Epic 1 (Foundation & Landing Page)
- **Week 2**: Epic 2 (Newsletter Generation & Delivery)
- **Week 3**: Epic 3 (Reply Handling & Customization), testing, deployment

### Post-MVP Phase (Month 2+)

- Add unsubscribe functionality
- Implement preference management page
- Add webhook signature verification
- Newsletter analytics dashboard
- Content improvements based on user feedback

---

## Conclusion

personi[feed] MVP delivers a streamlined, personalized daily newsletter service with minimal development time by leveraging existing llmbox infrastructure. The database-backed architecture supports future growth and feature expansion while maintaining simplicity and cost-effectiveness.

