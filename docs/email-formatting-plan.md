# Email Formatting Improvement Plan

## Current State Analysis

### Problem

- LLM responses (GPT-4/GPT-3.5) generate content in **markdown format**
- Emails are currently sent as **plain text only** (`text: body` in SendGrid)
- Recipients see raw markdown syntax (**, ##, [], etc.) instead of formatted content
- Poor visual presentation reduces readability and user experience

### Affected Email Types

1. **LLMBox Reply Emails** - LLM-generated responses to user questions (markdown)
2. **Personifeed Newsletters** - Daily digest content (markdown)
3. **Error Emails** - System error messages (plain text, currently acceptable)
4. **Confirmation Emails** - Reply confirmations (plain text, currently acceptable)

### Current Implementation

```typescript
// supabase/functions/_shared/emailSender.ts:139
const msg = {
  to,
  from,
  subject,
  text: body, // Plain text only
  headers: Object.keys(headers).length > 0 ? headers : undefined,
};
```

---

## Solution Design

### Overview

Transform markdown content into beautiful HTML emails while maintaining plain text fallback for
email clients that don't support HTML.

### Architecture

```
┌──────────────────┐
│  LLM Response    │
│  (Markdown)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│  Markdown to HTML        │
│  Conversion              │
│  (marked library)        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  HTML Email Template     │
│  (Responsive, Styled)    │
│  - Header                │
│  - Body (HTML content)   │
│  - Footer                │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  SendGrid Send           │
│  - text: plain version   │
│  - html: formatted HTML  │
└──────────────────────────┘
```

---

## Technical Specification

### 1. Markdown to HTML Conversion

**Library**: `marked` (Deno-compatible, widely used, actively maintained)

- **Package**: `npm:marked@latest` (use latest stable)
- **Features**:
  - Converts markdown to HTML
  - GFM (GitHub Flavored Markdown) support
  - Code block syntax highlighting support
  - Table support
  - Customizable renderers

### 2. HTML Email Template Design

**Design Principles**:

- **Responsive**: Works on mobile and desktop
- **Email Client Compatible**: Works in Gmail, Outlook, Apple Mail, etc.
- **Accessible**: Good color contrast, semantic HTML
- **Clean**: Professional, not cluttered
- **Branded**: Optional branding elements

**Template Structure**:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email</title>
    <style>
      /* Inline CSS for email client compatibility */
    </style>
  </head>
  <body>
    <!-- Container -->
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto">
      <!-- Header (optional, for newsletters) -->
      <tr>
        <td style="padding: 20px; background: #f8f9fa">
          <!-- Logo/branding -->
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td style="padding: 30px; background: #ffffff">
          <!-- Rendered HTML content goes here -->
          {content}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 20px; background: #f8f9fa; font-size: 12px; color: #6c757d">
          <!-- Footer content -->
        </td>
      </tr>
    </table>
  </body>
</html>
```

**CSS Styling for Markdown Elements**:

```css
/* Typography */
h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 24px 0 16px;
  color: #1a1a1a;
}
h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 20px 0 12px;
  color: #1a1a1a;
}
h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 16px 0 10px;
  color: #1a1a1a;
}
p {
  font-size: 16px;
  line-height: 1.6;
  margin: 12px 0;
  color: #333333;
}

/* Lists */
ul, ol {
  margin: 12px 0;
  padding-left: 24px;
}
li {
  margin: 6px 0;
  line-height: 1.6;
}

/* Code */
code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}
pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}
pre code {
  background: none;
  padding: 0;
}

/* Links */
a {
  color: #0066cc;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

/* Blockquotes */
blockquote {
  border-left: 4px solid #ddd;
  margin: 16px 0;
  padding-left: 16px;
  color: #666;
  font-style: italic;
}

/* Tables */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}
th {
  background: #f5f5f5;
  font-weight: 600;
}

