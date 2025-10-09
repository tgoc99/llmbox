/**
 * Email sending utilities for personifeed newsletters
 */

import sgMail from 'npm:@sendgrid/mail@8.1.6';
import { config } from '../_shared/config.ts';
import type { User } from '../_shared/types.ts';
import { EmailError } from '../_shared/errors.ts';
import { logInfo, logError } from '../_shared/logger.ts';
import { withRetry } from '../_shared/retryLogic.ts';

/**
 * Initialize SendGrid client
 */
let sendgridInitialized = false;

const initializeSendGrid = (): void => {
  if (!sendgridInitialized) {
    sgMail.setApiKey(config.sendgridApiKey);
    sendgridInitialized = true;
  }
};

/**
 * Generate dynamic reply address for a user
 * Format: reply+{userId}@{domain}
 * This allows us to identify which user is replying based on the TO address
 */
const getReplyAddress = (userId: string): string => {
  const domain = config.personifeedEmailDomain;
  // Use + addressing to encode userId in the email address
  // SendGrid will route all reply+*@domain emails to the inbound webhook
  return `reply+${userId}@${domain}`;
};

/**
 * Send newsletter email to user
 */
export const sendNewsletter = async (user: User, content: string): Promise<void> => {
  const startTime = Date.now();

  try {
    initializeSendGrid();

    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `Your Daily Digest - ${todayDate}`;

    const emailBody = `${content}

---

Reply to this email to customize future newsletters.`;

    // Use dynamic reply address based on user ID
    const fromAddress = getReplyAddress(user.id);

    const msg = {
      to: user.email,
      from: fromAddress,
      subject,
      text: emailBody,
    };

    logInfo('sendgrid_send_started', {
      userId: user.id,
      email: user.email,
      fromAddress,
      subject,
    });

    // Send email with retry logic
    await withRetry(async () => {
      await sgMail.send(msg);
    });

    const duration = Date.now() - startTime;

    logInfo('newsletter_sent', {
      userId: user.id,
      email: user.email,
      fromAddress,
      subject,
      durationMs: duration,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('newsletter_send_failed', {
      userId: user.id,
      email: user.email,
      error: errorMessage,
      durationMs: Date.now() - startTime,
    });

    throw new EmailError('Failed to send newsletter', {
      userId: user.id,
      email: user.email,
      error: errorMessage,
    });
  }
};

/**
 * Send confirmation email for reply
 */
export const sendConfirmationEmail = async (
  userId: string,
  userEmail: string,
  inReplyTo?: string,
): Promise<void> => {
  const startTime = Date.now();

  try {
    initializeSendGrid();

    const subject = 'Re: Your Daily Digest';
    const body =
      "Thanks for your feedback! Your customization will be reflected in tomorrow's newsletter at 11am ET.";

    // Use the same dynamic reply address for consistency
    const fromAddress = getReplyAddress(userId);

    const msg: {
      to: string;
      from: string;
      subject: string;
      text: string;
      inReplyTo?: string;
      references?: string;
    } = {
      to: userEmail,
      from: fromAddress,
      subject,
      text: body,
    };

    // Add threading headers if provided
    if (inReplyTo) {
      msg.inReplyTo = inReplyTo;
      msg.references = inReplyTo;
    }

    logInfo('confirmation_send_started', {
      email: userEmail,
      subject,
    });

    // Send email with retry logic
    await withRetry(async () => {
      await sgMail.send(msg);
    });

    const duration = Date.now() - startTime;

    logInfo('confirmation_sent', {
      email: userEmail,
      subject,
      durationMs: duration,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('confirmation_send_failed', {
      email: userEmail,
      error: errorMessage,
      durationMs: Date.now() - startTime,
    });

    // Don't throw error for confirmation emails - log and continue
    // We don't want to fail the entire operation if confirmation fails
  }
};

