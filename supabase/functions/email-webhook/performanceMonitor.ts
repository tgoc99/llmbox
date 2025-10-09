import { logWarn } from './logger.ts';

/**
 * Checks if a single operation exceeded its threshold
 */
export const checkOperationThreshold = (
  operationName: string,
  durationMs: number,
  thresholdMs: number,
  messageId: string,
): void => {
  if (durationMs > thresholdMs) {
    logWarn(`slow_${operationName}`, {
      messageId,
      processingTimeMs: durationMs,
      threshold: thresholdMs,
    });
  }
};

/**
 * Checks if total processing time exceeded threshold
 */
export const checkTotalProcessingThreshold = (
  totalProcessingTimeMs: number,
  thresholdMs: number,
  messageId: string,
): void => {
  if (totalProcessingTimeMs > thresholdMs) {
    logWarn('slow_total_processing', {
      messageId,
      totalProcessingTimeMs,
      threshold: thresholdMs,
    });
  }
};
