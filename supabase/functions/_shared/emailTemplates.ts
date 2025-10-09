/**
 * Email template generation and markdown conversion
 * Converts markdown content to HTML and wraps in email templates
 */

import { marked } from 'npm:marked@12.0.0';
import { CONTAINER_STYLES, EMAIL_STYLES, TYPOGRAPHY_STYLES } from './emailStyles.ts';

/**
 * Options for email template generation
 */
export interface EmailTemplateOptions {
  /** Whether to include a header section */
  includeHeader?: boolean;
  /** Header text (if includeHeader is true) */
  headerText?: string;
  /** Footer text (optional) */
  footerText?: string;
  /** Email type for styling variations */
  type?: 'reply' | 'newsletter';
}

/**
 * Configure marked options for email rendering
 */
const configureMarked = (): void => {
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert line breaks to <br>
  });
};

/**
 * Convert markdown string to HTML
 * Uses marked library to parse markdown and generate clean HTML
 * @param markdown - Markdown content to convert
 * @returns HTML string
 */
export const markdownToHtml = (markdown: string): string => {
  if (!markdown || markdown.trim() === '') {
    return '';
  }

  configureMarked();

  // Parse markdown to HTML
  const html = marked.parse(markdown) as string;

  return html.trim();
};

/**
 * Generate plain text fallback from markdown
 * For now, returns markdown as-is (readable in text-only clients)
 * Future: Could strip markdown syntax for cleaner plain text
 * @param markdown - Markdown content
 * @returns Plain text version
 */
export const generatePlainTextFallback = (markdown: string): string => {
  return markdown;
};

/**
 * Wrap HTML content in email template
 * Creates responsive, email-client-compatible HTML structure
 * @param htmlContent - HTML content to wrap (already converted from markdown)
 * @param options - Template options
 * @returns Complete HTML email string
 */
export const wrapInEmailTemplate = (
  htmlContent: string,
  options: EmailTemplateOptions = {},
): string => {
  const { includeHeader = false, headerText, footerText } = options;

  const headerSection = includeHeader && headerText
    ? `
          <tr>
            <td style="${CONTAINER_STYLES.headerCell}">
              <h2 style="${TYPOGRAPHY_STYLES.headerTitle}">${escapeHtml(headerText)}</h2>
            </td>
          </tr>`
    : '';

  const footerSection = footerText
    ? `
          <tr>
            <td style="${CONTAINER_STYLES.footerCell}">
              <p style="${TYPOGRAPHY_STYLES.footerText}">${escapeHtml(footerText)}</p>
            </td>
          </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${EMAIL_STYLES}</style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="${CONTAINER_STYLES.outerTable}" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="${CONTAINER_STYLES.innerTable}" cellpadding="0" cellspacing="0">${headerSection}
          <tr>
            <td style="${CONTAINER_STYLES.bodyCell}">
              ${htmlContent}
            </td>
          </tr>${footerSection}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generate HTML email for reply emails (LLMBox use case)
 * Clean, minimal design for conversational replies
 * @param markdownContent - LLM response in markdown format
 * @returns Complete HTML email string
 */
export const generateReplyEmailHtml = (markdownContent: string): string => {
  const htmlContent = markdownToHtml(markdownContent);
  return wrapInEmailTemplate(htmlContent, {
    includeHeader: false,
    type: 'reply',
  });
};

/**
 * Generate HTML email for newsletters (Personifeed use case)
 * Newsletter-style with header and footer
 * @param markdownContent - Newsletter content in markdown format
 * @param options - Newsletter-specific options
 * @returns Complete HTML email string
 */
export const generateNewsletterEmailHtml = (
  markdownContent: string,
  options: { headerText?: string; footerText?: string } = {},
): string => {
  const htmlContent = markdownToHtml(markdownContent);
  return wrapInEmailTemplate(htmlContent, {
    includeHeader: true,
    headerText: options.headerText,
    footerText: options.footerText || 'Reply to this email to customize future newsletters.',
    type: 'newsletter',
  });
};

/**
 * Escape HTML special characters
 * Prevents XSS and ensures content displays correctly
 * @param text - Text to escape
 * @returns Escaped text
 */
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
};

/**
 * Validate markdown content is safe and reasonable
 * @param markdown - Markdown content to validate
 * @returns true if valid, throws error if invalid
 */
export const validateMarkdownContent = (markdown: string): boolean => {
  // Check for empty content
  if (!markdown || markdown.trim() === '') {
    throw new Error('Markdown content cannot be empty');
  }

  // Check for unreasonably large content (> 500KB)
  const maxSize = 500 * 1024; // 500KB
  if (markdown.length > maxSize) {
    throw new Error(`Markdown content exceeds maximum size of ${maxSize} bytes`);
  }

  return true;
};
