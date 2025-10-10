import 'jsr:@supabase/functions-js@2/edge-runtime.d.ts';

import { parseIncomingEmail, ValidationError } from './emailParser.ts';
import {
  formatReplyEmail as formatOutgoingEmail,
  sendReplyEmail as sendEmail,
} from '../_shared/emailSender.ts';
import { getGenericErrorEmail } from './errorTemplates.ts';
import { logError, logInfo, logWarn } from './logger.ts';
import { generateEmailResponse as generateResponse } from '../_shared/llmClient.ts';
import { PerformanceTracker } from './performance.ts';
import { handleOpenAIError, handleSendGridError } from './errors.ts';
import {
  createGenericErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
  validateRequestMethod,
} from './requestHandler.ts';
import { checkOperationThreshold, checkTotalProcessingThreshold } from './performanceMonitor.ts';
import { saveLLMResponseEmail, saveUserQuery, trackLLMUsage } from './database.ts';

Deno.serve(async (req: Request) => {
  const perf = new PerformanceTracker();
  let messageId = 'unknown';
  let formData: FormData | null = null;
  let userQueryEmailId: string | undefined;

  try {
    // Check request method
    const methodValidationResponse = validateRequestMethod(req);
    if (methodValidationResponse) {
      return methodValidationResponse;
    }

    // Parse request body as FormData
    formData = await req.formData();

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
    checkOperationThreshold('webhook_parsing', parsingTime, 2000, email.messageId);

    // Save user query to database (non-blocking, log errors but don't fail)
    try {
      userQueryEmailId = await saveUserQuery(email);
    } catch (_error) {
      // Already logged in saveUserQuery, continue processing
    }

    // Generate LLM response with error handling
    perf.start('openai_call');
    let llmResponse;
    let errorEmail: ReturnType<typeof getGenericErrorEmail> | null = null;

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
      checkOperationThreshold('openai_call', llmTime, 20000, email.messageId);

      // Track AI usage (non-blocking)
      try {
        await trackLLMUsage(email.from, llmResponse, userQueryEmailId);
      } catch (_error) {
        // Already logged in trackLLMUsage, continue processing
      }
    } catch (error) {
      const llmTime = perf.end('openai_call');
      errorEmail = handleOpenAIError(error, email, llmTime, formData);
    }

    // Format outgoing email (either LLM response or error)
    perf.start('email_send');
    const outgoingEmail = errorEmail ||
      (llmResponse ? formatOutgoingEmail(email, llmResponse) : getGenericErrorEmail(email));

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
      checkOperationThreshold('email_send', emailSendTime, 5000, email.messageId);

      // Save outgoing email to database (only if successful LLM response, not error emails)
      if (!errorEmail && llmResponse && userQueryEmailId) {
        try {
          await saveLLMResponseEmail(outgoingEmail, userQueryEmailId);
        } catch (_error) {
          // Already logged in saveLLMResponseEmail, continue processing
        }
      }

      if (errorEmail) {
        logInfo('error_email_sent', {
          messageId: email.messageId,
          recipient: outgoingEmail.to,
        });
      }
    } catch (error) {
      perf.end('email_send');
      handleSendGridError(error, email.messageId, formData);
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
    checkTotalProcessingThreshold(totalProcessingTime, 25000, email.messageId);

    // Always return 200 OK to SendGrid webhook
    return createSuccessResponse(email.messageId);
  } catch (error) {
    // Serialize formData to log with error
    const formDataPayload: Record<string, unknown> = {};
    if (formData) {
      for (const [key, value] of formData.entries()) {
        formDataPayload[key] = value instanceof File ? `[File: ${value.name}]` : value;
      }
    }

    // Handle validation errors (return 400)
    if (error instanceof ValidationError) {
      logWarn('validation_error', {
        messageId,
        message: error.message,
        context: error.context,
        processingTimeMs: perf.getTotalDuration(),
        fullPayload: formDataPayload,
      });

      return createValidationErrorResponse(error.message, error.context);
    }

    // Handle unexpected errors (return 200 to prevent retry loop)
    logError('unexpected_error', {
      messageId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: perf.getTotalDuration(),
      fullPayload: formDataPayload,
    });

    // Return 200 to prevent SendGrid retry loop
    return createGenericErrorResponse();
  }
});
