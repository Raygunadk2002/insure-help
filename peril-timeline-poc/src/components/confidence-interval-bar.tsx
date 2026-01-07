// FILE: src/components/confidence-interval-bar.tsx
"use client";

import { ConfidenceInterval } from "@/types";
import { formatInterval, intervalWidth } from "@/lib/utils";
import { Info } from "lucide-react";

interface ConfidenceIntervalBarProps {
  interval: ConfidenceInterval;
  label?: string;
  showExplanation?: boolean;
}

/**
 * Visual representation of a confidence interval
 * Shows lower bound, point estimate, and upper bound
 */
export function ConfidenceIntervalBar({
  interval,
  label,
  showExplanation = true,
}: ConfidenceIntervalBarProps) {
  const { pointEstimate, lowerBound, upperBound, explanation } = interval;

  // Convert to percentages
  const lbPct = lowerBound * 100;
  const pePct = pointEstimate * 100;
  const ubPct = upperBound * 100;
  const width = intervalWidth(interval);

  // Color based on uncertainty (width)
  const getColor = () => {
    if (width < 0.2) return "bg-green-500";
    if (width < 0.4) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const barColor = getColor();

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}

      {/* Visual bar */}
      <div className="relative h-8 bg-gray-200 rounded-md overflow-hidden">
        {/* Confidence interval range */}
        <div
          className={`absolute h-full ${barColor} opacity-30`}
          style={{
            left: `${lbPct}%`,
            width: `${ubPct - lbPct}%`,
          }}
        />

        {/* Point estimate marker */}
        <div
          className={`absolute h-full w-1 ${barColor}`}
          style={{
            left: `${pePct}%`,
          }}
        />

        {/* Bounds markers */}
        <div
          className="absolute h-full w-0.5 bg-gray-600"
          style={{ left: `${lbPct}%` }}
        />
        <div
          className="absolute h-full w-0.5 bg-gray-600"
          style={{ left: `${ubPct}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{lbPct.toFixed(0)}%</span>
        <span className="font-semibold">{pePct.toFixed(0)}%</span>
        <span>{ubPct.toFixed(0)}%</span>
      </div>

      {/* Explanation */}
      {showExplanation && explanation && (
        <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact badge showing just the interval
 */
export function ConfidenceIntervalBadge({
  interval,
}: {
  interval: ConfidenceInterval;
}) {
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
      {formatInterval(interval)}
    </span>
  );
}
