/**
 * Unit tests for email styles constants
 */

import { assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@1.0.15';
import {
  CONTAINER_STYLES,
  EMAIL_COLORS,
  EMAIL_FONTS,
  EMAIL_STYLES,
  TYPOGRAPHY_STYLES,
} from '../../supabase/functions/_shared/emailStyles.ts';

Deno.test('emailStyles - EMAIL_COLORS contains all required colors', () => {
  assertExists(EMAIL_COLORS.textPrimary);
  assertExists(EMAIL_COLORS.textSecondary);
  assertExists(EMAIL_COLORS.textMuted);
  assertExists(EMAIL_COLORS.textLink);
  assertExists(EMAIL_COLORS.bgWhite);
  assertExists(EMAIL_COLORS.bgLight);
  assertExists(EMAIL_COLORS.bgCodeBlock);
  assertExists(EMAIL_COLORS.borderLight);
  assertExists(EMAIL_COLORS.borderMedium);
  assertExists(EMAIL_COLORS.borderDark);
  assertExists(EMAIL_COLORS.blockquoteBorder);
});

Deno.test('emailStyles - EMAIL_COLORS has valid hex colors', () => {
  // Check that all colors are valid hex codes
  const hexColorRegex = /^#[0-9A-Fa-f]{3,6}$/;

  assertEquals(hexColorRegex.test(EMAIL_COLORS.textPrimary), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.textSecondary), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.textMuted), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.textLink), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.bgWhite), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.bgLight), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.bgCodeBlock), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.borderLight), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.borderMedium), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.borderDark), true);
  assertEquals(hexColorRegex.test(EMAIL_COLORS.blockquoteBorder), true);
});

Deno.test('emailStyles - EMAIL_FONTS contains font stacks', () => {
  assertExists(EMAIL_FONTS.sansSerif);
  assertExists(EMAIL_FONTS.monospace);

  // Check that font stacks contain common fallback fonts
  assertStringIncludes(EMAIL_FONTS.sansSerif, 'sans-serif');
  assertStringIncludes(EMAIL_FONTS.monospace, 'monospace');
});

Deno.test('emailStyles - EMAIL_STYLES is a non-empty string', () => {
  assertExists(EMAIL_STYLES);
  assertEquals(typeof EMAIL_STYLES, 'string');
  assertEquals(EMAIL_STYLES.length > 0, true);
});

Deno.test('emailStyles - EMAIL_STYLES contains CSS rules', () => {
  // Check for key CSS selectors
  assertStringIncludes(EMAIL_STYLES, 'body {');
  assertStringIncludes(EMAIL_STYLES, 'h1 {');
  assertStringIncludes(EMAIL_STYLES, 'h2 {');
  assertStringIncludes(EMAIL_STYLES, 'h3 {');
  assertStringIncludes(EMAIL_STYLES, 'p {');
  assertStringIncludes(EMAIL_STYLES, 'ul, ol {');
  assertStringIncludes(EMAIL_STYLES, 'li {');
  assertStringIncludes(EMAIL_STYLES, 'code {');
  assertStringIncludes(EMAIL_STYLES, 'pre {');
  assertStringIncludes(EMAIL_STYLES, 'a {');
  assertStringIncludes(EMAIL_STYLES, 'blockquote {');
  assertStringIncludes(EMAIL_STYLES, 'table {');
  assertStringIncludes(EMAIL_STYLES, 'hr {');
});

Deno.test('emailStyles - EMAIL_STYLES contains typography properties', () => {
  // Check for typography-related properties
  assertStringIncludes(EMAIL_STYLES, 'font-size');
  assertStringIncludes(EMAIL_STYLES, 'font-weight');
  assertStringIncludes(EMAIL_STYLES, 'line-height');
  assertStringIncludes(EMAIL_STYLES, 'margin');
  assertStringIncludes(EMAIL_STYLES, 'padding');
  assertStringIncludes(EMAIL_STYLES, 'color');
});

Deno.test('emailStyles - EMAIL_STYLES contains layout properties', () => {
  // Check for layout properties
  assertStringIncludes(EMAIL_STYLES, 'background');
  assertStringIncludes(EMAIL_STYLES, 'border');
});

Deno.test('emailStyles - CONTAINER_STYLES contains all layout styles', () => {
  assertExists(CONTAINER_STYLES.outerTable);
  assertExists(CONTAINER_STYLES.innerTable);
  assertExists(CONTAINER_STYLES.headerCell);
  assertExists(CONTAINER_STYLES.bodyCell);
  assertExists(CONTAINER_STYLES.footerCell);
});

Deno.test('emailStyles - CONTAINER_STYLES has proper table styles', () => {
  // Check for width properties in table styles
  assertStringIncludes(CONTAINER_STYLES.outerTable, 'width');
  assertStringIncludes(CONTAINER_STYLES.innerTable, 'width');
  assertStringIncludes(CONTAINER_STYLES.innerTable, 'max-width');
});

