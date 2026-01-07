// FILE: src/lib/inference/flood-engine.ts
// Flood peril inference engine (rules-based, deterministic)

import {
  ClaimCase,
  EvidenceItem,
  Theory,
  NextAction,
  Hypothesis,
  CoverageSignal,
  TimelineEvent,
} from "@/types";
import { createConfidenceInterval, daysBetween } from "@/lib/utils";

/**
 * Flood-specific inference engine
 * Reasons about: rainfall timing, ingress type, policy alignment, plausibility
 */
export class FloodEngine {
  private evidence: EvidenceItem[];
  private claimCase: ClaimCase;
  private timeline: TimelineEvent[];

  constructor(
    claimCase: ClaimCase,
    evidence: EvidenceItem[],
    timeline: TimelineEvent[]
  ) {
    this.claimCase = claimCase;
    this.evidence = evidence;
    this.timeline = timeline;
  }

  /**
   * Generate working theory for flood claim
   */
  generateTheory(): Theory {
    // Analyze different aspects
    const rainfallAnalysis = this.analyzeRainfall();
    const ingressAnalysis = this.analyzeIngress();
    const policyAlignment = this.analyzePolicyAlignment();
    const reportingDelay = this.analyzeReportingDelay();

    // Build hypotheses
    const hypotheses: Hypothesis[] = [
      {
        name: "Water ingress from external flooding event",
        confidence: rainfallAnalysis.confidence,
        supportingEvidenceIds: rainfallAnalysis.supportingIds,
        contradictingEvidenceIds: rainfallAnalysis.contradictingIds,
      },
      {
        name: "Damage occurred during policy period",
        confidence: policyAlignment.confidence,
        supportingEvidenceIds: policyAlignment.supportingIds,
        contradictingEvidenceIds: policyAlignment.contradictingIds,
      },
    ];

    if (ingressAnalysis.plumbingRisk > 0.3) {
      hypotheses.push({
        name: "Alternative cause: plumbing leak (not covered)",
        confidence: createConfidenceInterval(
          ingressAnalysis.plumbingRisk,
          ingressAnalysis.plumbingRisk - 0.2,
          ingressAnalysis.plumbingRisk + 0.2,
          "Evidence suggests possible internal water source"
        ),
        supportingEvidenceIds: ingressAnalysis.plumbingEvidenceIds,
        contradictingEvidenceIds: [],
      });
    }

    // Build coverage signals
    const coverageSignals: CoverageSignal[] = [
      {
        signal: "Rainfall timing aligns with damage report",
        direction: rainfallAnalysis.timingAligned ? "supports" : "weakens",
        confidence: rainfallAnalysis.confidence,
        evidenceIds: rainfallAnalysis.supportingIds,
      },
      {
        signal: "Event occurred within policy period",
        direction: policyAlignment.inPeriod ? "supports" : "weakens",
        confidence: policyAlignment.confidence,
        evidenceIds: policyAlignment.supportingIds,
      },
    ];

    if (reportingDelay.delayDays > 30) {
      coverageSignals.push({
        signal: `Significant reporting delay (${reportingDelay.delayDays} days)`,
        direction: "unclear",
        confidence: reportingDelay.confidence,
        evidenceIds: reportingDelay.evidenceIds,
      });
    }

    // Determine uncertainty drivers
    const uncertaintyDrivers: string[] = [];

    if (!rainfallAnalysis.hasWeatherData) {
      uncertaintyDrivers.push("No objective weather data available");
    }

    if (rainfallAnalysis.confidence.upperBound - rainfallAnalysis.confidence.lowerBound > 0.4) {
      uncertaintyDrivers.push("Ingress timing unclear from available evidence");
    }

    if (ingressAnalysis.plumbingRisk > 0.3) {
      uncertaintyDrivers.push("Cannot rule out internal water source");
    }

    if (reportingDelay.delayDays > 30) {
      uncertaintyDrivers.push("Late reporting reduces evidence reliability");
    }

    if (this.evidence.filter(e => e.type === "PHOTO").length === 0) {
      uncertaintyDrivers.push("No photographic evidence of damage");
    }

    // Calculate overall assessment
    const overallConfidence = this.calculateOverallConfidence(
      rainfallAnalysis,
      ingressAnalysis,
      policyAlignment,
      uncertaintyDrivers.length
    );

    return {
      peril: "FLOOD",
      overallAssessment: {
        label: this.determineLabel(overallConfidence),
        confidence: overallConfidence,
        rationale: this.buildRationale(
          rainfallAnalysis,
          ingressAnalysis,
          policyAlignment
        ),
        keyEvidenceIds: [
          ...rainfallAnalysis.supportingIds,
          ...policyAlignment.supportingIds,
        ].slice(0, 5),
      },
      hypotheses,
      coverageSignals,
      uncertaintyDrivers,
    };
  }

