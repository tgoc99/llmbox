# Personifeed Unsubscribe Feature - Implementation Plan

## Overview

Add unsubscribe functionality to allow users to opt-out of receiving daily newsletters while maintaining their data for potential re-subscription. This feature will include an unsubscribe link in every newsletter, a dedicated unsubscribe page, and email-based unsubscribe handling.

## Goals

- **Primary**: Allow users to easily unsubscribe from newsletters
- **Secondary**: Maintain user data for potential re-subscription
- **Compliance**: Meet email marketing best practices and legal requirements (CAN-SPAM, GDPR)
- **User Experience**: Provide multiple unsubscribe methods (link, email reply)

## User Stories

1. **As a user**, I want to click an unsubscribe link in my newsletter so I can stop receiving emails immediately
2. **As a user**, I want to reply "unsubscribe" to stop receiving newsletters via email
3. **As a user**, I want confirmation when I unsubscribe so I know it worked
4. **As a user**, I want to easily re-subscribe if I change my mind
5. **As a compliance officer**, I need unsubscribe functionality to meet legal requirements

## Technical Approach

### Architecture Changes

```
User Journey:
1. User receives newsletter with unsubscribe link in footer
2. User clicks link → redirected to unsubscribe page
3. User confirms unsubscribe → API call sets user.active = false
4. User sees confirmation message with re-subscribe option
5. Cron job skips user (active = false)

Alternative: Email-based unsubscribe
1. User replies to newsletter with "unsubscribe" or similar keyword
2. personifeed-reply function detects unsubscribe intent
3. Sets user.active = false
4. Sends confirmation email
```

### Database Changes

**No schema changes required** - the `users.active` boolean already exists:
```sql
-- Already in schema:
-- active BOOLEAN DEFAULT TRUE
```

**Add index for queries**:
```sql
-- Already exists:
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE active = TRUE;
```

### Components to Build

#### 1. New Edge Function: `personifeed-unsubscribe`

**Purpose**: Handle unsubscribe requests from the web

**Location**: `supabase/functions/personifeed-unsubscribe/`

**Files**:
- `index.ts` - Main handler
- `database.ts` - Database operations
- `validation.ts` - Input validation

**API Contract**:
```typescript
// POST /functions/v1/personifeed-unsubscribe
{
  "email": "user@example.com",
  "token": "base64_encoded_user_id_with_signature" // For security
}

// Response
{
  "success": true,
  "message": "You've been unsubscribed. We're sorry to see you go!"
}
```

**Security**:
- Token-based verification (prevent malicious unsubscribes)
- Token = base64(userId + timestamp + HMAC signature)
- Token expires after 90 days
- Rate limiting (10 requests per IP per minute)

**Database Operations**:
```typescript
// Set user.active = false
const unsubscribeUser = async (userId: string): Promise<void> => {
  await supabase
    .from('users')
    .update({ active: false })
    .eq('id', userId);
};

// For re-subscribe functionality
const resubscribeUser = async (userId: string): Promise<void> => {
  await supabase
    .from('users')
    .update({ active: true })
    .eq('id', userId);
};
```

#### 2. Update: `personifeed-cron/emailSender.ts`

**Add unsubscribe link to newsletter footer**:

```typescript
// Current footer:
---
Reply to this email to customize future newsletters.

// New footer:
---
Reply to this email to customize future newsletters.

Don't want to receive these emails? [Unsubscribe](https://personifeed.llmbox.pro/unsubscribe?token=xxx)
```

**Token Generation**:
```typescript
const generateUnsubscribeToken = (userId: string): string => {
  const timestamp = Date.now().toString();
  const payload = `${userId}:${timestamp}`;
  const signature = createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('base64');

  return btoa(`${payload}:${signature}`);
};
```

#### 3. Update: `personifeed-reply/index.ts`

**Add keyword detection for unsubscribe requests**:

```typescript
const UNSUBSCRIBE_KEYWORDS = [
  'unsubscribe',
  'stop',
  'cancel',
  'opt out',
  'opt-out',
  'remove me',
  'no more',
];

const detectUnsubscribeIntent = (body: string): boolean => {
  const normalized = body.toLowerCase().trim();
  return UNSUBSCRIBE_KEYWORDS.some(keyword =>
    normalized.includes(keyword)
  );
};
```

**Handler Logic**:
```typescript
// In handleReply function, before storing feedback:
if (detectUnsubscribeIntent(body)) {
  await unsubscribeUser(user.id);
  await sendUnsubscribeConfirmation(user.id, from);
  return Response(200); // Skip feedback storage
}

// Otherwise, continue with normal feedback flow
```

**Confirmation Email**:
```typescript
const sendUnsubscribeConfirmation = async (
  userId: string,
  email: string
): Promise<void> => {
  const subject = "You've been unsubscribed from personi[feed]";
  const body = `
You've successfully unsubscribed from personi[feed] daily newsletters.

We're sorry to see you go! If this was a mistake, you can re-subscribe anytime at:
https://personifeed.llmbox.pro/resubscribe?token=${generateToken(userId)}

Thanks for being part of personi[feed].
  `.trim();

  // Send via SendGrid
};
```

#### 4. New Web Page: `web/app/personifeed/unsubscribe/page.tsx`

**Purpose**: Landing page for unsubscribe confirmations

**Features**:
- Parse token from URL query parameter
- Verify token signature and expiration
- Call unsubscribe API
- Show confirmation message
- Provide re-subscribe link

**UI States**:
1. **Loading**: "Processing your request..."
2. **Success**: "You've been unsubscribed. Sorry to see you go!"
3. **Error (invalid token)**: "This unsubscribe link is invalid or expired."
4. **Error (already unsubscribed)**: "You're already unsubscribed."

**Components**:
```typescript
// UnsubscribePage.tsx
- Parse URL parameters
- Verify token
- Call API
- Display status

// ResubscribeButton.tsx (optional component for future)
- Generate new token
- Call resubscribe API
```

#### 5. New Web Page: `web/app/personifeed/resubscribe/page.tsx`

**Purpose**: Allow users to re-subscribe

**Features**:
- Similar to unsubscribe page
- Sets user.active = true
- Shows success message
- Explains when next newsletter arrives

### Security Considerations

#### Token Security
- Use HMAC-SHA256 for signature verification
- Include timestamp to prevent replay attacks
- Token expiration: 90 days
- Store secret key in Supabase secrets: `UNSUBSCRIBE_SECRET_KEY`

#### Rate Limiting
- Prevent abuse of unsubscribe endpoint
- 10 requests per IP per minute
- Use Supabase Edge Function rate limiting or implement custom