/* Horizontal Rules */
hr {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 24px 0;
}
```

### 3. Email Template Types

#### 3.1. Reply Email Template (LLMBox)

- **Header**: Minimal or none (preserve email thread appearance)
- **Body**: Rendered markdown content
- **Footer**: Simple signature or service info
- **Design**: Clean, conversational

#### 3.2. Newsletter Email Template (Personifeed)

- **Header**: Logo/branding, date
- **Body**: Rendered markdown content (news digest)
- **Footer**: Customization instructions, unsubscribe link
- **Design**: Newsletter-style with clear sections

#### 3.3. Error Email Template

- **Keep as plain text** (no markdown conversion needed)
- **Optional**: Simple HTML wrapper for branding consistency

#### 3.4. Confirmation Email Template

- **Keep as plain text** (no markdown conversion needed)
- **Optional**: Simple HTML wrapper for branding consistency

### 4. Plain Text Fallback

**Strategy**: Always include both `text` and `html` in SendGrid message

- `text`: Original markdown or plain text (for text-only email clients)
- `html`: Rendered HTML (for modern email clients)

**Markdown to Plain Text**:

- Option 1: Send original markdown as-is
- Option 2: Strip markdown syntax for cleaner plain text
- **Recommended**: Option 1 (preserves readability in text clients)

---

## Implementation Plan

### Phase 1: Core Infrastructure

**Goal**: Set up markdown-to-HTML conversion and base template system

#### Tasks:

1. **Add `marked` dependency to import map**
   - File: `supabase/import_map.json`
   - Add: `"marked": "npm:marked@12.0.0"` (use latest stable)

2. **Create email template module**
   - File: `supabase/functions/_shared/emailTemplates.ts`
   - Functions:
     - `markdownToHtml(markdown: string): string` - Convert markdown to HTML
     - `wrapInEmailTemplate(htmlContent: string, options): string` - Wrap in email template
     - `generatePlainTextFallback(markdown: string): string` - Generate plain text version

3. **Create email styling constants**
   - File: `supabase/functions/_shared/emailStyles.ts`
   - Constants:
     - `EMAIL_STYLES` - CSS for markdown elements
     - `EMAIL_COLORS` - Color palette
     - `EMAIL_FONTS` - Font stack

4. **Update email sender to support HTML**
   - File: `supabase/functions/_shared/emailSender.ts`
   - Modify `sendEmail()` to accept optional `htmlBody` parameter
   - Update SendGrid message to include both `text` and `html`

### Phase 2: Template Implementation

**Goal**: Create specific templates for each email type

#### Tasks:

5. **Implement Reply Email Template**
   - Function: `generateReplyEmailHtml(content: string): string`
   - Features: Clean, minimal design for conversational replies

6. **Implement Newsletter Email Template**
   - Function: `generateNewsletterEmailHtml(content: string, options): string`
   - Features: Header with date, branded footer, customization instructions

7. **Update email formatting functions**
   - File: `supabase/functions/_shared/emailSender.ts`
   - Update `formatReplyEmail()` to include HTML version
   - Update `sendNewsletterEmail()` to include HTML version

### Phase 3: Integration & Testing

**Goal**: Integrate templates into existing flows and test thoroughly

#### Tasks:

8. **Update email-webhook to use HTML templates**
   - File: `supabase/functions/email-webhook/index.ts`
   - Convert LLM responses to HTML before sending

9. **Update personifeed-cron to use HTML templates**
   - File: `supabase/functions/personifeed-cron/index.ts`
   - Convert newsletter content to HTML before sending

10. **Add unit tests for email templates**
    - File: `tests/unit/emailTemplates.test.ts`
    - Test markdown conversion
    - Test template generation
    - Test edge cases (empty content, special characters, etc.)

11. **Add integration tests for HTML emails**
    - File: `tests/integration/html-emails.test.ts`
    - Test actual email sending with HTML
    - Verify both text and HTML versions are sent

12. **Manual testing in email clients**
    - Gmail (web, mobile)
    - Outlook (desktop, web)
    - Apple Mail (macOS, iOS)
    - Thunderbird
    - Yahoo Mail

### Phase 4: Polish & Optimization

**Goal**: Refine design and optimize performance

#### Tasks:

13. **Design refinements based on testing feedback**
    - Adjust colors, spacing, typography
    - Ensure mobile responsiveness
    - Test dark mode compatibility

14. **Performance optimization**
    - Minimize HTML size
    - Optimize CSS (remove unused styles)
    - Cache template generation if needed

15. **Documentation**
    - Update CLAUDE.md with email formatting standards
    - Document template customization options
    - Add email design guidelines

---

## File Structure

### New Files

```
supabase/functions/_shared/
├── emailTemplates.ts       # Markdown conversion & template generation
├── emailStyles.ts          # CSS constants and styling
└── emailTemplates/         # (Optional) Individual template files
    ├── replyEmail.ts
    ├── newsletterEmail.ts
    └── baseTemplate.ts

