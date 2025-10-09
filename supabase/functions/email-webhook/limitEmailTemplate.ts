/**
 * Email templates for usage limit notifications
 */

import { User } from './database.ts';
import { formatCost } from './usageTracker.ts';

/**
 * Get the web app URL from environment
 */
const getWebAppUrl = (): string => {
  return Deno.env.get('WEB_APP_URL') || 'https://llmbox.ai';
};

/**
 * Generate email subject for limit exceeded
 */
export const getLimitExceededSubject = (): string => {
  return '🚀 You\'ve reached your LLMBox free tier limit';
};

/**
 * Generate HTML email body for limit exceeded
 */
export const getLimitExceededHtmlBody = (user: User): string => {
  const webAppUrl = getWebAppUrl();
  const pricingUrl = `${webAppUrl}/pricing?email=${encodeURIComponent(user.email)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLMBox - Upgrade Required</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
      font-size: 28px;
    }
    .content {
      margin-bottom: 30px;
    }
    .stats {
      background-color: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .stats p {
      margin: 5px 0;
      font-size: 14px;
    }
    .cta {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .features {
      margin: 20px 0;
    }
    .features ul {
      list-style: none;
      padding: 0;
    }
    .features li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
    }
    .features li:before {
      content: "✓";
      color: #10b981;
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 You've Maxed Out Your Free Tier!</h1>
    </div>

    <div class="content">
      <p>Hi there,</p>

      <p>Great news – you've been using LLMBox so much that you've hit your free tier limit! We love to see it. 🎉</p>

      <div class="stats">
        <p><strong>Your Usage:</strong></p>
        <p>💰 Total Cost: ${formatCost(user.cost_used_usd)}</p>
        <p>📊 Limit: ${formatCost(user.cost_limit_usd)}</p>
        <p>📧 Email: ${user.email}</p>
      </div>

      <p>To keep the conversation going, you'll need to upgrade to one of our paid plans. Here's what you'll get:</p>

      <div class="features">
        <ul>
          <li><strong>More credits</strong> – $10 to $1000 in monthly API credits</li>
          <li><strong>Access to GPT-4o</strong> – Use the most advanced models</li>
          <li><strong>Priority support</strong> – Get help when you need it</li>
          <li><strong>No interruptions</strong> – Keep your AI conversations flowing</li>
        </ul>
      </div>

      <div class="cta">
        <a href="${pricingUrl}" class="button">View Pricing & Upgrade →</a>
      </div>

      <p>Our plans start at just <strong>$9/month</strong> for the Basic plan, which gives you $10 in API credits (enough for ~100-150 emails).</p>

      <p>Thanks for being an awesome LLMBox user! 🙌</p>

      <p>Best,<br>The LLMBox Team</p>
    </div>

    <div class="footer">
      <p>Have questions? Just reply to this email.</p>
      <p><a href="${webAppUrl}">Visit LLMBox</a> | <a href="${pricingUrl}">View Pricing</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generate plain text email body for limit exceeded
 */
export const getLimitExceededTextBody = (user: User): string => {
  const webAppUrl = getWebAppUrl();
  const pricingUrl = `${webAppUrl}/pricing?email=${encodeURIComponent(user.email)}`;

  return `
You've Maxed Out Your Free Tier!

Hi there,

Great news – you've been using LLMBox so much that you've hit your free tier limit! We love to see it.

YOUR USAGE:
- Total Cost: ${formatCost(user.cost_used_usd)}
- Limit: ${formatCost(user.cost_limit_usd)}
- Email: ${user.email}

To keep the conversation going, you'll need to upgrade to one of our paid plans.

WHAT YOU'LL GET:
✓ More credits – $10 to $1000 in monthly API credits
✓ Access to GPT-4o – Use the most advanced models
✓ Priority support – Get help when you need it
✓ No interruptions – Keep your AI conversations flowing

Our plans start at just $9/month for the Basic plan, which gives you $10 in API credits (enough for ~100-150 emails).

UPGRADE NOW:
${pricingUrl}

Thanks for being an awesome LLMBox user!

Best,
The LLMBox Team

---
Have questions? Just reply to this email.
Visit: ${webAppUrl}
  `.trim();
};

/**
 * Generate email subject for subscription inactive
 */
export const getSubscriptionInactiveSubject = (): string => {
  return '⚠️ Your LLMBox subscription needs attention';
};

/**
 * Generate HTML email body for inactive subscription
 */
export const getSubscriptionInactiveHtmlBody = (user: User): string => {
  const webAppUrl = getWebAppUrl();
  const billingUrl = `${webAppUrl}/billing?email=${encodeURIComponent(user.email)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLMBox - Subscription Issue</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #dc2626;
      margin: 0;
      font-size: 28px;
    }
    .warning-box {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .cta {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #dc2626;
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Subscription Issue</h1>
    </div>

    <div class="warning-box">
      <p><strong>Your LLMBox subscription is currently inactive.</strong></p>
      <p>Status: ${user.subscription_status || 'Inactive'}</p>
    </div>

    <p>We couldn't process your payment, or your subscription may have been cancelled.</p>

    <p>To continue using LLMBox, please update your payment method or reactivate your subscription.</p>

    <div class="cta">
      <a href="${billingUrl}" class="button">Update Billing →</a>
    </div>

    <p>If you have questions or need help, just reply to this email.</p>

    <p>Best,<br>The LLMBox Team</p>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generate plain text email body for inactive subscription
 */
export const getSubscriptionInactiveTextBody = (user: User): string => {
  const webAppUrl = getWebAppUrl();
  const billingUrl = `${webAppUrl}/billing?email=${encodeURIComponent(user.email)}`;

  return `
Your LLMBox Subscription Needs Attention

Hi there,

Your LLMBox subscription is currently inactive.
Status: ${user.subscription_status || 'Inactive'}

We couldn't process your payment, or your subscription may have been cancelled.

To continue using LLMBox, please update your payment method or reactivate your subscription.

UPDATE BILLING:
${billingUrl}

If you have questions or need help, just reply to this email.

Best,
The LLMBox Team
  `.trim();
};

