// FILE: src/types/index.ts
// Core type definitions for Peril Timeline POC
// All analysis outputs include confidence intervals to represent epistemic uncertainty

export type Peril = "FLOOD" | "SUBSIDENCE";

export type CaseStatus = "OPEN" | "AWAITING_INFO" | "IN_REVIEW" | "CLOSED";

export type EvidenceType =
  | "FNOL"           // First Notice of Loss
  | "PHOTO"          // Photographs
  | "REPORT"         // Engineer/contractor reports
  | "SENSOR"         // Sensor data, monitoring readings
  | "WEATHER"        // Weather data, rainfall
  | "NOTE"           // Manual notes, interviews
  | "CSV"            // Structured data files
  | "OTHER";

export type EvidenceSource =
  | "policyholder"
  | "contractor"
  | "engineer"
  | "insurer"
  | "sensor"
  | "third_party";

export type EvidenceConfidence = "low" | "medium" | "high";

/**
 * Confidence Interval represents epistemic uncertainty
 * NOT statistical probability, but uncertainty based on available evidence
 */
export interface ConfidenceInterval {
  pointEstimate: number;      // 0..1 (0 = no support, 1 = full support)
  lowerBound: number;         // 0..1 (conservative estimate)
  upperBound: number;         // 0..1 (optimistic estimate)
  explanation: string;        // Why is the interval wide/narrow?
}

export interface ClaimCase {
  id: string;
  peril: Peril;
  createdAt: string;
  updatedAt: string;
  policy: {
    startDate: string;
    endDate: string;
    wordingNotes?: string;
  };
  location: {
    postcode: string;
    address?: string;
  };
  status: CaseStatus;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  type: EvidenceType;
  source: EvidenceSource;
  title: string;
  contentText: string;
  fileName?: string;
  eventDate?: string;          // When the event described occurred
  receivedDate: string;        // When evidence was received
  confidence: EvidenceConfidence;
  tags: string[];
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  eventDate: string;
  label: string;
  eventType: string;
  evidenceIds: string[];
  confidenceScore: number;     // 0..1
  isApproximate?: boolean;
}

/**
 * A hypothesis about the claim (e.g., "Water entered through roof damage")
 */
export interface Hypothesis {
  name: string;
  confidence: ConfidenceInterval;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
}

/**
 * A signal that affects coverage determination
 */
export interface CoverageSignal {
  signal: string;
  direction: "supports" | "weakens" | "unclear";
  confidence: ConfidenceInterval;
  evidenceIds: string[];
}

/**
 * Overall assessment label
 */
export type AssessmentLabel =
  | "likely"         // Claim appears likely valid
  | "borderline"     // Unclear, needs more info
  | "unlikely"       // Claim appears unlikely valid
  | "unclear";       // Insufficient evidence to assess

/**
 * The working theory of causation/prognosis
 * CRITICAL: All conclusions include confidence intervals
 */
export interface Theory {
  peril: Peril;
  overallAssessment: {
    label: AssessmentLabel;
    confidence: ConfidenceInterval;
    rationale: string;
    keyEvidenceIds: string[];
  };
  hypotheses: Hypothesis[];
  coverageSignals: CoverageSignal[];
  uncertaintyDrivers: string[];    // What makes us uncertain?
}

/**
 * Expected impact of gathering additional evidence
 */
export interface ExpectedImpact {
  type: "narrow_interval" | "shift_estimate" | "confirm_assumption";
  estimatedReduction: "low" | "medium" | "high";
}

/**
 * A recommended next action to reduce uncertainty
 */
export interface NextAction {
  priority: 1 | 2 | 3 | 4 | 5;   // 1 = highest priority
  action: string;
  rationale: string;
  linkedUncertainty: string;     // Which uncertainty driver does this address?
  expectedImpact: ExpectedImpact;
  evidenceIds?: string[];
}

/**
 * Snapshot of theory state for change tracking
 */
export interface TheorySnapshot {
  timestamp: string;
  theory: Theory;
  evidenceCount: number;
}

/**
 * Change record showing what shifted
 */
export interface ChangeRecord {
  timestamp: string;
  description: string;
  type: "ci_narrowed" | "ci_widened" | "estimate_shifted" | "uncertainty_resolved" | "uncertainty_added";
  details: {
    before?: ConfidenceInterval;
    after?: ConfidenceInterval;
    newEvidenceId?: string;
  };
}

/**
 * Full case analysis result
 */
export interface CaseAnalysis {
  caseId: string;
  generatedAt: string;
  theory: Theory;
  nextActions: NextAction[];
  timeline: TimelineEvent[];
  changeLog: ChangeRecord[];
}

/**
 * Contradiction detected in evidence
 */
export interface Contradiction {
  id: string;
  description: string;
  evidenceIds: string[];
  impactOnUncertainty: string;
}