tests/unit/
├── emailTemplates.test.ts  # Unit tests for template generation

tests/integration/
├── html-emails.test.ts     # Integration tests for HTML email sending
```

### Modified Files

```
supabase/import_map.json    # Add marked dependency
supabase/functions/_shared/emailSender.ts  # Support HTML emails
supabase/functions/email-webhook/index.ts  # Use HTML templates
supabase/functions/personifeed-cron/index.ts  # Use HTML templates
```

---

## Code Examples

### Example 1: Markdown to HTML Conversion

```typescript
// supabase/functions/_shared/emailTemplates.ts
import { marked } from 'npm:marked@12.0.0';

export const markdownToHtml = (markdown: string): string => {
  // Configure marked options
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert line breaks to <br>
    headerIds: false, // Don't generate IDs for headers (not needed in emails)
  });

  // Convert markdown to HTML
  const html = marked.parse(markdown);

  return html;
};
```

### Example 2: Base Email Template

```typescript
// supabase/functions/_shared/emailTemplates.ts
import { EMAIL_STYLES } from './emailStyles.ts';

interface TemplateOptions {
  includeHeader?: boolean;
  headerText?: string;
  footerText?: string;
  type?: 'reply' | 'newsletter';
}

export const wrapInEmailTemplate = (
  htmlContent: string,
  options: TemplateOptions = {},
): string => {
  const { includeHeader = false, headerText, footerText, type = 'reply' } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${EMAIL_STYLES}</style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; background-color: #f5f5f5;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;" cellpadding="0" cellspacing="0">
          ${
    includeHeader
      ? `
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef;">
              <h2 style="margin: 0; font-size: 18px; color: #495057;">${
        headerText || 'Message'
      }</h2>
            </td>
          </tr>
          `
      : ''
  }

          <tr>
            <td style="padding: 30px;">
              ${htmlContent}
            </td>
          </tr>

          ${
    footerText
      ? `
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; text-align: center;">
              ${footerText}
            </td>
          </tr>
          `
      : ''
  }
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};
```

### Example 3: Updated sendEmail Function

```typescript
// supabase/functions/_shared/emailSender.ts (modified)
export interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  body: string; // Plain text or markdown
  htmlBody?: string; // Optional HTML version
  inReplyTo?: string;
  references?: string[];
  logContext?: Record<string, unknown>;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const { to, from, subject, body, htmlBody, inReplyTo, references = [], logContext = {} } =
    options;

  initializeSendGrid();

  // ... (header formatting code)

  const msg = {
    to,
    from,
    subject,
    text: body, // Plain text fallback
    html: htmlBody, // HTML version (if provided)
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };

  // ... (send logic)
};
```

### Example 4: Newsletter Email with HTML

```typescript
// supabase/functions/_shared/emailSender.ts (modified)
import { markdownToHtml, wrapInEmailTemplate } from './emailTemplates.ts';

