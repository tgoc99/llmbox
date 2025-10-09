# Dynamic Reply Addresses in Personifeed

## Overview

Personifeed uses **dynamic reply addresses** to route user feedback and replies back to the correct user account. This eliminates the need for separate "from" and "reply-to" email configuration and makes reply routing more efficient.

## How It Works

### Address Format

Each newsletter is sent from a unique address in the format:
```
reply+{userId}@{domain}
```

Example:
```
reply+550e8400-e29b-41d4-a716-446655440000@mail.personifeed.com
```

### Why Dynamic Addresses?

1. **User Identification**: The userId is encoded directly in the email address
2. **Efficient Routing**: No need to parse email bodies or lookup by sender
3. **Email Threading**: Replies maintain proper conversation threading
4. **Security**: Each user has a unique address, preventing cross-user contamination
5. **Simplicity**: One email domain handles everything

## Implementation Details

### Sending Newsletters

When `personifeed-cron` sends newsletters:

```typescript
// Generate dynamic reply address for user
const fromAddress = `reply+${user.id}@${config.personifeedEmailDomain}`;

const msg = {
  to: user.email,
  from: fromAddress,  // ← Dynamic!
  subject: 'Your Daily Digest - ...',
  text: content,
};
```

### Receiving Replies

When `personifeed-reply` receives a reply webhook from SendGrid:

```typescript
// Parse the TO field to extract userId
const { from, to, userId, body } = parseReplyEmail(formData);
// userId = "550e8400-e29b-41d4-a716-446655440000"

// Look up user directly by ID (fast!)
const user = await getUserById(userId);

// Store feedback
await addFeedback(user.id, body);

// Send confirmation from the same dynamic address
await sendConfirmationEmail(user.id, user.email);
```

### SendGrid Configuration

SendGrid's **Inbound Parse** uses **wildcard matching** to capture all variants:

- **Receiving Domain**: `mail.personifeed.com`
- **Captures**: `reply+*@mail.personifeed.com` (all variations)
- **Routes To**: `https://[project].supabase.co/functions/v1/personifeed-reply`

When SendGrid receives `reply+ABC123@mail.personifeed.com`, it:
1. Matches the wildcard pattern
2. Forwards to the webhook
3. Includes the full TO address in the webhook payload

## Configuration

### Environment Variables

**Before** (deprecated):
```bash
PERSONIFEED_FROM_EMAIL=newsletter@mail.personifeed.com
PERSONIFEED_REPLY_EMAIL=reply@mail.personifeed.com
```

**After** (current):
```bash
PERSONIFEED_EMAIL_DOMAIN=mail.personifeed.com
```

### DNS Setup

Only one MX record is needed for the domain:

```
mail.personifeed.com.  MX  10  mx.sendgrid.net.
```

## Benefits

### 1. Performance
- **Faster lookups**: Direct database query by userId (indexed primary key)
- **No email parsing**: UserId extracted from TO field, not email body
- **Reduced queries**: One DB call instead of multiple

### 2. Reliability
- **No ambiguity**: Each address maps to exactly one user
- **Fallback**: If userId extraction fails, falls back to email lookup
- **Validation**: Ensures reply FROM matches user email

### 3. Scalability
- **Unlimited users**: No limit on address variations
- **No conflicts**: Each userId is unique
- **Easy routing**: Pattern-based forwarding

### 4. Security
- **User isolation**: Replies can't be accidentally routed to wrong user
- **Validation**: FROM email verified against userId
- **Audit trail**: Full tracking in structured logs

## Edge Cases Handled

### Case 1: UserId Extraction Fails
```typescript
// If reply+ABC fails to extract userId
let user = userId ? await getUserById(userId) : null;

// Fallback to email lookup
if (!user) {
  user = await getUserByEmail(from);
}
```

### Case 2: Email Mismatch
```typescript
// If userId exists but email doesn't match
if (!user || user.email !== from) {
  logInfo('user_lookup_fallback', { userId, from });
  user = await getUserByEmail(from);
}
```

