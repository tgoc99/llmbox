# Personifeed Confirmation Email - Implementation Plan

## Overview

Add a double opt-in confirmation email flow to verify user email addresses before starting newsletter delivery. This improves email deliverability, reduces spam complaints, meets best practices, and ensures users genuinely want to receive the newsletter.

## Goals

- **Primary**: Verify user email addresses before sending first newsletter
- **Secondary**: Reduce spam complaints and improve sender reputation
- **Compliance**: Meet email marketing best practices (double opt-in)
- **User Experience**: Set clear expectations and build trust
- **Security**: Prevent abuse and fake signups

## User Stories

1. **As a user**, I want to confirm my email address so I know my newsletters will arrive
2. **As a user**, I want to know exactly when my first newsletter will arrive
3. **As a user**, I want a clear welcome experience that builds trust
4. **As a product owner**, I want verified emails to improve deliverability rates
5. **As a product owner**, I want to prevent spam/fake signups

## Technical Approach

### Architecture Changes

```
Current Flow:
1. User submits signup form
2. User record created (active: true)
3. First newsletter arrives next day at 11am ET

New Flow (Double Opt-In):
1. User submits signup form
2. User record created (active: false, verified: false)
3. Confirmation email sent immediately
4. User clicks confirmation link
5. User record updated (active: true, verified: true)
6. Welcome email sent (optional)
7. First newsletter arrives next day at 11am ET
```

### Database Schema Changes

**Add new column to users table**:

```sql
-- Migration: 20251010000000_add_email_verification.sql

-- Add verification fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Add index for verification lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token
  ON users(verification_token)
  WHERE verification_token IS NOT NULL;

-- Update existing users to verified (grandfather them in)
UPDATE users SET verified = TRUE, verified_at = created_at WHERE verified = FALSE;

-- Update active column default to FALSE (new users start inactive)
ALTER TABLE users ALTER COLUMN active SET DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN users.verified IS 'Whether user has confirmed their email address';
COMMENT ON COLUMN users.verification_token IS 'Token for email verification (expires after 7 days)';
COMMENT ON COLUMN users.verification_sent_at IS 'When verification email was sent';
COMMENT ON COLUMN users.verified_at IS 'When user verified their email';
```

**Updated users table schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT FALSE,                    -- Changed: starts false
  verified BOOLEAN DEFAULT FALSE,                  -- New
  verification_token VARCHAR(255),                 -- New
  verification_sent_at TIMESTAMP WITH TIME ZONE,   -- New
  verified_at TIMESTAMP WITH TIME ZONE,            -- New

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);
```

### Components to Build

#### 1. New Edge Function: `personifeed-verify`

**Purpose**: Handle email verification from confirmation links

**Location**: `supabase/functions/personifeed-verify/`

**Files**:
- `index.ts` - Main handler
- `database.ts` - Database operations
- `validation.ts` - Token validation
- `emailSender.ts` - Welcome email

**API Contract**:
```typescript
// POST /functions/v1/personifeed-verify
{
  "token": "verification_token_from_email"
}

// Response
{
  "success": true,
  "message": "Email verified! Your first newsletter arrives tomorrow at 11am ET.",
  "userId": "uuid"
}
```

**Token Security**:
- Use cryptographically secure random token (32 bytes, base64)
- Store hashed version in database (SHA-256)
- Token expires after 7 days
- One-time use (invalidated after verification)
- Include rate limiting (10 attempts per hour per token)

**Database Operations**:
```typescript
// Verify user by token
const verifyUser = async (token: string): Promise<User | null> => {
  const hashedToken = createHash('sha256').update(token).digest('hex');

  const { data, error } = await supabase
    .from('users')
    .update({
      verified: true,
      active: true,
      verified_at: new Date().toISOString(),
      verification_token: null  // Invalidate token
    })
    .eq('verification_token', hashedToken)
    .eq('verified', false)  // Prevent re-verification
    .select()
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as User;
};

