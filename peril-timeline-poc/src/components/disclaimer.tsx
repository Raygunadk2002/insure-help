// FILE: src/components/disclaimer.tsx
import { AlertTriangle } from "lucide-react";

/**
 * Disclaimer component - shown prominently throughout the app
 * Critical: Makes clear this is decision support, not approval/denial
 */
export function Disclaimer() {
  return (
    <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-md">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm space-y-2">
          <p className="font-semibold text-yellow-900">
            Decision Support Tool Only
          </p>
          <p className="text-yellow-800">
            This tool provides working theories and confidence intervals to
            support claims analysis. It does NOT approve or deny claims.
            Confidence intervals represent epistemic uncertainty based on
            available evidence, not statistical probability of settlement.
          </p>
          <p className="text-yellow-800 font-medium">
            ✓ All conclusions require human review and sign-off
            <br />✓ Evidence quality and completeness must be verified
            <br />✓ Final decisions rest with authorized handlers/adjusters
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact disclaimer for page headers
 */
export function DisclaimerBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">
      <AlertTriangle className="w-3 h-3" />
      <span className="font-medium">Decision Support Only</span>
    </div>
  );
}
