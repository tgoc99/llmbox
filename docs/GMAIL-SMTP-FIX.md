# Gmail SMTP Syntax Error Fix

## Problem

Gmail was rejecting emails with the error:
```
555 5.5.2 Syntax error, cannot decode response. For more information, go to
https://support.google.com/a/answer/3221692 and review RFC 5321 specifications.
```

## Root Causes

There were **two separate issues** causing Gmail to reject emails:

### Issue 1: Email Header Formatting

According to RFC 5321/5322 specifications:

1. **Message IDs must be enclosed in angle brackets** (`<message-id>`)
2. **The `References` header** must contain space-separated message IDs, each wrapped in angle brackets
3. **The `In-Reply-To` header** must contain a message ID wrapped in angle brackets

While our email parser (`emailParser.ts`) was correctly extracting message IDs with angle brackets, there were edge cases where:
- Message IDs might not have angle brackets
- Empty or whitespace-only references could be included
- The formatting wasn't being validated before sending to SendGrid
- **Error email templates** weren't formatting references properly

### Issue 2: Email Address Formatting

SendGrid was receiving email addresses in the format:
```
"Display Name" <email@example.com>
```

And passing them directly to Gmail's SMTP server as:
```json
{"email": "\"Display Name\" <email@example.com>"}
```

Gmail requires **just the email address** without the display name in the SMTP envelope. The display name + email format caused a syntax error.

## Solution

### Changes Made

#### 1. **Added `extractEmailAddress()` helper function** (`emailParser.ts`)

```typescript
/**
 * Extract email address from a string that may contain display name
 * Handles formats like:
 * - "Display Name" <email@example.com>
 * - <email@example.com>
 * - email@example.com
 */
const extractEmailAddress = (emailString: string): string => {
  // Match email in angle brackets
  const bracketMatch = emailString.match(/<([^>]+)>/);
  if (bracketMatch) {
    return bracketMatch[1].trim();
  }

  // If no angle brackets, return the whole string trimmed
  return emailString.trim();
};
```

This function:
- Extracts just the email address from `"Name" <email@example.com>` format
- Handles emails already in angle brackets `<email@example.com>`
- Handles plain email addresses `email@example.com`
- Ensures SendGrid receives clean email addresses for SMTP

#### 2. **Updated `parseIncomingEmail()`** to extract clean email addresses

```typescript
// Extract clean email addresses (remove display names)
const fromEmail = extractEmailAddress(from!);
const toEmail = extractEmailAddress(to!);

return {
  from: fromEmail,  // Now: "tgoc99@gmail.com" instead of "\"Tommy O'Connor\" <tgoc99@gmail.com>"
  to: toEmail,
  // ... rest of fields
};
```

#### 3. **Added `ensureAngleBrackets()` helper function** (`emailSender.ts` and `errorTemplates.ts`)

```typescript
/**
 * Ensure message ID is properly formatted with angle brackets
 * Per RFC 5322, message IDs must be enclosed in angle brackets
 */
const ensureAngleBrackets = (messageId: string): string => {
  const trimmed = messageId.trim();
  if (!trimmed) return '';

  // If already has angle brackets, return as-is
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return trimmed;
  }

  // Add angle brackets
  return `<${trimmed}>`;
};
```

This function:
- Trims whitespace from message IDs
- Returns empty string for empty/whitespace-only values
- Preserves message IDs that already have angle brackets
- Adds angle brackets to message IDs that don't have them

#### 4. **Updated `formatOutgoingEmail()`** to validate and format references

```typescript
// Build references array by appending original message ID to existing references
// Filter out empty values and ensure proper formatting
const references = [...incoming.references, incoming.messageId]
  .map((ref) => ensureAngleBrackets(ref))
  .filter((ref) => ref.length > 0);
```

This ensures:
- All message IDs in the references array have angle brackets
- Empty or invalid message IDs are filtered out
- The reference chain is properly maintained

#### 5. **Updated `sendEmail()`** to properly format headers

```typescript
// Ensure In-Reply-To is properly formatted with angle brackets
const inReplyTo = ensureAngleBrackets(email.inReplyTo);

// Build headers object conditionally based on whether we have threading info
const headers: Record<string, string> = {};

if (inReplyTo) {
  headers['In-Reply-To'] = inReplyTo;
}

// Only add References header if we have valid references
if (email.references.length > 0) {
  headers['References'] = email.references.join(' ');
}

const requestBody: SendGridEmailRequest = {
  personalizations: [
    {
      to: [{ email: email.to }],
      subject: email.subject,
      // Only include headers if we have any
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    },
  ],
  // ... rest of request body
};
```

This ensures:
- The `In-Reply-To` header is validated and formatted
- Headers are only included if they contain valid values
- Empty references don't create invalid SMTP headers

#### 6. **Updated all error email templates** (`errorTemplates.ts`)

Added the same `ensureAngleBrackets()` helper and applied it to all error email templates:
- `getOpenAIErrorEmail()`
- `getRateLimitErrorEmail()`
- `getGenericErrorEmail()`
- `getTimeoutErrorEmail()`

This ensures error emails also have properly formatted message IDs and references.

#### 7. **Updated TypeScript types** (`types.ts`)

```typescript
export interface SendGridEmailRequest {
  personalizations: Array<{
    to: Array<{ email: string }>;
    subject: string;
    headers?: Record<string, string>;  // Changed from specific header structure
  }>;
  from: { email: string };
  content: Array<{
    type: string;
    value: string;
  }>;
}
```

This makes the headers structure more flexible and accurately reflects how SendGrid accepts arbitrary headers.

### Tests Added

Added comprehensive unit tests to verify both fixes:

**Email Address Extraction Tests:**
1. **`parseIncomingEmail - extracts email from display name format`**
   - Tests extraction from `"Tommy O'Connor" <tgoc99@gmail.com>` → `tgoc99@gmail.com`

2. **`parseIncomingEmail - handles email without display name`**
   - Tests plain email addresses work correctly

3. **`parseIncomingEmail - handles email in angle brackets without display name`**
   - Tests `<email@example.com>` → `email@example.com`

**Message ID Formatting Tests:**
4. **`formatOutgoingEmail - ensures message IDs have angle brackets`**
   - Tests that message IDs without angle brackets get them added
   - Tests that message IDs with angle brackets are preserved

5. **`formatOutgoingEmail - filters out empty references`**
   - Tests that empty strings and whitespace-only references are filtered out
   - Ensures the references array only contains valid message IDs

6. **`error emails - ensure message IDs have angle brackets`**
   - Tests error templates properly format message IDs

7. **`error emails - filter out empty references`**
   - Tests error templates filter invalid references

## Verification

All unit tests pass (49 tests total):
```bash
deno task test:unit
# ✅ All 49 tests pass
```

The fix ensures compliance with:
- **RFC 5321** - SMTP Protocol (email address formatting)
- **RFC 5322** - Internet Message Format (message ID formatting)
- Gmail's strict SMTP validation requirements

## Expected Behavior After Fix

1. **Email addresses are extracted cleanly** - Display names are removed before sending to SendGrid
2. **All outgoing emails have properly formatted message IDs** with angle brackets
3. **Empty or invalid references are automatically filtered out**
4. **Thread continuity is maintained correctly**
5. **Gmail (and other strict SMTP servers) accept emails without syntax errors**

## Deployment

To deploy this fix:

```bash
# Deploy the updated function
supabase functions deploy email-webhook

# Verify the deployment
supabase functions list
```

The fix is backward compatible and doesn't require any configuration changes.