// Check token expiration
const isTokenExpired = (sentAt: Date): boolean => {
  const EXPIRY_DAYS = 7;
  const expiryTime = new Date(sentAt);
  expiryTime.setDate(expiryTime.getDate() + EXPIRY_DAYS);
  return new Date() > expiryTime;
};
```

#### 2. Update: `personifeed-signup/index.ts`

**Modify signup flow to send confirmation email instead of activating immediately**:

```typescript
// Current behavior:
const createUser = async (email: string): Promise<User> => {
  const { data } = await supabase
    .from('users')
    .insert({ email, active: true })  // Activated immediately
    .select()
    .single();
  return data;
};

// New behavior:
const createUser = async (email: string): Promise<User> => {
  // Generate verification token
  const token = generateVerificationToken();
  const hashedToken = hashToken(token);

  const { data } = await supabase
    .from('users')
    .insert({
      email,
      active: false,              // Starts inactive
      verified: false,            // Unverified
      verification_token: hashedToken,
      verification_sent_at: new Date().toISOString()
    })
    .select()
    .single();

  // Send confirmation email
  await sendConfirmationEmail(data.id, email, token);

  return data;
};
```

**Token Generation**:
```typescript
const generateVerificationToken = (): string => {
  // Generate 32 random bytes, encode as base64url
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};
```

#### 3. Update: `personifeed-signup/emailSender.ts`

**Add confirmation email function**:

```typescript
const sendConfirmationEmail = async (
  userId: string,
  email: string,
  token: string
): Promise<void> => {
  const startTime = Date.now();

  try {
    initializeSendGrid();

    const verifyUrl = `https://personifeed.llmbox.pro/verify?token=${token}`;

    const subject = "Confirm your personi[feed] subscription";

    const emailBody = `
Welcome to personi[feed]!

Click the link below to confirm your email address and start receiving your personalized daily newsletter:

${verifyUrl}

Once confirmed, your first newsletter will arrive tomorrow at 11am ET.

This link expires in 7 days.

---

Didn't sign up? You can safely ignore this email.
    `.trim();

    // Use a friendly "from" address for verification emails
    const fromAddress = `hello@${config.personifeedEmailDomain}`;

    const msg = {
      to: email,
      from: fromAddress,
      subject,
      text: emailBody,
    };

    logInfo('confirmation_email_send_started', {
      userId,
      email,
      verifyUrl,
    });

    await withRetry(async () => {
      await sgMail.send(msg);
    });

    logInfo('confirmation_email_sent', {
      userId,
      email,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    logError('confirmation_email_failed', {
      userId,
      email,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });

    throw new EmailError('Failed to send confirmation email', {
      userId,
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
```

**Optional: Welcome email after verification**:
```typescript
const sendWelcomeEmail = async (
  userId: string,
  email: string
): Promise<void> => {
  const subject = "You're all set! 🎉";
  const body = `
Thanks for confirming your email!

Your first personi[feed] newsletter will arrive tomorrow at 11am ET.

Here's what you can expect:
• AI-generated content tailored to your interests
• Delivered daily at 11am ET
• Reply anytime to customize future newsletters

We're excited to have you on board!

---
The personi[feed] team
  `.trim();

  const fromAddress = `hello@${config.personifeedEmailDomain}`;

  const msg = {
    to: email,
    from: fromAddress,
    subject,
    text: body,
  };

  // Send with retry, but don't throw on failure (welcome email is nice-to-have)
  try {
    await withRetry(async () => {
      await sgMail.send(msg);
    });
  } catch (error) {
    logError('welcome_email_failed', { userId, email, error });
  }
};
```

#### 4. Update: `personifeed-cron/index.ts`

**Modify to only process verified users**:

```typescript
// Current query:
const getAllActiveUsers = async (): Promise<User[]> => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('active', true);
  return data || [];
};

// Updated query:
const getAllActiveUsers = async (): Promise<User[]> => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('active', true)
    .eq('verified', true);  // Only verified users
  return data || [];
};
```

**Add logging for skipped users**:
```typescript
logInfo('users_fetched', {
  count: users.length,
  filter: 'active=true AND verified=true',
});
```

#### 5. New Web Page: `web/app/personifeed/verify/page.tsx`

**Purpose**: Handle email verification from links

**Features**:
- Parse token from URL query parameter
- Call verify API with token
- Show verification status (loading, success, error)
- Redirect to signup page on success (optional)
- Handle expired/invalid tokens

**UI States**:
1. **Loading**: "Verifying your email..."
2. **Success**: "Email verified! Your first newsletter arrives tomorrow at 11am ET."
3. **Error (invalid token)**: "This verification link is invalid."
4. **Error (expired token)**: "This verification link has expired. Please sign up again."
5. **Error (already verified)**: "This email is already verified!"

**Implementation**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type VerificationState = 'loading' | 'success' | 'error';

const VerifyPage = (): JSX.Element => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async (): Promise<void> => {
      if (!token) {
        setState('error');
        setMessage('No verification token provided.');
        return;
      }

      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/personifeed-verify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setState('success');
          setMessage(data.message);
        } else {
          setState('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
      } catch (error) {
        setState('error');
        setMessage('Network error. Please check your connection.');
      }
    };

    verifyEmail();
  }, [token]);

  // Render UI based on state...
};
```

#### 6. Update: `web/app/personifeed/page.tsx`

**Update success message to mention confirmation email**:

```typescript
// Current message:
"Success! Your first newsletter arrives tomorrow at 11am ET."

// New message:
"Check your email! We sent you a confirmation link to get started."
```

**Add explanatory text**:
```typescript
<p className="text-sm text-gray-500 mt-2">
  Click the link in the email to confirm your subscription.
  Your first newsletter arrives the day after confirmation at 11am ET.
</p>
```

### Security Considerations

#### Token Security
- **Random Generation**: Use cryptographically secure random generator
- **Hashing**: Store SHA-256 hash, never plaintext token
- **Expiration**: 7-day expiration window
- **One-Time Use**: Invalidate token after successful verification
- **Rate Limiting**: 10 verification attempts per hour per token

#### Preventing Abuse
- **Email Validation**: Strict validation before sending
- **Rate Limiting**: Max 3 signups per email per day
- **Honeypot**: Add hidden field to signup form (future)
- **CAPTCHA**: Add reCAPTCHA for high-volume signups (future)

#### Token URL Safety
- **Base64URL Encoding**: Use URL-safe characters (-, _, no =)
- **HTTPS Only**: All verification links use HTTPS
- **No Token Logging**: Never log full tokens in plaintext

### Testing Strategy

#### Unit Tests

**Location**: `tests/unit/verification.test.ts`

```typescript
// Test cases:
- Token generation (randomness, length, format)
- Token hashing (deterministic, correct algorithm)
- Token expiration validation
- Database operations (mock)
- Email sending (mock SendGrid)
```

#### Integration Tests

**Location**: `tests/integration/personifeed-verification.test.ts`

```typescript
// Test cases:
- End-to-end signup → confirmation → verification
- Expired token handling
- Invalid token handling
- Already verified handling
- Re-sending verification email
- Token tampering attempts
- Verification email delivery
- Welcome email delivery (optional)
```

#### Manual Testing Checklist

1. Sign up with new email → verify confirmation email sent
2. Click verification link → verify redirect and success message
3. Check database: user.verified = true, user.active = true
4. Wait for next cron → verify newsletter arrives
5. Try verification link again → verify "already verified" error
6. Sign up with expired token (manipulate DB) → verify error
7. Sign up with same email twice → verify appropriate handling

### Email Template Updates

#### Confirmation Email Template

```
Subject: Confirm your personi[feed] subscription

Welcome to personi[feed]!

Click the link below to confirm your email address and start receiving your personalized daily newsletter:

{verifyUrl}

Once confirmed, your first newsletter will arrive tomorrow at 11am ET.

This link expires in 7 days.

---

Didn't sign up? You can safely ignore this email.
```

#### Welcome Email Template (Optional)

```
Subject: You're all set! 🎉

Thanks for confirming your email!

Your first personi[feed] newsletter will arrive tomorrow at 11am ET.

Here's what you can expect:
• AI-generated content tailored to your interests
• Delivered daily at 11am ET
• Reply anytime to customize future newsletters

We're excited to have you on board!

---
The personi[feed] team
```

### Configuration

#### Environment Variables (Supabase Secrets)

```bash
# Existing secrets (no changes needed)
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

#### Phase 1: Database Migration
1. Create migration file: `20251010000000_add_email_verification.sql`
2. Review migration (especially UPDATE for existing users)
3. Test migration on local Supabase instance
4. Apply migration: `deno task db:push`
5. Verify schema changes in Supabase dashboard

#### Phase 2: Backend (Edge Functions)
1. Create `personifeed-verify` function
2. Update `personifeed-signup` with confirmation flow
3. Update `personifeed-cron` with verified filter
4. Add email templates to emailSender
5. Deploy functions: `deno task deploy:personifeed:all`
6. Test API endpoints directly (curl)

#### Phase 3: Web Page
1. Create verify page component
2. Test locally: `deno task web:dev`
3. Deploy to Vercel: `vercel deploy --prod`

#### Phase 4: Testing & Monitoring
1. Run integration tests
2. Test with real email account
3. Monitor logs for errors
4. Verify metrics in Supabase dashboard

### Monitoring & Metrics

#### Key Metrics to Track

```typescript
// Log events:
- signup_initiated
- confirmation_email_sent
- confirmation_email_failed
- verification_initiated
- verification_completed
- verification_failed (reason: expired, invalid, etc.)
- welcome_email_sent (optional)
```

#### Queries for Analytics

```sql
-- Verification rate (% of signups that verify)
SELECT
  COUNT(*) FILTER (WHERE verified = true) * 100.0 / COUNT(*) as verification_rate
FROM users;

-- Average time to verify
SELECT
  AVG(EXTRACT(EPOCH FROM (verified_at - verification_sent_at))) / 3600 as avg_hours_to_verify
FROM users
WHERE verified = true AND verified_at IS NOT NULL;

-- Expired tokens (never verified)
SELECT COUNT(*) as expired_signups
FROM users
WHERE verified = false
  AND verification_sent_at < NOW() - INTERVAL '7 days';

-- Daily verification counts
SELECT
  DATE(verified_at) as date,
  COUNT(*) as verifications
FROM users
WHERE verified = true
GROUP BY DATE(verified_at)
ORDER BY date DESC;
```

### Handling Edge Cases

#### 1. Existing Users (Re-signup)
```typescript
// In personifeed-signup/index.ts
if (existingUser) {
  if (existingUser.verified) {
    // Already verified - add customization as before
    await addCustomization(existingUser.id, prompt, 'initial');
    return { message: "Welcome back! Updated your preferences." };
  } else {
    // Unverified - resend confirmation email with new token
    const newToken = generateVerificationToken();
    await updateVerificationToken(existingUser.id, newToken);
    await sendConfirmationEmail(existingUser.id, email, newToken);
    return { message: "Confirmation email resent. Check your inbox!" };
  }
}
```

#### 2. Token Expiration Cleanup (Cron Job)
```sql
-- Add cleanup query to a weekly cron job
DELETE FROM users
WHERE verified = false
  AND verification_sent_at < NOW() - INTERVAL '30 days';
```

#### 3. Rate Limiting Signups
```typescript
// Prevent abuse: max 3 signups per email per day
const checkSignupRateLimit = async (email: string): Promise<boolean> => {
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  return (count || 0) < 3;
};
```

### Cost Impact

**Additional costs**:
- SendGrid: 1 confirmation email per signup (~3,000/month for 100 users)
  - Cost: $0 (within free tier of 100 emails/day)
- Edge function invocations: 1 per verification (~3,000/month)
  - Cost: $0 (within free tier)
- Database storage: 4 new columns per user (~100 bytes per user)
  - Cost: ~$0 (negligible)

**Total estimated additional cost**: $0/month for 100 users

### Compliance & Best Practices

#### Double Opt-In Benefits
- ✅ Prevents spam complaints
- ✅ Improves email deliverability (sender reputation)
- ✅ Ensures genuine user intent
- ✅ Reduces invalid/fake email addresses
- ✅ Better engagement rates (verified users are more engaged)

#### GDPR Compliance
- ✅ Explicit consent (user clicks verification link)
- ✅ Clear communication (explains what they're signing up for)
- ✅ Audit trail (verification timestamp stored)

#### CAN-SPAM Compliance
- ✅ Not required for transactional emails (verification is transactional)
- ✅ Improves compliance for marketing emails (newsletters)

### Future Enhancements (Post-MVP)

1. **Resend Verification Email**: Button on verify page to resend
2. **Verification Reminders**: Email reminder after 3 days if unverified
3. **Email Change Flow**: Allow users to change email with re-verification
4. **SMS Verification**: Alternative verification method
5. **Magic Links**: Passwordless login for preference management
6. **Verification Analytics Dashboard**: Visualize conversion funnel

### Success Criteria

1. ✅ 90%+ of signups receive confirmation email within 10 seconds
2. ✅ Verification page loads in < 2 seconds
3. ✅ 70%+ verification rate within 24 hours
4. ✅ 0 newsletters sent to unverified users
5. ✅ < 1% verification failures (technical errors)
6. ✅ All existing users grandfathered in (verified = true)
7. ✅ Improved sender reputation score (measured via SendGrid)

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Confirmation emails in spam | High | Use authenticated domain, test spam filters |
| Low verification rates | Medium | Clear messaging, email reminder after 3 days |
| Token leakage | High | Use HTTPS, hash tokens, expire after 7 days |
| Email delivery failures | Medium | Retry logic, monitor SendGrid delivery rates |
| Database migration issues | High | Test on local instance, backup before migration |
| User confusion | Medium | Clear messaging, FAQ, support email |

### Rollback Plan

If verification causes major issues:

1. **Database Rollback**:
```sql
-- Revert schema changes
ALTER TABLE users ALTER COLUMN active SET DEFAULT TRUE;
UPDATE users SET active = TRUE WHERE verified = FALSE;
-- Optionally drop new columns (keep for data retention)
```

2. **Code Rollback**:
- Deploy previous version of `personifeed-signup`
- Deploy previous version of `personifeed-cron`
- Remove `personifeed-verify` function
- Revert web page changes

3. **Communication**:
- Email users who signed up but didn't verify
- Apologize for confusion
- Activate their accounts manually

## File Changes Summary

### New Files
```
supabase/migrations/
  └── 20251010000000_add_email_verification.sql  # Migration

supabase/functions/personifeed-verify/
  ├── index.ts                    # Main handler
  ├── database.ts                 # DB operations
  ├── validation.ts               # Token validation
  └── emailSender.ts              # Welcome email

web/app/personifeed/verify/
  └── page.tsx                    # Verification landing page

tests/unit/
  └── verification.test.ts        # Unit tests

tests/integration/
  └── personifeed-verification.test.ts  # Integration tests

docs/
  └── personifeed-confirmation-email-plan.md  # This file
```

### Modified Files
```
supabase/functions/personifeed-signup/index.ts
  - Change user creation to set active=false, verified=false
  - Add verification token generation
  - Send confirmation email instead of immediate activation
  - Handle re-signup with resend logic

supabase/functions/personifeed-signup/database.ts
  - Update createUser to include verification fields
  - Add updateVerificationToken function
  - Add resendConfirmationEmail function

supabase/functions/personifeed-signup/emailSender.ts (NEW FILE)
  - Add sendConfirmationEmail function
  - Add sendWelcomeEmail function (optional)

supabase/functions/personifeed-cron/database.ts
  - Update getAllActiveUsers to filter by verified=true

web/app/personifeed/page.tsx
  - Update success message (mention confirmation email)
  - Add explanatory text about email verification

supabase/functions/_shared/types.ts
  - Add verification fields to User interface

deno.json
  - Add deploy task for verify function
  - Add test task for verification tests

PERSONIFEED-README.md
  - Document email verification flow
  - Update database schema docs
  - Update user journey diagram
```

## Implementation Checklist

### Database
- [ ] Create migration file
- [ ] Review migration SQL
- [ ] Test migration locally
- [ ] Backup production database
- [ ] Apply migration to production
- [ ] Verify schema changes
- [ ] Test queries with new fields

### Backend
- [ ] Create `personifeed-verify` Edge Function
- [ ] Add token generation utility
- [ ] Add token hashing utility
- [ ] Implement verification database operations
- [ ] Update `personifeed-signup` with confirmation flow
- [ ] Add confirmation email function
- [ ] Add welcome email function (optional)
- [ ] Update `personifeed-cron` with verified filter
- [ ] Add rate limiting for signups
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Deploy functions
- [ ] Test API endpoints

### Frontend
- [ ] Create verify page component
- [ ] Add loading states
- [ ] Add success/error states
- [ ] Update signup success message
- [ ] Add email confirmation instructions
- [ ] Test responsive design
- [ ] Deploy to Vercel

### Testing
- [ ] Test signup → confirmation email sent
- [ ] Test verification link → success
- [ ] Test expired token → error
- [ ] Test invalid token → error
- [ ] Test already verified → error
- [ ] Test cron skips unverified users
- [ ] Test welcome email sent (optional)
- [ ] Manual end-to-end test with real email

### Documentation
- [ ] Update PERSONIFEED-README.md
- [ ] Update user journey diagram
- [ ] Document verification flow
- [ ] Add troubleshooting guide
- [ ] Update API documentation
- [ ] Document monitoring queries

### Monitoring
- [ ] Set up verification rate alerts
- [ ] Monitor email delivery rates
- [ ] Track time-to-verify metrics
- [ ] Monitor token expiration rates
- [ ] Set up error alerts

## Estimated Timeline

- **Database Migration**: 1-2 hours
- **Backend Development**: 6-8 hours
- **Frontend Development**: 3-4 hours
- **Testing**: 3-4 hours
- **Documentation**: 2-3 hours
- **Deployment & Verification**: 2-3 hours

**Total**: 17-24 hours (2-3 days for one developer)

## Questions to Resolve

1. Should we send welcome email after verification? (nice-to-have)
2. Should we send reminder email if unverified after 3 days?
3. What should token expiration be? (7 days proposed)
4. Should we clean up unverified users? (after 30 days proposed)
5. Should we grandfather existing users? (yes, set verified=true)
6. Should we allow resending verification email? (yes, with rate limit)
7. Should we add CAPTCHA to signup form? (future, if abuse detected)

## References

- Email Verification Best Practices: https://sendgrid.com/blog/email-verification-best-practices/
- Double Opt-In Guide: https://www.campaignmonitor.com/resources/glossary/double-opt-in/
- Token Security: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
- SendGrid Transactional Email: https://docs.sendgrid.com/ui/sending-email/how-to-send-email-with-dynamic-transactional-templates
- GDPR Email Consent: https://gdpr.eu/email-consent/