#### Email Validation
- Verify email exists in database before unsubscribe
- Prevent information leakage (don't reveal if email exists)
- Return generic success message regardless

### Testing Strategy

#### Unit Tests

**Location**: `tests/unit/unsubscribe.test.ts`

```typescript
// Test cases:
- Token generation and verification
- Token expiration validation
- HMAC signature validation
- Keyword detection for email-based unsubscribe
- Database operations (mock)
```

#### Integration Tests

**Location**: `tests/integration/personifeed-unsubscribe.test.ts`

```typescript
// Test cases:
- End-to-end unsubscribe via web
- End-to-end unsubscribe via email reply
- Re-subscribe flow
- Token tampering attempts
- Expired token handling
- Rate limiting
```

#### Manual Testing Checklist

1. Click unsubscribe link in newsletter → verify redirected to page
2. Confirm unsubscribe → verify user.active = false in database
3. Verify user no longer receives newsletters (wait for next cron)
4. Reply "unsubscribe" to newsletter → verify confirmation email
5. Click re-subscribe link → verify user.active = true
6. Sign up again with same email → verify works as existing user

### Email Template Updates

#### Newsletter Footer Template

```
---

Reply to this email to customize future newsletters.

Don't want to receive these emails? Unsubscribe:
{unsubscribeUrl}
```

#### Unsubscribe Confirmation Email

```
Subject: You've been unsubscribed from personi[feed]

You've successfully unsubscribed from personi[feed] daily newsletters.

We're sorry to see you go! If this was a mistake, you can re-subscribe anytime:
{resubscribeUrl}

Thanks for being part of personi[feed].

---
The personi[feed] team
```

### Configuration

#### Environment Variables (Supabase Secrets)

```bash
# New secret for token signing
UNSUBSCRIBE_SECRET_KEY=<random_256_bit_key>

# Existing secrets (no changes)
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...
PERSONIFEED_EMAIL_DOMAIN=personifeed.llmbox.pro
```

#### Next.js Environment Variables

```bash
# web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://nopocimtfthppwssohty.supabase.co
NEXT_PUBLIC_PERSONIFEED_DOMAIN=personifeed.llmbox.pro
```

### Deployment Steps

#### Phase 1: Backend (Edge Functions)
1. Create `personifeed-unsubscribe` function
2. Update `personifeed-reply` with keyword detection
3. Deploy functions: `deno task deploy:personifeed:all`
4. Set secret: `deno task secrets:set:key UNSUBSCRIBE_SECRET_KEY=xxx`
5. Test API endpoints directly (curl)

#### Phase 2: Email Templates
1. Update `personifeed-cron/emailSender.ts` with footer template
2. Add unsubscribe confirmation email function
3. Deploy: `deno task deploy:personifeed:cron`
4. Test with sample newsletter

#### Phase 3: Web Pages
1. Create unsubscribe page component
2. Create resubscribe page component
3. Test locally: `deno task web:dev`
4. Deploy to Vercel: `vercel deploy --prod`

#### Phase 4: Testing & Monitoring
1. Run integration tests
2. Test with real email account
3. Monitor logs for errors
4. Verify metrics in Supabase dashboard

### Monitoring & Metrics

#### Key Metrics to Track

```typescript
// Log events:
- unsubscribe_initiated (source: web, email)
- unsubscribe_completed
- unsubscribe_failed (reason: invalid_token, expired_token, etc.)
- resubscribe_initiated
- resubscribe_completed
```

#### Queries for Analytics

```sql
-- Unsubscribe rate
SELECT
  COUNT(*) FILTER (WHERE active = false) * 100.0 / COUNT(*) as unsubscribe_rate
FROM users;

-- Daily unsubscribe count
SELECT
  DATE(created_at) as date,
  COUNT(*) as unsubscribes
FROM users
WHERE active = false
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Re-subscribe count
-- (Track with custom events table in future)
```

### Cost Impact

**Minimal additional costs**:
- Edge function invocations: ~$0 (within free tier for low volume)
- SendGrid emails: ~$0 (confirmation emails within free tier)
- Storage: ~$0 (no additional data stored)

**Estimated**: < $1/month for 100 users

### Compliance Notes

#### CAN-SPAM Act Requirements
- ✅ Clear identification as advertisement (if applicable)
- ✅ Include valid physical postal address (add to footer)
- ✅ Provide clear opt-out mechanism (unsubscribe link)
- ✅ Honor opt-outs within 10 business days (instant in our case)

#### GDPR Requirements
- ✅ Explicit consent (user signs up intentionally)
- ✅ Easy withdrawal of consent (unsubscribe)
- ✅ Data retention policy (keep user data for re-subscription)
- ⏳ Right to be forgotten (Phase 2: add "delete my data" option)

### Future Enhancements (Post-MVP)

1. **Preference Center**: Fine-grained control (frequency, topics)
2. **Pause Subscription**: Temporary hold (vacation mode)
3. **Unsubscribe Feedback**: Survey on why they're leaving
4. **Bulk Unsubscribe**: Admin tool to manage users
5. **Unsubscribe Analytics Dashboard**: Visualize churn metrics
6. **Data Deletion**: Complete account removal option

### Success Criteria

1. ✅ Users can unsubscribe via link in < 5 seconds
2. ✅ Users can unsubscribe via email reply
3. ✅ Unsubscribed users receive 0 newsletters
4. ✅ Confirmation email sent within 10 seconds
5. ✅ Re-subscribe works without re-entering preferences
6. ✅ < 1% unsubscribe failures
7. ✅ 100% compliance with CAN-SPAM and GDPR

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token leakage | High | Use HMAC signatures, short expiration |
| Mass unsubscribe attack | Medium | Rate limiting, CAPTCHA (future) |
| Accidental unsubscribe | Low | Confirmation step, easy re-subscribe |
| Lost token | Low | Allow unsubscribe by email too |
| Database failure | High | Retry logic, error monitoring |

## File Changes Summary

### New Files
```
supabase/functions/personifeed-unsubscribe/
  ├── index.ts                    # Main handler
  ├── database.ts                 # DB operations
  ├── validation.ts               # Token verification
  └── tokenUtils.ts               # Token generation/validation

web/app/personifeed/
  ├── unsubscribe/
  │   └── page.tsx               # Unsubscribe landing page
  └── resubscribe/
      └── page.tsx               # Re-subscribe landing page

tests/unit/
  └── unsubscribe.test.ts        # Unit tests

tests/integration/
  └── personifeed-unsubscribe.test.ts  # Integration tests

docs/
  └── personifeed-unsubscribe-plan.md  # This file
```

### Modified Files
```
supabase/functions/personifeed-cron/emailSender.ts
  - Add unsubscribe link to footer
  - Add token generation utility
  - Add unsubscribe confirmation email

supabase/functions/personifeed-reply/index.ts
  - Add keyword detection
  - Add unsubscribe flow handling
  - Add confirmation email

deno.json
  - Add deploy task for unsubscribe function
  - Add test task for unsubscribe tests

PERSONIFEED-README.md
  - Document unsubscribe functionality
  - Update roadmap (mark as complete)
```

## Implementation Checklist

### Backend
- [ ] Create `personifeed-unsubscribe` Edge Function
- [ ] Add token generation utility
- [ ] Add token verification utility
- [ ] Implement database operations (unsubscribe/resubscribe)
- [ ] Update `emailSender.ts` with footer template
- [ ] Update `personifeed-reply` with keyword detection
- [ ] Add unsubscribe confirmation email
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Deploy functions
- [ ] Set secrets

### Frontend
- [ ] Create unsubscribe page component
- [ ] Create resubscribe page component
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success messages
- [ ] Test responsive design
- [ ] Deploy to Vercel

### Testing
- [ ] Test unsubscribe via web link
- [ ] Test unsubscribe via email reply
- [ ] Test re-subscribe flow
- [ ] Test token expiration
- [ ] Test invalid token handling
- [ ] Test rate limiting
- [ ] Verify cron skips inactive users
- [ ] Manual end-to-end test

### Documentation
- [ ] Update PERSONIFEED-README.md
- [ ] Update API documentation
- [ ] Add troubleshooting guide
- [ ] Update deployment checklist
- [ ] Document monitoring queries

### Compliance
- [ ] Add physical address to footer
- [ ] Verify CAN-SPAM compliance
- [ ] Verify GDPR compliance
- [ ] Document data retention policy
- [ ] Add privacy policy link (future)

## Estimated Timeline

- **Backend Development**: 4-6 hours
- **Frontend Development**: 3-4 hours
- **Testing**: 2-3 hours
- **Documentation**: 1-2 hours
- **Deployment & Verification**: 1-2 hours

**Total**: 11-17 hours (1.5-2 days for one developer)

## Questions to Resolve

1. Should we track unsubscribe reasons? (survey on unsubscribe page)
2. Should we delete user data after X days of inactivity?
3. Should we support "pause" in addition to "unsubscribe"?
4. Should we add CAPTCHA to prevent abuse?
5. Should we send a "we miss you" email after X days?

## References

- CAN-SPAM Act: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- GDPR Email Marketing: https://gdpr.eu/email-marketing/
- SendGrid Best Practices: https://sendgrid.com/blog/email-best-practices/
- Unsubscribe Link Requirements: https://developers.google.com/gmail/markup/reference/one-click-unsubscribe

