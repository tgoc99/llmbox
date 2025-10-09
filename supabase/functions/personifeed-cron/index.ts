/**
 * personifeed-cron Edge Function
 * Daily newsletter generation and delivery (triggered by Supabase Cron at 11am ET)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { logInfo, logError } from '../_shared/logger.ts';
import { getAllActiveUsers, getUserCustomizations, createNewsletter } from './database.ts';
import { generateNewsletterContent } from './newsletterGenerator.ts';
import { sendNewsletterEmail as sendNewsletter } from '../_shared/emailSender.ts';

/**
 * Process a single user: generate newsletter and send email
 */
const processUser = async (user: { id: string; email: string }): Promise<boolean> => {
  try {
    // Fetch user customizations
    const customizations = await getUserCustomizations(user.id);

    if (customizations.length === 0) {
    logError('no_customizations_found', {
      userId: user.id,
      email: user.email,
      message: 'User has no customizations stored',
    });
      return false;
    }

    // Generate newsletter content
    const content = await generateNewsletterContent(
      { ...user, active: true, created_at: new Date() },
      customizations,
    );

    // Create newsletter record in database (status: pending)
    const newsletter = await createNewsletter(user.id, content, 'sent');

    // Send email
    await sendNewsletter(user.id, user.email, content);

    logInfo('user_processed_successfully', {
      userId: user.id,
      email: user.email,
      newsletterId: newsletter.id,
    });

    return true;
  } catch (error) {
    // Create failed newsletter record
    try {
      await createNewsletter(user.id, '', 'failed');
    } catch (dbError) {
      logError('failed_to_record_failure', {
        userId: user.id,
        email: user.email,
        dbError: dbError instanceof Error ? dbError.message : String(dbError),
        dbStack: dbError instanceof Error ? dbError.stack : undefined,
      });
    }

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

    // Fetch all active users
    const users = await getAllActiveUsers();

    logInfo('users_fetched', {
      count: users.length,
    });

    if (users.length === 0) {
      logInfo('no_active_users', {
        durationMs: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active users to process',
          stats: {
            totalUsers: 0,
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

    // Process each user
    let successCount = 0;
    let failureCount = 0;

    // Process users in parallel (10 at a time to avoid overwhelming APIs)
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(processUser));

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
      totalUsers: users.length,
      successCount,
      failureCount,
      durationMs: duration,
      successRate: ((successCount / users.length) * 100).toFixed(2) + '%',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cron job completed',
        stats: {
          totalUsers: users.length,
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
serve(async (_req: Request): Promise<Response> => {
  return handleCron();
});