### Case 3: New User Reply
```typescript
// If user doesn't exist at all
if (!user) {
  user = await createUser(from);
  await addInitialCustomization(user.id, body);
}
```

## Testing

### Test Reply Routing

1. **Create test user**:
   ```bash
   # Via landing page or directly in DB
   INSERT INTO users (email) VALUES ('test@example.com') RETURNING id;
   # Note the returned UUID
   ```

2. **Send test reply**:
   ```bash
   # Send email to: reply+{uuid}@mail.personifeed.com
   echo "Test feedback" | mail -s "Re: Newsletter" reply+550e8400-e29b-41d4-a716-446655440000@mail.personifeed.com
   ```

3. **Verify logs**:
   ```bash
   supabase functions logs personifeed-reply
   # Look for: reply_received with extracted userId
   ```

4. **Check database**:
   ```sql
   SELECT * FROM customizations WHERE user_id = '550e8400-...';
   ```

### Test Wildcard Matching

SendGrid's inbound parse will match:
- ✅ `reply+ABC@mail.personifeed.com`
- ✅ `reply+123-456@mail.personifeed.com`
- ✅ `reply+anything@mail.personifeed.com`
- ❌ `other@mail.personifeed.com` (no match)
- ❌ `reply@mail.personifeed.com` (no + sign)

## Migration Notes

### For Existing Deployments

If you have an existing deployment with the old email configuration:

1. **Update environment variables**:
   ```bash
   # Remove old secrets
   supabase secrets unset PERSONIFEED_FROM_EMAIL
   supabase secrets unset PERSONIFEED_REPLY_EMAIL

   # Add new secret
   supabase secrets set PERSONIFEED_EMAIL_DOMAIN=mail.personifeed.com
   ```

2. **Redeploy functions**:
   ```bash
   deno task deploy:personifeed:all
   ```

3. **Update SendGrid inbound parse**:
   - No changes needed! Wildcard `*@mail.personifeed.com` already works

4. **Existing users**:
   - Next newsletter will use new dynamic addresses
   - Old replies to fixed address will fail (expected)
   - Users will receive new address in next newsletter

## Troubleshooting

### Issue: Replies Not Received

**Check**:
1. SendGrid inbound parse is configured with wildcard domain
2. MX record points to `mx.sendgrid.net`
3. Function logs show webhook POST requests
4. UserId extraction regex matches: `/^reply\+([a-f0-9-]+)@/i`

### Issue: Wrong User Receives Reply

**Check**:
1. Email FROM field matches user.email
2. Logs show correct userId extraction
3. Fallback email lookup working
4. No duplicate user emails in database

### Issue: Confirmation Email Has Wrong FROM

**Check**:
1. `sendConfirmationEmail` receives correct userId
2. `getReplyAddress(userId)` returns correct format
3. SendGrid sender authentication for domain
4. Logs show correct fromAddress in `confirmation_sent`

## Code References

- **Config**: `supabase/functions/_shared/config.ts` (line 81-84)
- **Email Sender**: `supabase/functions/personifeed-cron/emailSender.ts` (line 24-34, 60-61, 126)
- **Email Parser**: `supabase/functions/personifeed-reply/emailParser.ts` (line 66-78, 102)
- **Reply Handler**: `supabase/functions/personifeed-reply/index.ts` (line 41, 56-68, 96)
- **Database**: `supabase/functions/personifeed-reply/database.ts` (line 10-32)

## Summary

Dynamic reply addresses provide a robust, scalable solution for routing user feedback in Personifeed. By encoding the userId directly in the email address, we achieve:

- ✅ Fast, efficient user lookups
- ✅ Reliable reply routing
- ✅ Better email threading
- ✅ Enhanced security
- ✅ Simplified configuration

The system is production-ready with comprehensive fallback handling and validation.