Deno.test('emailStyles - CONTAINER_STYLES uses EMAIL_COLORS', () => {
  // Check that container styles reference color constants
  assertStringIncludes(CONTAINER_STYLES.outerTable, '#');
  assertStringIncludes(CONTAINER_STYLES.innerTable, '#');
  assertStringIncludes(CONTAINER_STYLES.headerCell, '#');
  assertStringIncludes(CONTAINER_STYLES.footerCell, '#');
});

Deno.test('emailStyles - TYPOGRAPHY_STYLES contains text styles', () => {
  assertExists(TYPOGRAPHY_STYLES.headerTitle);
  assertExists(TYPOGRAPHY_STYLES.footerText);

  // Check for typography properties
  assertStringIncludes(TYPOGRAPHY_STYLES.headerTitle, 'font-size');
  assertStringIncludes(TYPOGRAPHY_STYLES.headerTitle, 'color');
  assertStringIncludes(TYPOGRAPHY_STYLES.footerText, 'font-size');
  assertStringIncludes(TYPOGRAPHY_STYLES.footerText, 'color');
});

Deno.test('emailStyles - Colors provide good contrast', () => {
  // Text colors should be dark
  assertEquals(EMAIL_COLORS.textPrimary.startsWith('#1'), true); // Dark color
  assertEquals(EMAIL_COLORS.textSecondary.startsWith('#3'), true); // Dark color

  // Background colors should be light
  assertEquals(EMAIL_COLORS.bgWhite, '#ffffff');
  assertEquals(EMAIL_COLORS.bgLight.startsWith('#f'), true); // Light color
});

Deno.test('emailStyles - Link color is distinct', () => {
  // Link color should be different from text colors
  const linkColor = EMAIL_COLORS.textLink as string;
  const primaryColor = EMAIL_COLORS.textPrimary as string;
  const secondaryColor = EMAIL_COLORS.textSecondary as string;

  assertEquals(linkColor !== primaryColor, true);
  assertEquals(linkColor !== secondaryColor, true);

  // Link color should be recognizable as a link (blue-ish)
  assertStringIncludes(EMAIL_COLORS.textLink, '0066cc');
});

Deno.test('emailStyles - Code block has distinct background', () => {
  // Code blocks should have different background from regular content
  const codeBlockBg = EMAIL_COLORS.bgCodeBlock as string;
  const whiteBg = EMAIL_COLORS.bgWhite as string;

  assertEquals(codeBlockBg !== whiteBg, true);
  assertEquals(EMAIL_COLORS.bgCodeBlock.startsWith('#f'), true); // Light gray
});

Deno.test('emailStyles - EMAIL_STYLES is properly formatted CSS', () => {
  // Should not have leading/trailing whitespace
  assertEquals(EMAIL_STYLES.trim(), EMAIL_STYLES);

  // Should contain proper CSS syntax
  const openBraces = (EMAIL_STYLES.match(/{/g) || []).length;
  const closeBraces = (EMAIL_STYLES.match(/}/g) || []).length;
  assertEquals(openBraces, closeBraces, 'CSS braces should be balanced');
});

Deno.test('emailStyles - Heading sizes are hierarchical', () => {
  // Extract font sizes (simplified check)
  const h1Match = EMAIL_STYLES.match(/h1\s*{[^}]*font-size:\s*(\d+)px/);
  const h2Match = EMAIL_STYLES.match(/h2\s*{[^}]*font-size:\s*(\d+)px/);
  const h3Match = EMAIL_STYLES.match(/h3\s*{[^}]*font-size:\s*(\d+)px/);

  if (h1Match && h2Match && h3Match) {
    const h1Size = parseInt(h1Match[1]);
    const h2Size = parseInt(h2Match[1]);
    const h3Size = parseInt(h3Match[1]);

    // H1 should be larger than H2, H2 larger than H3
    assertEquals(h1Size > h2Size, true);
    assertEquals(h2Size > h3Size, true);
  }
});

Deno.test('emailStyles - Mobile responsive max-width', () => {
  // Email should have max-width constraint for readability
  assertStringIncludes(CONTAINER_STYLES.innerTable, '600px');
});

Deno.test('emailStyles - All styles use safe CSS properties', () => {
  // Email clients don't support all CSS properties
  // Check that we're not using unsupported properties like flexbox or grid
  assertEquals(EMAIL_STYLES.includes('display: flex'), false);
  assertEquals(EMAIL_STYLES.includes('display: grid'), false);
  assertEquals(EMAIL_STYLES.includes('position: absolute'), false);
  assertEquals(EMAIL_STYLES.includes('position: fixed'), false);
});
