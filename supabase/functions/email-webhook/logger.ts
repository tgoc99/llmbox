/**
 * Structured logging module
 * All logs are formatted as JSON with timestamp, level, event, and context
 */

import { config } from './config.ts';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Log level priority for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.CRITICAL]: 4,
};

/**
 * Get the configured minimum log level
 */
const getMinLogLevel = (): LogLevel => {
  const levelStr = config.logLevel.toUpperCase();
  return (LogLevel[levelStr as keyof typeof LogLevel]) || LogLevel.INFO;
};

/**
 * Check if a log level should be logged based on configuration
 */
const shouldLog = (level: LogLevel): boolean => {
  const minLevel = getMinLogLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
};

/**
 * Truncate string to maximum length
 */
const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength) + '...';
};

/**
 * Core logging function
 */
export const log = (level: LogLevel, event: string, context: Record<string, unknown>): void => {
  if (!shouldLog(level)) {
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    context,
  };

  console.log(JSON.stringify(logEntry));
};

/**
 * Log at INFO level
 */
export const logInfo = (event: string, context: Record<string, unknown> = {}): void => {
  log(LogLevel.INFO, event, context);
};

/**
 * Log at WARN level
 */
export const logWarn = (event: string, context: Record<string, unknown> = {}): void => {
  log(LogLevel.WARN, event, context);
};

/**
 * Log at ERROR level
 */
export const logError = (event: string, context: Record<string, unknown> = {}): void => {
  log(LogLevel.ERROR, event, context);
};

/**
 * Log at CRITICAL level
 */
export const logCritical = (event: string, context: Record<string, unknown> = {}): void => {
  log(LogLevel.CRITICAL, event, context);
};

/**
 * Log at DEBUG level
 */
export const logDebug = (event: string, context: Record<string, unknown> = {}): void => {
  log(LogLevel.DEBUG, event, context);
};

/**
 * Truncate body preview to first 100 characters
 */
export const truncateBody = (body: string): string => {
  return truncate(body, 100);
};

/**
 * Convenience logging functions for specific events
 */

import type { IncomingEmail, LLMResponse, OutgoingEmail } from './types.ts';

/**
 * Log webhook received event
 */
export const logWebhookReceived = (email: IncomingEmail): void => {
  logInfo('webhook_received', {
    messageId: email.messageId,
    from: email.from,
    to: email.to,
    subject: email.subject,
    bodyPreview: truncateBody(email.body),
    hasInReplyTo: email.inReplyTo !== null,
    referencesCount: email.references.length,
  });
};

/**
 * Log OpenAI API call started
 */
export const logOpenAICallStarted = (email: IncomingEmail): void => {
  logInfo('openai_call_started', {
    messageId: email.messageId,
    from: email.from,
    bodyLength: email.body.length,
  });
};

/**
 * Log OpenAI response received
 */
export const logOpenAIResponseReceived = (response: LLMResponse, messageId: string): void => {
  logInfo('openai_response_received', {
    messageId,
    model: response.model,
    tokenCount: response.tokenCount,
    completionTimeMs: response.completionTime,
    responseLength: response.content.length,
  });
};

/**
 * Log SendGrid send started
 */
export const logSendGridSendStarted = (email: OutgoingEmail): void => {
  logInfo('sendgrid_send_started', {
    messageId: email.inReplyTo,
    to: email.to,
    subject: email.subject,
  });
};

/**
 * Log SendGrid send completed
 */
export const logSendGridSendCompleted = (email: OutgoingEmail, durationMs: number): void => {
  logInfo('sendgrid_send_completed', {
    messageId: email.inReplyTo,
    to: email.to,
    subject: email.subject,
    sendTimeMs: durationMs,
  });
};

/**
 * Log processing completed
 */
export const logProcessingCompleted = (
  messageId: string,
  totalDurationMs: number,
  parsingTimeMs: number,
  llmTimeMs: number,
  emailSendTimeMs: number,
): void => {
  logInfo('processing_completed', {
    messageId,
    totalProcessingTimeMs: totalDurationMs,
    parsingTimeMs,
    llmTimeMs,
    emailSendTimeMs,
  });

  // Log warning if total processing exceeds threshold
  if (totalDurationMs > 25000) {
    logWarn('slow_processing', {
      messageId,
      totalProcessingTimeMs: totalDurationMs,
      threshold: 25000,
    });
  }
};