export const sendNewsletterEmail = async (
  userId: string,
  userEmail: string,
  content: string,
): Promise<void> => {
  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Your Daily Digest - ${todayDate}`;

  // Plain text version (markdown)
  const textBody = `${content}

---

Reply to this email to customize future newsletters.`;

  // HTML version
  const htmlContent = markdownToHtml(content);
  const htmlBody = wrapInEmailTemplate(htmlContent, {
    includeHeader: true,
    headerText: `Your Daily Digest - ${todayDate}`,
    footerText: 'Reply to this email to customize future newsletters.',
    type: 'newsletter',
  });

  const fromAddress = getReplyAddress(userId);

  await sendEmail({
    to: userEmail,
    from: fromAddress,
    subject,
    body: textBody,
    htmlBody: htmlBody, // Now includes HTML
    logContext: { userId, email: userEmail, fromAddress },
  });
};
```

---

## Testing Strategy

### Unit Tests

- **Markdown conversion**: Test various markdown elements (headings, lists, code, links)
- **Template generation**: Test with different options (with/without header, different types)
- **Edge cases**: Empty content, special characters, very long content
- **Security**: Test XSS prevention (marked handles this by default)

### Integration Tests

- **Email sending**: Verify both text and HTML are sent to SendGrid
- **API response**: Check SendGrid accepts the HTML format
- **Error handling**: Test with malformed markdown

### Manual Testing Checklist

- [ ] Gmail (web) - Desktop
- [ ] Gmail (mobile app) - iOS/Android
- [ ] Outlook (desktop app) - Windows/Mac
- [ ] Outlook.com (web)
- [ ] Apple Mail - macOS
- [ ] Apple Mail - iOS
- [ ] Thunderbird
- [ ] Yahoo Mail
- [ ] ProtonMail
- [ ] Dark mode compatibility
- [ ] Plain text fallback (disable HTML in client)

### Visual Testing

- **Responsive design**: Test on various screen sizes
- **Typography**: Check readability, hierarchy
- **Colors**: Ensure good contrast (WCAG AA)
- **Layout**: No broken elements or overflow

---

## Email Client Compatibility

### HTML/CSS Limitations in Email Clients

- **No external CSS**: Must use inline styles or `<style>` in `<head>`
- **Limited CSS support**: Many properties not supported (flexbox, grid, advanced selectors)
- **Use tables for layout**: Email clients expect table-based layouts
- **Outlook quirks**: Uses Microsoft Word rendering engine (limited CSS)

### Best Practices

1. **Inline CSS**: Use inline styles for critical styling
2. **Table layouts**: Use `<table>` for structure (not `<div>` with CSS)
3. **Font stacks**: Use web-safe fonts with fallbacks
4. **Image handling**: Use absolute URLs for images (if any)
5. **Test widely**: Always test in major clients
6. **Progressive enhancement**: Design works without CSS

### Recommended Email Framework

**Consider using**: None for MVP (keep it simple) **Future consideration**: Foundation for Emails or
MJML (if templates get complex)

---

## Security Considerations

### XSS Prevention

- **Marked library**: Sanitizes HTML by default
- **No user-generated HTML**: Only LLM-generated markdown (trusted source)
- **Content Security Policy**: Not applicable to emails

### Privacy

- **No tracking pixels**: Don't add hidden images for tracking (privacy-friendly)
- **No external resources**: All content inline (faster, more private)

---

## Performance Considerations

### HTML Size

- **Target**: < 100KB per email (SendGrid limit is 30MB, but smaller is better)
- **Typical newsletter**: 20-50KB with HTML/CSS
- **Optimization**: Minify CSS, remove unnecessary whitespace

### Conversion Time

- **Markdown to HTML**: < 50ms for typical content (1-5KB markdown)
- **Template wrapping**: < 10ms
- **Total overhead**: < 100ms (negligible compared to LLM/SendGrid latency)

### Caching

- **Template cache**: Cache base template (no dynamic content)
- **Style cache**: CSS string is constant, can be reused
- **Not needed for MVP**: Overhead is minimal

---

## Future Enhancements

### Phase 5+ (Post-MVP)

1. **Dynamic content blocks**: Add callout boxes, info panels
2. **Syntax highlighting**: Color code blocks in newsletters
3. **Image support**: Handle images in markdown (if LLM generates image URLs)
4. **Personalization**: User name in header, preferences
5. **Unsubscribe links**: One-click unsubscribe for newsletters
6. **A/B testing**: Test different template designs
7. **Analytics**: Track open rates (with user consent)
8. **Template variants**: Allow users to choose email style preference
9. **Emoji support**: Handle emoji in markdown
10. **RTL support**: Right-to-left languages (Hebrew, Arabic)

---

## Success Metrics

### Qualitative

- [ ] Emails look professional and polished
- [ ] Markdown elements render correctly (headings, lists, code, links)
- [ ] Readable on mobile and desktop
- [ ] Works in major email clients (Gmail, Outlook, Apple Mail)

### Quantitative

- [ ] HTML email size: < 100KB
- [ ] Conversion time: < 100ms
- [ ] Test coverage: > 80% for email template module
- [ ] Zero XSS vulnerabilities

### User Feedback

- Monitor user responses/feedback for formatting issues
- Track any complaints about email appearance
- Measure engagement (replies) before/after implementation

---

## Rollout Plan

### Stage 1: Development & Testing (Week 1)

- Implement core infrastructure (Phase 1)
- Build templates (Phase 2)
- Unit testing

### Stage 2: Integration Testing (Week 1-2)

- Integration tests
- Manual testing in email clients
- Bug fixes

### Stage 3: Soft Launch (Week 2)

- Deploy to production (existing users only)
- Monitor for issues
- Gather feedback

### Stage 4: Full Rollout (Week 3)

- Public launch
- Update documentation
- Monitor metrics

### Stage 5: Iteration (Ongoing)

- Address feedback
- Refine design
- Add enhancements

---

## Dependencies

### NPM Packages

- `marked@12.0.0` - Markdown to HTML conversion

### Deno Modules

- Standard library (already in use)

### External Services

- SendGrid (already integrated)

---

## Risks & Mitigations

| Risk                               | Impact | Likelihood | Mitigation                                                         |
| ---------------------------------- | ------ | ---------- | ------------------------------------------------------------------ |
| Email client rendering issues      | High   | Medium     | Extensive testing in major clients; use proven HTML email patterns |
| HTML size too large                | Medium | Low        | Monitor size; optimize CSS; test with large newsletters            |
| Conversion breaks special markdown | Medium | Medium     | Comprehensive unit tests; handle edge cases                        |
| Performance degradation            | Low    | Low        | Benchmark conversion time; cache templates                         |
| SendGrid rejects HTML format       | High   | Very Low   | Test integration early; SendGrid supports HTML natively            |

---

## Open Questions

1. **Branding**: Do we want logos/branding in newsletter headers?
   - **Decision needed**: Design preference for visual identity

2. **Dark mode**: Should we optimize for dark mode email clients?
   - **Recommendation**: Yes, use semantic HTML and appropriate colors

3. **Inline images**: If LLM generates markdown with images, do we support them?
   - **Recommendation**: Phase 5+, not MVP (requires image hosting)

4. **Template customization**: Should users be able to choose email style preferences?
   - **Recommendation**: Phase 5+, not MVP (requires user preferences database)

5. **Error/confirmation emails**: Should these also be HTML or stay plain text?
   - **Recommendation**: Start plain text, optionally add simple HTML wrapper later

---

## Conclusion

This plan provides a comprehensive approach to improving email formatting by:

1. Converting markdown to HTML using the `marked` library
2. Wrapping content in responsive, email-client-compatible templates
3. Maintaining plain text fallbacks for compatibility
4. Testing thoroughly across email clients
5. Following email HTML best practices

**Estimated effort**: 2-3 weeks for full implementation and testing **Priority**: High
(significantly improves user experience) **Complexity**: Medium (well-understood problem, proven
solutions)

Next steps: Review plan, get approval, begin Phase 1 implementation.
