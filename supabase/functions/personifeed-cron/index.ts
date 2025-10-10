/**
 * personifeed-cron Edge Function
 * Daily newsletter generation and delivery (triggered by Supabase Cron at 11am ET)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { logError, logInfo } from '../_shared/logger.ts';
import { config } from '../_shared/config.ts';
import {
  getAllActiveSubscribers,
  logNewsletterEmail,
  logNewsletterTokenUsage,
  type PersonifeedSubscriber,
} from './database.ts';
import { generateNewsletterContent } from './newsletterGenerator.ts';
import { sendNewsletterEmail as sendNewsletter } from '../_shared/emailSender.ts';

/**
 * Process a single subscriber: generate newsletter and send email
 */
const processSubscriber = async (subscriber: PersonifeedSubscriber): Promise<boolean> => {
  const { user, settings } = subscriber;

  try {
    // Check if user has initial prompt or topics
    if (!settings.initialPrompt && (!settings.topics || settings.topics.length === 0)) {
      logError('no_user_preferences', {
        userId: user.id,
        email: user.email,
        message: 'User has no initial prompt or topics configured',
      });
      return false;
    }

    // Generate newsletter content
    const llmResponse = await generateNewsletterContent(user, settings);

    // Send email
    const fromEmail = config.serviceEmailAddress;
    const subject = `Your Daily Personifeed - ${
      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }`;

    await sendNewsletter(user.id, user.email, llmResponse.content);

    // Log email to database
    try {
      const emailId = await logNewsletterEmail(
        user.id,
        user.email,
        fromEmail,
        subject,
        llmResponse.content,
        '', // No HTML body for now
      );

      // Log token usage
      await logNewsletterTokenUsage(user.id, emailId, llmResponse);
    } catch (dbError) {
      // Log error but don't fail the processing
      logError('failed_to_log_email', {
        userId: user.id,
        email: user.email,
        dbError: dbError instanceof Error ? dbError.message : String(dbError),
        dbStack: dbError instanceof Error ? dbError.stack : undefined,
      });
    }

    logInfo('user_processed_successfully', {
      userId: user.id,
      email: user.email,
      tokensUsed: llmResponse.tokenCount,
    });

    return true;
  } catch (error) {
    logError('user_processing_failed', {
      userId: user.id,
      email: user.email,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return false;
  }
};

/**
 * Main cron handler
 */
const handleCron = async (): Promise<Response> => {
  const startTime = Date.now();

  try {
    logInfo('cron_started', {
      timestamp: new Date().toISOString(),
    });

    // Fetch all active subscribers
    const subscribers = await getAllActiveSubscribers();

    logInfo('subscribers_fetched', {
      count: subscribers.length,
    });

    if (subscribers.length === 0) {
      logInfo('no_active_subscribers', {
        durationMs: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active subscribers to process',
          stats: {
            totalSubscribers: 0,
            successCount: 0,
            failureCount: 0,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Process each subscriber
    let successCount = 0;
    let failureCount = 0;

    // Process subscribers in parallel (10 at a time to avoid overwhelming APIs)
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(processSubscriber));

      results.forEach((success) => {
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
      });
    }

    const duration = Date.now() - startTime;

    logInfo('cron_completed', {
      totalSubscribers: subscribers.length,
      successCount,
      failureCount,
      durationMs: duration,
      successRate: ((successCount / subscribers.length) * 100).toFixed(2) + '%',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cron job completed',
        stats: {
          totalSubscribers: subscribers.length,
          successCount,
          failureCount,
          durationMs: duration,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logError('cron_failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Cron job failed',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

/**
 * Serve HTTP requests
 */
serve((_req: Request): Promise<Response> => {
  return handleCron();
});