  /**
   * Generate prioritized next actions
   */
  generateNextActions(theory: Theory): NextAction[] {
    const actions: NextAction[] = [];

    // Check for missing weather data
    if (!this.hasEvidenceType("WEATHER")) {
      actions.push({
        priority: 1,
        action: "Obtain Met Office rainfall data for claim location and date",
        rationale: "Objective weather data is critical for validating flood timing",
        linkedUncertainty: "No objective weather data available",
        expectedImpact: {
          type: "narrow_interval",
          estimatedReduction: "high",
        },
      });
    }

    // Check for missing photos
    if (!this.hasEvidenceType("PHOTO")) {
      actions.push({
        priority: 1,
        action: "Request photographs of damaged areas and water ingress points",
        rationale: "Visual evidence needed to assess damage pattern and ingress mechanism",
        linkedUncertainty: "No photographic evidence of damage",
        expectedImpact: {
          type: "narrow_interval",
          estimatedReduction: "high",
        },
      });
    }

    // Check for engineer report
    if (!this.hasEvidenceType("REPORT")) {
      actions.push({
        priority: 2,
        action: "Commission independent engineer's report on ingress mechanism",
        rationale: "Expert assessment needed to distinguish flood vs. plumbing leak",
        linkedUncertainty: "Cannot rule out internal water source",
        expectedImpact: {
          type: "shift_estimate",
          estimatedReduction: "high",
        },
      });
    }

    // Check timeline contradictions
    const hasContradictions = this.detectTimelineContradictions();
    if (hasContradictions) {
      actions.push({
        priority: 1,
        action: "Clarify timeline contradictions with policyholder interview",
        rationale: "Conflicting dates in evidence must be resolved",
        linkedUncertainty: "Ingress timing unclear from available evidence",
        expectedImpact: {
          type: "narrow_interval",
          estimatedReduction: "medium",
        },
      });
    }

    // If high confidence, confirm no further action needed
    if (
      theory.overallAssessment.confidence.upperBound -
        theory.overallAssessment.confidence.lowerBound <
      0.3
    ) {
      actions.push({
        priority: 5,
        action: "Review case for decision readiness",
        rationale: "Confidence interval is narrow; may have sufficient evidence",
        linkedUncertainty: "None - case approaching decision threshold",
        expectedImpact: {
          type: "confirm_assumption",
          estimatedReduction: "low",
        },
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }

  // ========== Private helper methods ==========

  private analyzeRainfall() {
    const weatherEvidence = this.evidence.filter(e => e.type === "WEATHER");
    const fnolEvidence = this.evidence.filter(e => e.type === "FNOL");
    const hasWeatherData = weatherEvidence.length > 0;

    let timingAligned = false;
    let confidence = createConfidenceInterval(
      0.5,
      0.2,
      0.8,
      "No weather data; relying on policyholder account only"
    );

    const supportingIds: string[] = [];
    const contradictingIds: string[] = [];

    if (hasWeatherData && fnolEvidence.length > 0) {
      // Check if reported damage date aligns with rainfall
      const weatherEvent = weatherEvidence[0];
      const fnol = fnolEvidence[0];

      if (weatherEvent.eventDate && fnol.eventDate) {
        const daysDiff = daysBetween(weatherEvent.eventDate, fnol.eventDate);
        if (daysDiff !== null && daysDiff <= 3) {
          timingAligned = true;
          confidence = createConfidenceInterval(
            0.75,
            0.65,
            0.85,
            "Objective weather data confirms rainfall within 3 days of reported damage"
          );
          supportingIds.push(weatherEvent.id, fnol.id);
        } else {
          timingAligned = false;
          confidence = createConfidenceInterval(
            0.3,
            0.15,
            0.5,
            `Weather data shows ${daysDiff} days gap - timing mismatch raises questions`
          );
          contradictingIds.push(weatherEvent.id, fnol.id);
        }
      }
    }

    return {
      hasWeatherData,
      timingAligned,
      confidence,
      supportingIds,
      contradictingIds,
    };
  }

  private analyzeIngress() {
    const notes = this.evidence.filter(e => e.type === "NOTE");
    const reports = this.evidence.filter(e => e.type === "REPORT");

    let plumbingRisk = 0.2; // Base risk
    const plumbingEvidenceIds: string[] = [];

    // Look for keywords suggesting internal source
    const allText = [...notes, ...reports]
      .map(e => e.contentText.toLowerCase())
      .join(" ");

    if (allText.includes("pipe") || allText.includes("plumbing")) {
      plumbingRisk += 0.3;
      plumbingEvidenceIds.push(
        ...notes.map(n => n.id),
        ...reports.map(r => r.id)
      );
    }

    if (allText.includes("localised") || allText.includes("single room")) {
      plumbingRisk += 0.2;
    }

    return {
      plumbingRisk: Math.min(plumbingRisk, 0.8),
      plumbingEvidenceIds,
    };
  }

  private analyzePolicyAlignment() {
    const fnol = this.evidence.find(e => e.type === "FNOL");
    let inPeriod = true;
    let confidence = createConfidenceInterval(
      0.5,
      0.3,
      0.7,
      "Policy dates not fully verified"
    );

    const supportingIds: string[] = [];
    const contradictingIds: string[] = [];

    if (fnol && fnol.eventDate) {
      const eventDate = new Date(fnol.eventDate);
      const policyStart = new Date(this.claimCase.policy.startDate);
      const policyEnd = new Date(this.claimCase.policy.endDate);

      if (eventDate >= policyStart && eventDate <= policyEnd) {
        inPeriod = true;
        confidence = createConfidenceInterval(
          0.9,
          0.85,
          0.95,
          "Event date falls within policy period"
        );
        supportingIds.push(fnol.id);
      } else {
        inPeriod = false;
        confidence = createConfidenceInterval(
          0.1,
          0.05,
          0.2,
          "Event date outside policy period"
        );
        contradictingIds.push(fnol.id);
      }
    }

    return {
      inPeriod,
      confidence,
      supportingIds,
      contradictingIds,
    };
  }

  private analyzeReportingDelay() {
    const fnol = this.evidence.find(e => e.type === "FNOL");
    let delayDays = 0;
    let confidence = createConfidenceInterval(
      0.8,
      0.7,
      0.9,
      "Reported promptly"
    );

    if (fnol && fnol.eventDate) {
      const days = daysBetween(fnol.eventDate, fnol.receivedDate);
      if (days !== null) {
        delayDays = days;
        if (delayDays > 30) {
          confidence = createConfidenceInterval(
            0.5,
            0.3,
            0.7,
            `${delayDays} day delay reduces evidence reliability`
          );
        }
      }
    }

    return {
      delayDays,
      confidence,
      evidenceIds: fnol ? [fnol.id] : [],
    };
  }

  private calculateOverallConfidence(
    rainfallAnalysis: any,
    ingressAnalysis: any,
    policyAlignment: any,
    uncertaintyCount: number
  ) {
    // Start with baseline
    let pe = 0.5;
    let lb = 0.3;
    let ub = 0.7;

    // Adjust based on rainfall
    if (rainfallAnalysis.timingAligned) {
      pe += 0.2;
      lb += 0.15;
      ub += 0.15;
    } else if (rainfallAnalysis.hasWeatherData) {
      pe -= 0.2;
      lb -= 0.15;
      ub -= 0.15;
    }

    // Adjust for policy alignment
    if (!policyAlignment.inPeriod) {
      pe -= 0.3;
      lb -= 0.25;
      ub -= 0.25;
    }

    // Widen interval based on uncertainty count
    const widthIncrease = uncertaintyCount * 0.05;
    lb = Math.max(0, lb - widthIncrease);
    ub = Math.min(1, ub + widthIncrease);

    // Clamp values
    pe = Math.max(0, Math.min(1, pe));
    lb = Math.max(0, Math.min(pe, lb));
    ub = Math.max(pe, Math.min(1, ub));

    let explanation = "Based on available evidence. ";
    if (uncertaintyCount > 3) {
      explanation += "Wide interval due to multiple uncertainty drivers.";
    } else if (uncertaintyCount > 1) {
      explanation += "Moderate uncertainty from missing key evidence.";
    } else {
      explanation += "Relatively narrow based on strong evidence alignment.";
    }

    return createConfidenceInterval(pe, lb, ub, explanation);
  }

  private determineLabel(confidence: any): "likely" | "borderline" | "unlikely" | "unclear" {
    const { pointEstimate, lowerBound, upperBound } = confidence;

    // If interval is very wide, it's unclear
    if (upperBound - lowerBound > 0.6) {
      return "unclear";
    }

    // Check point estimate
    if (pointEstimate >= 0.65) return "likely";
    if (pointEstimate <= 0.35) return "unlikely";
    return "borderline";
  }

  private buildRationale(
    rainfallAnalysis: any,
    ingressAnalysis: any,
    policyAlignment: any
  ): string {
    const parts: string[] = [];

    if (rainfallAnalysis.timingAligned) {
      parts.push("Weather data confirms rainfall timing aligns with damage report.");
    } else if (rainfallAnalysis.hasWeatherData) {
      parts.push("Weather data shows timing mismatch with reported damage.");
    } else {
      parts.push("No objective weather data available; assessment based on policyholder account.");
    }

    if (!policyAlignment.inPeriod) {
      parts.push("Event date falls outside policy period.");
    }

    if (ingressAnalysis.plumbingRisk > 0.4) {
      parts.push("Evidence suggests possible internal water source (not covered).");
    }

    return parts.join(" ");
  }

  private hasEvidenceType(type: string): boolean {
    return this.evidence.some(e => e.type === type);
  }

  private detectTimelineContradictions(): boolean {
    // Simple check: if we have multiple events with same type but different dates
    const eventDates = this.timeline
      .filter(e => !e.isApproximate)
      .map(e => e.eventDate);

    const uniqueDates = new Set(eventDates);
    return eventDates.length > uniqueDates.size;
  }
}
