/**
 * Performance tracking utilities for monitoring execution times
 */

import { logWarn } from './logger.ts';

/**
 * Performance tracker for measuring operation durations
 */
export class PerformanceTracker {
  private startTimes: Map<string, number>;
  private durations: Map<string, number>;
  private globalStartTime: number;

  constructor() {
    this.startTimes = new Map();
    this.durations = new Map();
    this.globalStartTime = Date.now();
  }

  /**
   * Mark the start of an operation
   * @param label - Label for the operation
   */
  start(label: string): void {
    this.startTimes.set(label, Date.now());
  }

  /**
   * Mark the end of an operation and calculate duration
   * @param label - Label for the operation
   * @returns Duration in milliseconds, or 0 if operation not started
   */
  end(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      return 0;
    }

    const duration = Date.now() - startTime;
    this.durations.set(label, duration);
    this.startTimes.delete(label);

    return duration;
  }

  /**
   * Get the duration for a specific operation
   * @param label - Label for the operation
   * @returns Duration in milliseconds, or 0 if not found
   */
  getDuration(label: string): number {
    return this.durations.get(label) || 0;
  }

  /**
   * Get total execution time since tracker creation
   * @returns Total duration in milliseconds
   */
  getTotalDuration(): number {
    return Date.now() - this.globalStartTime;
  }

  /**
   * Log performance warnings for operations exceeding thresholds
   * @param thresholds - Map of operation labels to threshold milliseconds
   * @param messageId - Correlation ID for logging
   */
  logPerformanceWarnings(
    thresholds: Record<string, number>,
    messageId: string,
  ): void {
    for (const [label, threshold] of Object.entries(thresholds)) {
      const duration = this.getDuration(label);
      if (duration > 0 && duration > threshold) {
        logWarn(`slow_${label}`, {
          messageId,
          durationMs: duration,
          threshold,
          operation: label,
        });
      }
    }
  }

  /**
   * Get all recorded durations
   * @returns Map of operation labels to durations
   */
  getAllDurations(): Record<string, number> {
    return Object.fromEntries(this.durations);
  }
}

