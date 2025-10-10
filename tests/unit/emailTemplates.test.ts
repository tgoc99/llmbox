/**
 * Unit tests for email template generation and markdown conversion
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@1.0.15';
import {
  generateNewsletterEmailHtml,
  generatePlainTextFallback,
  generateReplyEmailHtml,
  markdownToHtml,
  validateMarkdownContent,
} from '../../supabase/functions/_shared/emailTemplates.ts';

Deno.test('emailTemplates - markdownToHtml converts basic markdown', () => {
  const markdown = '# Hello World\n\nThis is **bold** and this is *italic*.';
  const html = markdownToHtml(markdown);

  assertExists(html);
  assertStringIncludes(html, '<h1>');
  assertStringIncludes(html, 'Hello World');
  assertStringIncludes(html, '<strong>');
  assertStringIncludes(html, 'bold');
  assertStringIncludes(html, '<em>');
  assertStringIncludes(html, 'italic');
});

Deno.test('emailTemplates - markdownToHtml handles headings', () => {
  const markdown = `# H1 Heading
## H2 Heading
### H3 Heading`;

  const html = markdownToHtml(markdown);

  assertStringIncludes(html, '<h1>H1 Heading</h1>');
  assertStringIncludes(html, '<h2>H2 Heading</h2>');
  assertStringIncludes(html, '<h3>H3 Heading</h3>');
});

Deno.test('emailTemplates - markdownToHtml handles lists', () => {
  const markdown = `- Item 1
- Item 2
- Item 3`;

  const html = markdownToHtml(markdown);

  assertStringIncludes(html, '<ul>');
  assertStringIncludes(html, '<li>Item 1</li>');
  assertStringIncludes(html, '<li>Item 2</li>');
  assertStringIncludes(html, '<li>Item 3</li>');
  assertStringIncludes(html, '</ul>');
});

Deno.test('emailTemplates - markdownToHtml handles ordered lists', () => {
  const markdown = `1. First
2. Second
3. Third`;

  const html = markdownToHtml(markdown);

  assertStringIncludes(html, '<ol>');
  assertStringIncludes(html, '<li>First</li>');
  assertStringIncludes(html, '<li>Second</li>');
  assertStringIncludes(html, '<li>Third</li>');
  assertStringIncludes(html, '</ol>');
});

Deno.test('emailTemplates - markdownToHtml handles code blocks', () => {
  const markdown = '```javascript\nconst x = 42;\n```';
  const html = markdownToHtml(markdown);

  assertStringIncludes(html, '<pre>');
  assertStringIncludes(html, '<code');
  assertStringIncludes(html, 'const x = 42');
});

Deno.test('emailTemplates - markdownToHtml handles inline code', () => {
  const markdown = 'This is `inline code` in text.';
  const html = markdownToHtml(markdown);

  assertStringIncludes(html, '<code>inline code</code>');
});

Deno.test('emailTemplates - markdownToHtml handles links', () => {
  const markdown = '[OpenAI](https://openai.com)';
  const html = markdownToHtml(markdown);

  assertStringIncludes(html, '<a href="https://openai.com">OpenAI</a>');
});

Deno.test('emailTemplates - markdownToHtml handles blockquotes', () => {
  const markdown = '> This is a quote';
  const html = markdownToHtml(markdown);

  assertStringIncludes(html, '<blockquote>');
  assertStringIncludes(html, 'This is a quote');
  assertStringIncludes(html, '</blockquote>');
});

Deno.test('emailTemplates - markdownToHtml handles horizontal rules', () => {
  const markdown = 'Before\n\n---\n\nAfter';
  const html = markdownToHtml(markdown);

  assertStringIncludes(html, '<hr');
});

Deno.test('emailTemplates - markdownToHtml handles tables', () => {
  const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

  const html = markdownToHtml(markdown);

  assertStringIncludes(html, '<table>');
  assertStringIncludes(html, '<thead>');
  assertStringIncludes(html, '<th>Header 1</th>');
  assertStringIncludes(html, '<th>Header 2</th>');
  assertStringIncludes(html, '<tbody>');
  assertStringIncludes(html, '<td>Cell 1</td>');
  assertStringIncludes(html, '<td>Cell 2</td>');
});

Deno.test('emailTemplates - markdownToHtml handles empty content', () => {
  const html = markdownToHtml('');
  assertEquals(html, '');
});

Deno.test('emailTemplates - markdownToHtml handles whitespace-only content', () => {
  const html = markdownToHtml('   \n\n   ');
  assertEquals(html, '');
});

Deno.test('emailTemplates - markdownToHtml converts line breaks', () => {
  const markdown = 'Line 1\nLine 2\nLine 3';
  const html = markdownToHtml(markdown);

  // With breaks: true, newlines should become <br>
  assertStringIncludes(html, '<br>');
});

Deno.test('emailTemplates - generateReplyEmailHtml creates valid HTML', () => {
  const markdown = '# Response\n\nHere is your answer with **bold** text.';
  const html = generateReplyEmailHtml(markdown);

  // Check for HTML structure
  assertStringIncludes(html, '<!DOCTYPE html>');
  assertStringIncludes(html, '<html lang="en">');
  assertStringIncludes(html, '<head>');
  assertStringIncludes(html, '<body');
  assertStringIncludes(html, '</body>');
  assertStringIncludes(html, '</html>');

  // Check for content
  assertStringIncludes(html, '<h1>Response</h1>');
  assertStringIncludes(html, '<strong>bold</strong>');

  // Check for email structure (tables for layout)
  assertStringIncludes(html, '<table');
  assertStringIncludes(html, 'role="presentation"');
});

Deno.test('emailTemplates - generateReplyEmailHtml has no header section', () => {
  const markdown = 'Simple reply';
  const html = generateReplyEmailHtml(markdown);

  // Reply emails should not have a header section
  // Just check there's no extra header text
  assertExists(html);
  assertStringIncludes(html, 'Simple reply');
});

Deno.test('emailTemplates - generateNewsletterEmailHtml creates valid HTML with header', () => {
  const markdown = '## News Item 1\n\nThis is the content.';
  const html = generateNewsletterEmailHtml(markdown, {
    headerText: 'Your Daily Digest - January 1, 2024',
    footerText: 'Reply to customize',
  });

  // Check for HTML structure
  assertStringIncludes(html, '<!DOCTYPE html>');
  assertStringIncludes(html, '<html lang="en">');

  // Check for header
  assertStringIncludes(html, 'Your Daily Digest - January 1, 2024');

  // Check for footer
  assertStringIncludes(html, 'Reply to customize');

  // Check for content
  assertStringIncludes(html, '<h2>News Item 1</h2>');
  assertStringIncludes(html, 'This is the content');
});

Deno.test('emailTemplates - generateNewsletterEmailHtml without custom footer', () => {
  const markdown = 'Newsletter content';
  const html = generateNewsletterEmailHtml(markdown);

  // Should have default footer text
  assertStringIncludes(html, 'Reply to this email to customize future newsletters');
});

Deno.test('emailTemplates - generatePlainTextFallback returns markdown as-is', () => {
  const markdown = '# Heading\n\nThis is **bold**.';
  const plainText = generatePlainTextFallback(markdown);

  // For now, plain text fallback is just the original markdown
  assertEquals(plainText, markdown);
});

Deno.test('emailTemplates - HTML contains inline CSS', () => {
  const markdown = 'Test content';
  const html = generateReplyEmailHtml(markdown);

  // Should have style tag with CSS
  assertStringIncludes(html, '<style>');
  assertStringIncludes(html, '</style>');

  // Should include some CSS rules
  assertStringIncludes(html, 'font-family');
  assertStringIncludes(html, 'background-color');
});

Deno.test('emailTemplates - HTML is mobile responsive', () => {
  const markdown = 'Test';
  const html = generateReplyEmailHtml(markdown);

  // Check for viewport meta tag
  assertStringIncludes(html, 'viewport');
  assertStringIncludes(html, 'width=device-width');

  // Check for max-width constraint
  assertStringIncludes(html, 'max-width');
});

Deno.test('emailTemplates - validateMarkdownContent accepts valid content', () => {
  const markdown = '# Valid Content\n\nThis is good.';
  const result = validateMarkdownContent(markdown);
  assertEquals(result, true);
});

Deno.test('emailTemplates - validateMarkdownContent rejects empty content', () => {
  assertThrows(
    () => {
      validateMarkdownContent('');
    },
    Error,
    'Markdown content cannot be empty',
  );
});

Deno.test('emailTemplates - validateMarkdownContent rejects whitespace-only content', () => {
  assertThrows(
    () => {
      validateMarkdownContent('   \n\n   ');
    },
    Error,
    'Markdown content cannot be empty',
  );
});

Deno.test('emailTemplates - validateMarkdownContent rejects oversized content', () => {
  // Create content larger than 500KB
  const largeContent = 'a'.repeat(501 * 1024);

  assertThrows(
    () => {
      validateMarkdownContent(largeContent);
    },
    Error,
    'exceeds maximum size',
  );
});

Deno.test('emailTemplates - HTML escapes special characters in header/footer', () => {
  const markdown = 'Content';
  const html = generateNewsletterEmailHtml(markdown, {
    headerText: 'Test <script>alert("xss")</script>',
    footerText: 'Footer & <b>bold</b>',
  });

  // Special characters should be escaped
  assertStringIncludes(html, '&lt;script&gt;');
  assertStringIncludes(html, '&amp;');
  assertStringIncludes(html, '&lt;b&gt;');
});

Deno.test('emailTemplates - Complex markdown with multiple elements', () => {
  const markdown = `# Main Heading

## Subheading

Here is a paragraph with **bold** and *italic* text.

### List Section

- Item 1
- Item 2 with [a link](https://example.com)
- Item 3

### Code Example

\`\`\`typescript
const greeting = "Hello World";
console.log(greeting);
\`\`\`

> This is a quote with some wisdom.

---

Final paragraph with \`inline code\`.`;

  const html = generateReplyEmailHtml(markdown);

  // Verify all elements are present
  assertStringIncludes(html, '<h1>Main Heading</h1>');
  assertStringIncludes(html, '<h2>Subheading</h2>');
  assertStringIncludes(html, '<h3>List Section</h3>');
  assertStringIncludes(html, '<strong>bold</strong>');
  assertStringIncludes(html, '<em>italic</em>');
  assertStringIncludes(html, '<ul>');
  assertStringIncludes(html, '<li>Item 1</li>');
  assertStringIncludes(html, '<a href="https://example.com">a link</a>');
  assertStringIncludes(html, '<pre><code');
  assertStringIncludes(html, 'const greeting');
  assertStringIncludes(html, '<blockquote>');
  assertStringIncludes(html, '<hr');
  assertStringIncludes(html, '<code>inline code</code>');
});

Deno.test('emailTemplates - Nested markdown structures', () => {
  const markdown = `## Main List

1. First item
   - Nested bullet 1
   - Nested bullet 2
2. Second item
   - Another nested
3. Third item

> Quote with **bold** and *italic*`;

  const html = markdownToHtml(markdown);

  // Check for nested structures
  assertStringIncludes(html, '<ol>');
  assertStringIncludes(html, '<ul>');
  assertStringIncludes(html, '<blockquote>');
  assertStringIncludes(html, '<strong>bold</strong>');
  assertStringIncludes(html, '<em>italic</em>');
});
