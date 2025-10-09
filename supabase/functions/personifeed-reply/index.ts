/**
 * personifeed-reply Edge Function
 * Handles reply emails from users for customization feedback
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { logInfo, logError } from '../_shared/logger.ts';
import { handleError, ValidationError } from '../_shared/errors.ts';
import { parseReplyEmail } from './emailParser.ts';
import { getUserById, getUserByEmail, createUser, addFeedback, addInitialCustomization } from './database.ts';
import { sendConfirmationEmail } from '../personifeed-cron/emailSender.ts';

/**
 * Validate feedback content length
 */
const validateFeedback = (content: string): void => {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Feedback content is empty');
  }

  if (trimmed.length > 2000) {
    throw new ValidationError(
      `Feedback is too long (max 2000 characters, got ${trimmed.length})`,
    );
  }
};

/**
 * Main handler for reply emails
 */
const handleReply = async (req: Request): Promise<Response> => {
  const startTime = Date.now();

  try {
    // Parse form data from SendGrid webhook
    const formData = await req.formData();

    // Parse email
    const { from, to, userId, body, messageId } = parseReplyEmail(formData);

    logInfo('reply_received', {
      from,
      to,
      userId,
      bodyLength: body.length,
      messageId,
    });

    // Validate feedback content
    validateFeedback(body);

    const sanitizedBody = body.trim();

    // Try to get user by userId from TO address first (more efficient)
    let user = userId ? await getUserById(userId) : null;

    // Fallback to looking up by email if userId not found or doesn't match
    if (!user || user.email !== from) {
      logInfo('user_lookup_fallback', {
        userId,
        from,
        reason: !user ? 'userId_not_found' : 'email_mismatch',
      });

      user = await getUserByEmail(from);
    }

    if (!user) {
      // New user - create user and add initial customization
      logInfo('reply_from_new_user', {
        email: from,
      });

      user = await createUser(from);
      await addInitialCustomization(user.id, sanitizedBody);

      logInfo('new_user_created_from_reply', {
        userId: user.id,
        email: from,
        durationMs: Date.now() - startTime,
      });
    } else {
      // Existing user - add feedback
      await addFeedback(user.id, sanitizedBody);

      logInfo('feedback_stored', {
        userId: user.id,
        email: from,
        durationMs: Date.now() - startTime,
      });
    }

    // Send confirmation email with userId for dynamic reply address
    await sendConfirmationEmail(user.id, from, messageId || undefined);

    logInfo('reply_processed_successfully', {
      userId: user.id,
      email: from,
      durationMs: Date.now() - startTime,
    });

    // Always return 200 to SendGrid to prevent retry loops
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reply processed successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    // Log error but return 200 to SendGrid to prevent retry loops
    logError('reply_processing_failed', {
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });

    // Return 200 even on error to prevent SendGrid retries
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Reply processing failed',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

/**
 * Serve HTTP requests
 */
serve(async (req: Request): Promise<Response> => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return handleReply(req);
});

