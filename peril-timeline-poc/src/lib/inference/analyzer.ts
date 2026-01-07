// FILE: src/lib/inference/analyzer.ts
// Main inference orchestrator - brings together timeline, engines, and change tracking

import {
  ClaimCase,
  EvidenceItem,
  CaseAnalysis,
  TheorySnapshot,
  ChangeRecord,
} from "@/types";
import { FloodEngine } from "./flood-engine";
import { SubsidenceEngine } from "./subsidence-engine";
import { buildTimeline } from "@/lib/timeline/timeline-builder";
import { compareIntervals, intervalWidth } from "@/lib/utils";

/**
 * Main analyzer class - coordinates all inference logic
 */
export class CaseAnalyzer {
  private claimCase: ClaimCase;
  private evidence: EvidenceItem[];
  private previousSnapshot: TheorySnapshot | null = null;

  constructor(claimCase: ClaimCase, evidence: EvidenceItem[]) {
    this.claimCase = claimCase;
    this.evidence = evidence;
  }

  /**
   * Set previous snapshot for change tracking
   */
  setPreviousSnapshot(snapshot: TheorySnapshot | null) {
    this.previousSnapshot = snapshot;
  }

  /**
   * Run complete analysis
   */
  analyze(): CaseAnalysis {
    // Build timeline
    const { timeline, contradictions } = buildTimeline(this.claimCase.id, this.evidence);

    // Select appropriate engine
    const engine =
      this.claimCase.peril === "FLOOD"
        ? new FloodEngine(this.claimCase, this.evidence, timeline)
        : new SubsidenceEngine(this.claimCase, this.evidence, timeline);

    // Generate theory
    const theory = engine.generateTheory();

    // Generate next actions
    const nextActions = engine.generateNextActions(theory);

    // Generate change log
    const changeLog = this.generateChangeLog(theory);

    return {
      caseId: this.claimCase.id,
      generatedAt: new Date().toISOString(),
      theory,
      nextActions,
      timeline,
      changeLog,
    };
  }

  /**
   * Generate change log by comparing with previous snapshot
   */
  private generateChangeLog(currentTheory: any): ChangeRecord[] {
    const changes: ChangeRecord[] = [];

    if (!this.previousSnapshot) {
      // First analysis - no changes to report
      return [];
    }

    const prevTheory = this.previousSnapshot.theory;
    const timestamp = new Date().toISOString();

    // Compare overall confidence intervals
    const overallComparison = compareIntervals(
      prevTheory.overallAssessment.confidence,
      currentTheory.overallAssessment.confidence
    );

    if (overallComparison.widthChanged === "narrowed") {
      changes.push({
        timestamp,
        description: `Overall confidence interval narrowed by ${Math.abs(overallComparison.widthDelta * 100).toFixed(0)}%`,
        type: "ci_narrowed",
        details: {
          before: prevTheory.overallAssessment.confidence,
          after: currentTheory.overallAssessment.confidence,
        },
      });
    } else if (overallComparison.widthChanged === "widened") {
      changes.push({
        timestamp,
        description: `Overall confidence interval widened by ${(overallComparison.widthDelta * 100).toFixed(0)}%`,
        type: "ci_widened",
        details: {
          before: prevTheory.overallAssessment.confidence,
          after: currentTheory.overallAssessment.confidence,
        },
      });
    }

    if (overallComparison.estimateShifted !== "unchanged") {
      changes.push({
        timestamp,
        description: `Point estimate ${overallComparison.estimateShifted} by ${Math.abs(overallComparison.estimateDelta * 100).toFixed(0)}%`,
        type: "estimate_shifted",
        details: {
          before: prevTheory.overallAssessment.confidence,
          after: currentTheory.overallAssessment.confidence,
        },
      });
    }

    // Compare uncertainty drivers
    const prevDrivers = new Set(prevTheory.uncertaintyDrivers);
    const currentDrivers = new Set(currentTheory.uncertaintyDrivers);

    // Resolved uncertainties
    for (const driver of prevDrivers) {
      if (!currentDrivers.has(driver)) {
        changes.push({
          timestamp,
          description: `Uncertainty resolved: "${driver}"`,
          type: "uncertainty_resolved",
          details: {},
        });
      }
    }

    // New uncertainties
    for (const driver of currentDrivers) {
      if (!prevDrivers.has(driver)) {
        changes.push({
          timestamp,
          description: `New uncertainty identified: "${driver}"`,
          type: "uncertainty_added",
          details: {},
        });
      }
    }

    // Compare hypothesis confidence intervals
    for (const currentHyp of currentTheory.hypotheses) {
      const prevHyp = prevTheory.hypotheses.find((h: any) => h.name === currentHyp.name);
      if (prevHyp) {
        const hypComparison = compareIntervals(
          prevHyp.confidence,
          currentHyp.confidence
        );

        if (hypComparison.widthChanged === "narrowed") {
          changes.push({
            timestamp,
            description: `Hypothesis "${currentHyp.name}" confidence interval narrowed`,
            type: "ci_narrowed",
            details: {
              before: prevHyp.confidence,
              after: currentHyp.confidence,
            },
          });
        }
      }
    }

    return changes;
  }
}

/**
 * Create a snapshot of current theory state
 */
export function createTheorySnapshot(analysis: CaseAnalysis): TheorySnapshot {
  return {
    timestamp: analysis.generatedAt,
    theory: analysis.theory,
    evidenceCount: 0, // Will be set by caller
  };
}
