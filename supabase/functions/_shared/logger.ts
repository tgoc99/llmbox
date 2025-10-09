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

