import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { parseIncomingEmail, ValidationError } from './emailParser.ts';
import { formatOutgoingEmail, sendEmail } from './emailSender.ts';
import {
  getGenericErrorEmail,
  getOpenAIErrorEmail,
  getRateLimitErrorEmail,
  getTimeoutErrorEmail,
} from './errorTemplates.ts';
import { logCritical, logError, logInfo, logWarn } from './logger.ts';
import { generateResponse } from './llmClient.ts';
import { PerformanceTracker } from './performance.ts';

Deno.serve(async (req: Request) => {
  const perf = new PerformanceTracker();
  let messageId = 'unknown';

  try {
    // Check request method
    if (req.method !== 'POST') {
      logWarn('invalid_method', {
        method: req.method,
        path: new URL(req.url).pathname,
      });
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body as FormData
    const formData = await req.formData();

    // Log webhook received
    logInfo('webhook_received', {
      timestamp: new Date().toISOString(),
      contentType: req.headers.get('content-type'),
    });

    // Parse incoming email
    perf.start('webhook_parsing');
    const email = parseIncomingEmail(formData);
    const parsingTime = perf.end('webhook_parsing');
    messageId = email.messageId;

    logInfo('email_parsed', {
      messageId: email.messageId,
      from: email.from,
      to: email.to,
      subject: email.subject,
      bodyPreview: email.body.substring(0, 100),
      hasInReplyTo: email.inReplyTo !== null,
      referencesCount: email.references.length,
      processingTimeMs: parsingTime,
    });

    // Check if parsing took longer than 2 seconds
    if (parsingTime > 2000) {
      logWarn('slow_webhook_parsing', {
        messageId: email.messageId,
        processingTimeMs: parsingTime,
        threshold: 2000,
      });
    }

    // Generate LLM response with error handling
    perf.start('openai_call');
    let llmResponse;
    let errorEmail = null;

    try {
      logInfo('openai_call_started', {
        messageId: email.messageId,
        from: email.from,
        bodyLength: email.body.length,
      });

      llmResponse = await generateResponse(email);
      const llmTime = perf.end('openai_call');

      logInfo('openai_response_received', {
        messageId: email.messageId,
        model: llmResponse.model,
        tokenCount: llmResponse.tokenCount,
        completionTimeMs: llmTime,
        responseLength: llmResponse.content.length,
      });

      // Check if LLM call took longer than 20 seconds
      if (llmTime > 20000) {
        logWarn('slow_openai_call', {
          messageId: email.messageId,
          processingTimeMs: llmTime,
          threshold: 20000,
        });
      }
    } catch (error) {
      const llmTime = perf.end('openai_call');
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Detect error type
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
        // Rate limit error
        logWarn('openai_rate_limit', {
          messageId: email.messageId,
          error: errorMessage,
          processingTimeMs: llmTime,
        });
        errorEmail = getRateLimitErrorEmail(email);
      } else if (
        errorMessage.includes('timeout') || errorMessage.toLowerCase().includes('timed out')
      ) {
        // Timeout error
        logWarn('openai_timeout', {
          messageId: email.messageId,
          error: errorMessage,
          processingTimeMs: llmTime,
        });
        errorEmail = getTimeoutErrorEmail(email);
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        // Auth error - critical
        logCritical('openai_auth_error', {
          messageId: email.messageId,
          error: errorMessage,
        });
        errorEmail = getGenericErrorEmail(email);
      } else {
        // Generic error
        logError('openai_error', {
          messageId: email.messageId,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
        errorEmail = getOpenAIErrorEmail(email, error as Error);
      }
    }

    // Format outgoing email (either LLM response or error)
    perf.start('email_send');
    const outgoingEmail = errorEmail || formatOutgoingEmail(email, llmResponse);

    try {
      await sendEmail(outgoingEmail);
      const emailSendTime = perf.end('email_send');

      logInfo('email_sent', {
        messageId: email.messageId,
        recipient: outgoingEmail.to,
        subject: outgoingEmail.subject,
        sendTimeMs: emailSendTime,
        isErrorEmail: errorEmail !== null,
      });

      // Check if email send took longer than 5 seconds
      if (emailSendTime > 5000) {
        logWarn('slow_email_send', {
          messageId: email.messageId,
          sendTimeMs: emailSendTime,
          threshold: 5000,
        });
      }

      if (errorEmail) {
        logInfo('error_email_sent', {
          messageId: email.messageId,
          recipient: outgoingEmail.to,
        });
      }
    } catch (error) {
      perf.end('email_send');
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check error type for SendGrid
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
        logWarn('sendgrid_rate_limit', {
          messageId: email.messageId,
          error: errorMessage,
        });
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        logCritical('sendgrid_auth_error', {
          messageId: email.messageId,
          error: errorMessage,
        });
      } else if (errorMessage.includes('400')) {
        logError('sendgrid_bad_request', {
          messageId: email.messageId,
          error: errorMessage,
        });
      } else if (errorMessage.match(/50[0-9]/)) {
        logError('sendgrid_server_error', {
          messageId: email.messageId,
          error: errorMessage,
        });
      } else {
        logError('sendgrid_send_failed', {
          messageId: email.messageId,
          error: errorMessage,
        });
      }

      // Do NOT send error email to user (prevents email loop)
      // Still return 200 to SendGrid webhook
    }

    // Calculate total processing time
    const totalProcessingTime = perf.getTotalDuration();

    // Log processing completed with all durations
    logInfo('processing_completed', {
      messageId: email.messageId,
      totalProcessingTimeMs: totalProcessingTime,
      parsingTimeMs: perf.getDuration('webhook_parsing'),
      llmTimeMs: perf.getDuration('openai_call'),
      emailSendTimeMs: perf.getDuration('email_send'),
    });

    // Check performance thresholds
    perf.logPerformanceWarnings(
      {
        'webhook_parsing': 2000,
        'openai_call': 20000,
        'email_send': 5000,
      },
      email.messageId,
    );

    // Warn if total processing time > 25 seconds
    if (totalProcessingTime > 25000) {
      logWarn('slow_total_processing', {
        messageId: email.messageId,
        totalProcessingTimeMs: totalProcessingTime,
        threshold: 25000,
      });
    }

    // Always return 200 OK to SendGrid webhook
    return new Response(
      JSON.stringify({
        status: 'success',
        messageId: email.messageId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    // Handle validation errors (return 400)
    if (error instanceof ValidationError) {
      logWarn('validation_error', {
        messageId,
        message: error.message,
        context: error.context,
        processingTimeMs: perf.getTotalDuration(),
      });

      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.context,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Handle unexpected errors (return 200 to prevent retry loop)
    logError('unexpected_error', {
      messageId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: perf.getTotalDuration(),
    });

    // Return 200 to prevent SendGrid retry loop
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Internal error occurred',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
