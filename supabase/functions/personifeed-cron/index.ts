/**
 * personifeed-cron Edge Function
 * Daily newsletter generation and delivery (triggered by Supabase Cron at 11am ET)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { logError, logInfo } from '../_shared/logger.ts';
import {
  getAllActiveSubscribers,
  saveNewsletterEmail,
  type SubscriberWithUser,
} from './database.ts';
import { generateNewsletterContent } from './newsletterGenerator.ts';
import { sendNewsletterEmail as sendNewsletter } from '../_shared/emailSender.ts';

/**
 * Process a single subscriber: generate newsletter and send email
 */
const processSubscriber = async (
  subscriberData: SubscriberWithUser,
): Promise<boolean> => {
  const { user, subscriber, feedback } = subscriberData;

  try {
    if (!subscriber.interests) {
      logError('no_interests_found', {
        userId: user.id,
        email: user.email,
        message: 'Subscriber has no interests stored',
      });
      return false;
    }

    // Generate newsletter content with interests and feedback
    const content = await generateNewsletterContent(
      user,
      subscriber.interests,
      feedback,
    );

    // Send email first
    await sendNewsletter(user.id, user.email, content);

    // Save to database (with html content if available)
    const savedEmail = await saveNewsletterEmail(user.id, user.email, content, content);

    // Track AI usage (token tracking happens in newsletter generator)
    // Note: We'll need to update this when we have token data from the generator
    // await trackNewsletterAIUsage(user.id, savedEmail.id, 'gpt-4o-mini', 0, 0, 0);

    logInfo('subscriber_processed_successfully', {
      userId: user.id,
      email: user.email,
      emailId: savedEmail.id,
    });

    return true;
  } catch (error) {
    logError('subscriber_processing_failed', {
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

      results.forEach((success: boolean) => {
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
