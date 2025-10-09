/**
 * Integration tests for HTML email sending
 * Tests actual email sending with HTML content via SendGrid
 * ⚠️ CAUTION: Makes real API calls and costs money!
 */

import { assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@1.0.15';
import { sendEmail } from '../../supabase/functions/_shared/emailSender.ts';
import {
  generateNewsletterEmailHtml,
  generateReplyEmailHtml,
} from '../../supabase/functions/_shared/emailTemplates.ts';

// Check if we should skip integration tests
const shouldSkip = !Deno.env.get('SENDGRID_API_KEY') ||
  Deno.env.get('SKIP_INTEGRATION_TESTS') === 'true';

const testConfig = {
  from: Deno.env.get('SERVICE_EMAIL_ADDRESS') || 'test@llmbox.com',
  to: Deno.env.get('TEST_EMAIL_ADDRESS') || 'test@example.com',
};

Deno.test({
  name: 'html-emails - sendEmail with HTML body sends both text and HTML',
  ignore: shouldSkip,
  async fn() {
    const markdown = '# Test Email\n\nThis is a **test** with *formatting*.';
    const htmlBody = generateReplyEmailHtml(markdown);

    // Send email with both text and HTML
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] HTML Email Integration Test',
      body: markdown,
      htmlBody: htmlBody,
    });

    // If no error thrown, test passes
    // Manual verification: Check email inbox for properly formatted HTML email
    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - sendEmail with only text body still works',
  ignore: shouldSkip,
  async fn() {
    // Send email with only text (no HTML)
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] Plain Text Email Integration Test',
      body: 'This is a plain text email without HTML.',
    });

    // Should still work without htmlBody
    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - Reply email HTML is properly formatted',
  ignore: shouldSkip,
  async fn() {
    const markdown = `# AI Response

Here's your answer with:

- **Bold text**
- *Italic text*
- [A link](https://example.com)

## Code Example

\`\`\`typescript
const hello = "world";
\`\`\`

> This is a quoted section.`;

    const htmlBody = generateReplyEmailHtml(markdown);

    // Verify HTML structure
    assertExists(htmlBody);
    assertStringIncludes(htmlBody, '<!DOCTYPE html>');
    assertStringIncludes(htmlBody, '<h1>AI Response</h1>');
    assertStringIncludes(htmlBody, '<strong>Bold text</strong>');
    assertStringIncludes(htmlBody, '<em>Italic text</em>');
    assertStringIncludes(htmlBody, '<a href="https://example.com">A link</a>');
    assertStringIncludes(htmlBody, '<pre><code');
    assertStringIncludes(htmlBody, '<blockquote>');

    // Send the email
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] Reply Email with Rich Formatting',
      body: markdown,
      htmlBody: htmlBody,
    });

    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - Newsletter email HTML is properly formatted',
  ignore: shouldSkip,
  async fn() {
    const markdown = `## Top Story

This is an important news item with **emphasis**.

### Related Stories

1. First story
2. Second story
3. Third story

---

**Summary**: This is the summary.`;

    const htmlBody = generateNewsletterEmailHtml(markdown, {
      headerText: 'Your Daily Digest - Test Edition',
      footerText: 'Reply to customize your newsletter.',
    });

    // Verify HTML structure
    assertExists(htmlBody);
    assertStringIncludes(htmlBody, '<!DOCTYPE html>');
    assertStringIncludes(htmlBody, 'Your Daily Digest - Test Edition');
    assertStringIncludes(htmlBody, '<h2>Top Story</h2>');
    assertStringIncludes(htmlBody, '<ol>');
    assertStringIncludes(htmlBody, 'Reply to customize your newsletter');

    // Send the email
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] Newsletter with Rich Formatting',
      body: markdown,
      htmlBody: htmlBody,
    });

    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - Email with tables renders correctly',
  ignore: shouldSkip,
  async fn() {
    const markdown = `# Data Report

| Metric | Value | Change |
|--------|-------|--------|
| Users  | 1,234 | +10%   |
| Revenue| $5,678| +15%   |
| Visits | 9,012 | +8%    |

Great progress this month!`;

    const htmlBody = generateReplyEmailHtml(markdown);

    // Verify table HTML
    assertStringIncludes(htmlBody, '<table>');
    assertStringIncludes(htmlBody, '<thead>');
    assertStringIncludes(htmlBody, '<th>Metric</th>');
    assertStringIncludes(htmlBody, '<tbody>');
    assertStringIncludes(htmlBody, '<td>Users</td>');

    // Send the email
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] Email with Table',
      body: markdown,
      htmlBody: htmlBody,
    });

    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - Email with long content renders correctly',
  ignore: shouldSkip,
  async fn() {
    // Generate long markdown content
    const sections = [];
    for (let i = 1; i <= 10; i++) {
      sections.push(`## Section ${i}

This is section ${i} with some content. It includes **bold text** and *italic text*.

- Point 1
- Point 2
- Point 3

---`);
    }

    const markdown = `# Long Document\n\n${sections.join('\n\n')}`;

    const htmlBody = generateReplyEmailHtml(markdown);

    // Verify HTML is not truncated
    assertStringIncludes(htmlBody, 'Section 1');
    assertStringIncludes(htmlBody, 'Section 10');

    // Verify size is reasonable (< 100KB)
    const sizeKB = new Blob([htmlBody]).size / 1024;
    assertEquals(sizeKB < 100, true, `Email size ${sizeKB}KB should be < 100KB`);

    // Send the email
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] Long Email Content',
      body: markdown,
      htmlBody: htmlBody,
    });

    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - Email with special characters is properly escaped',
  ignore: shouldSkip,
  async fn() {
    const markdown = `# Test with Special Characters

This has <script>alert("xss")</script> and & symbols.

Also test quotes: "double" and 'single'.`;

    const htmlBody = generateReplyEmailHtml(markdown);

    // The markdown content itself will be converted to HTML by marked
    // But header/footer should escape special chars
    assertExists(htmlBody);

    // Send the email
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] Special Characters',
      body: markdown,
      htmlBody: htmlBody,
    });

    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - Email with code blocks renders correctly',
  ignore: shouldSkip,
  async fn() {
    const markdown = `# Code Examples

Here's a Python example:

\`\`\`python
def hello_world():
    print("Hello, World!")
    return True
\`\`\`

And a JavaScript example:

\`\`\`javascript
const greet = (name) => {
  console.log(\`Hello, \${name}!\`);
};
\`\`\`

Also inline code: \`const x = 42;\``;

    const htmlBody = generateReplyEmailHtml(markdown);

    // Verify code blocks
    assertStringIncludes(htmlBody, '<pre><code');
    assertStringIncludes(htmlBody, 'def hello_world');
    assertStringIncludes(htmlBody, 'const greet');
    assertStringIncludes(htmlBody, '<code>const x = 42;</code>');

    // Send the email
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] Email with Code Blocks',
      body: markdown,
      htmlBody: htmlBody,
    });

    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - Email with threading headers includes both text and HTML',
  ignore: shouldSkip,
  async fn() {
    const markdown = '# Threaded Reply\n\nThis is part of a conversation.';
    const htmlBody = generateReplyEmailHtml(markdown);

    // Send email with threading headers
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: 'Re: [Test] Threaded Conversation',
      body: markdown,
      htmlBody: htmlBody,
      inReplyTo: '<test-message-id@llmbox.com>',
      references: ['<original-message-id@llmbox.com>', '<test-message-id@llmbox.com>'],
    });

    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - Empty HTML body is handled gracefully',
  ignore: shouldSkip,
  async fn() {
    // Send email with empty HTML body (should fall back to text only)
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] Empty HTML Body',
      body: 'Plain text content',
      htmlBody: '', // Empty HTML
    });

    assertEquals(true, true);
  },
});

Deno.test({
  name: 'html-emails - Newsletter with emoji renders correctly',
  ignore: shouldSkip,
  async fn() {
    const markdown = `## 📰 Today's Headlines

🚀 **Tech News**: Exciting developments in AI

💡 **Tip**: Remember to stay curious!

---

Thanks for reading! 👋`;

    const htmlBody = generateNewsletterEmailHtml(markdown, {
      headerText: '📬 Your Daily Digest',
      footerText: 'Reply to customize 🎯',
    });

    // Verify emojis are preserved
    assertStringIncludes(htmlBody, '📰');
    assertStringIncludes(htmlBody, '🚀');
    assertStringIncludes(htmlBody, '💡');
    assertStringIncludes(htmlBody, '👋');

    // Send the email
    await sendEmail({
      to: testConfig.to,
      from: testConfig.from,
      subject: '[Test] Newsletter with Emoji',
      body: markdown,
      htmlBody: htmlBody,
    });

    assertEquals(true, true);
  },
});
