/**
 * personifeed-signup Edge Function
 * Handles user signups from the landing page
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { logInfo } from '../_shared/logger.ts';
import { handleError } from '../_shared/errors.ts';
import type { SignupRequest, SignupResponse } from '../_shared/types.ts';
import { createOrGetSubscriber } from './database.ts';
import { sanitizePrompt, validateEmail, validatePrompt } from './validation.ts';

/**
 * Main handler for signup requests
 */
const handleSignup = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  let requestBody: unknown = null;

  try {
    // Parse request body
    const body: SignupRequest = await req.json();
    requestBody = body;
    const { email, initialPrompt } = body;

    // Validate inputs
    validateEmail(email);
    validatePrompt(initialPrompt);

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPrompt = sanitizePrompt(initialPrompt);

    logInfo('signup_attempt', {
      email: sanitizedEmail,
      promptLength: sanitizedPrompt.length,
    });

    // Create or get subscriber (interests = initial prompt)
    const { user, subscriber } = await createOrGetSubscriber(
      sanitizedEmail,
      sanitizedPrompt,
    );

    // Check if this was an existing active subscriber
    const isExistingSubscriber = subscriber.created_at !== subscriber.updated_at ||
      subscriber.interests !== sanitizedPrompt;

    if (isExistingSubscriber) {
      logInfo('signup_existing_user', {
        userId: user.id,
        subscriberId: subscriber.id,
        email: sanitizedEmail,
        durationMs: Date.now() - startTime,
      });

      const response: SignupResponse = {
        success: true,
        message:
          "Welcome back! We've updated your preferences. Your next newsletter arrives tomorrow at 11am ET.",
        userId: user.id,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // New subscriber
    logInfo('signup_new_user', {
      userId: user.id,
      subscriberId: subscriber.id,
      email: sanitizedEmail,
      durationMs: Date.now() - startTime,
    });

    const response: SignupResponse = {
      success: true,
      message: 'Success! Your first newsletter arrives tomorrow at 11am ET.',
      userId: user.id,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleError(error, 'signup_failed', requestBody);
  }
};

/**
 * Serve HTTP requests
 */
serve((req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return Promise.resolve(handlePreflight());
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return Promise.resolve(
      new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }),
    );
  }

  return handleSignup(req);
});
