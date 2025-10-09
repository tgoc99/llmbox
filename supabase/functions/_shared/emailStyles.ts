/**
 * Email CSS styling constants
 * Defines all styles for HTML email templates
 * Uses inline-safe CSS compatible with major email clients
 */

/**
 * Color palette for emails
 */
export const EMAIL_COLORS = {
  // Text colors
  textPrimary: '#1a1a1a',
  textSecondary: '#333333',
  textMuted: '#6c757d',
  textLink: '#0066cc',

  // Background colors
  bgWhite: '#ffffff',
  bgLight: '#f8f9fa',
  bgCodeBlock: '#f5f5f5',

  // Border colors
  borderLight: '#e9ecef',
  borderMedium: '#ddd',
  borderDark: '#e0e0e0',
  blockquoteBorder: '#ddd',
} as const;

/**
 * Font stack for emails (web-safe fonts with fallbacks)
 */
export const EMAIL_FONTS = {
  sansSerif:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  monospace: "'Courier New', Courier, monospace",
} as const;

/**
 * Complete CSS stylesheet for email templates
 * Includes styles for all markdown elements
 */
export const EMAIL_STYLES = `
  /* Reset and Base Styles */
  body {
    margin: 0;
    padding: 0;
    font-family: ${EMAIL_FONTS.sansSerif};
    background-color: ${EMAIL_COLORS.bgLight};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Typography */
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 24px 0 16px;
    color: ${EMAIL_COLORS.textPrimary};
    line-height: 1.2;
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 20px 0 12px;
    color: ${EMAIL_COLORS.textPrimary};
    line-height: 1.3;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 16px 0 10px;
    color: ${EMAIL_COLORS.textPrimary};
    line-height: 1.4;
  }

  h4 {
    font-size: 18px;
    font-weight: 600;
    margin: 14px 0 8px;
    color: ${EMAIL_COLORS.textPrimary};
    line-height: 1.4;
  }

  h5 {
    font-size: 16px;
    font-weight: 600;
    margin: 12px 0 8px;
    color: ${EMAIL_COLORS.textPrimary};
    line-height: 1.5;
  }

  h6 {
    font-size: 14px;
    font-weight: 600;
    margin: 12px 0 8px;
    color: ${EMAIL_COLORS.textPrimary};
    line-height: 1.5;
  }

  p {
    font-size: 16px;
    line-height: 1.6;
    margin: 12px 0;
    color: ${EMAIL_COLORS.textSecondary};
  }

  /* Lists */
  ul, ol {
    margin: 12px 0;
    padding-left: 24px;
  }

  li {
    margin: 6px 0;
    line-height: 1.6;
    color: ${EMAIL_COLORS.textSecondary};
  }

  /* Code */
  code {
    background: ${EMAIL_COLORS.bgCodeBlock};
    padding: 2px 6px;
    border-radius: 3px;
    font-family: ${EMAIL_FONTS.monospace};
    font-size: 14px;
    color: ${EMAIL_COLORS.textSecondary};
  }

  pre {
    background: ${EMAIL_COLORS.bgCodeBlock};
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 16px 0;
  }

  pre code {
    background: none;
    padding: 0;
    border-radius: 0;
    font-size: 13px;
  }

  /* Links */
  a {
    color: ${EMAIL_COLORS.textLink};
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* Blockquotes */
  blockquote {
    border-left: 4px solid ${EMAIL_COLORS.blockquoteBorder};
    margin: 16px 0;
    padding-left: 16px;
    color: #666;
    font-style: italic;
  }

  blockquote p {
    margin: 8px 0;
    color: #666;
  }

  /* Tables */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
  }

  th, td {
    border: 1px solid ${EMAIL_COLORS.borderMedium};
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: ${EMAIL_COLORS.bgCodeBlock};
    font-weight: 600;
    color: ${EMAIL_COLORS.textPrimary};
  }

  td {
    color: ${EMAIL_COLORS.textSecondary};
  }

  /* Horizontal Rules */
  hr {
    border: none;
    border-top: 1px solid ${EMAIL_COLORS.borderDark};
    margin: 24px 0;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 16px 0;
  }

  /* Strong and Emphasis */
  strong, b {
    font-weight: 700;
    color: ${EMAIL_COLORS.textPrimary};
  }

  em, i {
    font-style: italic;
  }

  /* Delete/Strikethrough */
  del, s {
    text-decoration: line-through;
    color: ${EMAIL_COLORS.textMuted};
  }
`.trim();

/**
 * Inline styles for email container table
 * Used for layout structure (email clients require tables)
 */
export const CONTAINER_STYLES = {
  outerTable: `width: 100%; background-color: ${EMAIL_COLORS.bgLight};`,
  innerTable:
    `width: 100%; max-width: 600px; margin: 0 auto; background-color: ${EMAIL_COLORS.bgWhite}; border-radius: 8px; overflow: hidden;`,
  headerCell:
    `padding: 20px; background-color: ${EMAIL_COLORS.bgLight}; border-bottom: 1px solid ${EMAIL_COLORS.borderLight};`,
  bodyCell: `padding: 30px;`,
  footerCell:
    `padding: 20px; background-color: ${EMAIL_COLORS.bgLight}; border-top: 1px solid ${EMAIL_COLORS.borderLight}; font-size: 12px; color: ${EMAIL_COLORS.textMuted}; text-align: center;`,
} as const;

/**
 * Typography styles for headers and footers
 */
export const TYPOGRAPHY_STYLES = {
  headerTitle: `margin: 0; font-size: 18px; color: ${EMAIL_COLORS.textMuted};`,
  footerText: `margin: 0; font-size: 12px; color: ${EMAIL_COLORS.textMuted};`,
} as const;
