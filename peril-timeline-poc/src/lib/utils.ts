// FILE: src/lib/utils.ts
// Utility functions for the Peril Timeline POC

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ConfidenceInterval } from "@/types"

/**
 * Tailwind class name merger
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Create a confidence interval with validation
 */
export function createConfidenceInterval(
  pointEstimate: number,
  lowerBound: number,
  upperBound: number,
  explanation: string
): ConfidenceInterval {
  // Clamp values to [0, 1]
  const pe = Math.max(0, Math.min(1, pointEstimate));
  const lb = Math.max(0, Math.min(1, lowerBound));
  const ub = Math.max(0, Math.min(1, upperBound));

  // Ensure ordering: lb <= pe <= ub
  const validLb = Math.min(lb, pe);
  const validUb = Math.max(ub, pe);

  return {
    pointEstimate: pe,
    lowerBound: validLb,
    upperBound: validUb,
    explanation,
  };
}

/**
 * Calculate interval width (uncertainty measure)
 */
export function intervalWidth(ci: ConfidenceInterval): number {
  return ci.upperBound - ci.lowerBound;
}

/**
 * Compare two confidence intervals and describe the change
 */
export function compareIntervals(
  before: ConfidenceInterval,
  after: ConfidenceInterval
): {
  widthChanged: "narrowed" | "widened" | "unchanged";
  estimateShifted: "increased" | "decreased" | "unchanged";
  widthDelta: number;
  estimateDelta: number;
} {
  const beforeWidth = intervalWidth(before);
  const afterWidth = intervalWidth(after);
  const widthDelta = afterWidth - beforeWidth;
  const estimateDelta = after.pointEstimate - before.pointEstimate;

  let widthChanged: "narrowed" | "widened" | "unchanged" = "unchanged";
  if (Math.abs(widthDelta) > 0.05) {
    widthChanged = widthDelta < 0 ? "narrowed" : "widened";
  }

  let estimateShifted: "increased" | "decreased" | "unchanged" = "unchanged";
  if (Math.abs(estimateDelta) > 0.05) {
    estimateShifted = estimateDelta > 0 ? "increased" : "decreased";
  }

  return {
    widthChanged,
    estimateShifted,
    widthDelta,
    estimateDelta,
  };
}

/**
 * Format a confidence interval for display
 */
export function formatInterval(ci: ConfidenceInterval): string {
  const pe = (ci.pointEstimate * 100).toFixed(0);
  const lb = (ci.lowerBound * 100).toFixed(0);
  const ub = (ci.upperBound * 100).toFixed(0);
  return `${pe}% (${lb}–${ub}%)`;
}

/**
 * Get color class based on interval width (uncertainty)
 */
export function getUncertaintyColor(ci: ConfidenceInterval): string {
  const width = intervalWidth(ci);
  if (width < 0.2) return "text-green-600";
  if (width < 0.4) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Combine multiple confidence intervals (simple average approach)
 * In a real system, this would use proper uncertainty propagation
 */
export function combineIntervals(
  intervals: ConfidenceInterval[],
  weights?: number[]
): ConfidenceInterval {
  if (intervals.length === 0) {
    return createConfidenceInterval(0.5, 0, 1, "No evidence available");
  }

  const w = weights || intervals.map(() => 1 / intervals.length);
  const totalWeight = w.reduce((sum, weight) => sum + weight, 0);

  const pe = intervals.reduce(
    (sum, ci, i) => sum + ci.pointEstimate * w[i],
    0
  ) / totalWeight;

  const lb = intervals.reduce(
    (sum, ci, i) => sum + ci.lowerBound * w[i],
    0
  ) / totalWeight;

  const ub = intervals.reduce(
    (sum, ci, i) => sum + ci.upperBound * w[i],
    0
  ) / totalWeight;

  return createConfidenceInterval(
    pe,
    lb,
    ub,
    "Combined from multiple sources"
  );
}

/**
 * Parse date string with fallback
 */
export function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "Unknown date";
  const date = parseDate(dateStr);
  if (!date) return "Invalid date";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1Str: string, date2Str: string): number | null {
  const d1 = parseDate(date1Str);
  const d2 = parseDate(date2Str);
  if (!d1 || !d2) return null;
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Generate a simple ID
 */
export function generateId(prefix: string = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
