// FILE: src/lib/inference/subsidence-engine.ts
// Subsidence peril inference engine (rules-based, deterministic)

import {
  ClaimCase,
  EvidenceItem,
  Theory,
  NextAction,
  Hypothesis,
  CoverageSignal,
  TimelineEvent,
} from "@/types";
import { createConfidenceInterval } from "@/lib/utils";

/**
 * Subsidence-specific inference engine
 * Reasons about: seasonal vs progressive movement, tree influence, monitoring duration
 */
export class SubsidenceEngine {
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
   * Generate working theory for subsidence claim
   */
  generateTheory(): Theory {
    // Analyze different aspects
    const movementAnalysis = this.analyzeMovement();
    const treeAnalysis = this.analyzeTreeInfluence();
    const monitoringAnalysis = this.analyzeMonitoringPeriod();
    const priorHistory = this.analyzePriorHistory();

    // Build hypotheses
    const hypotheses: Hypothesis[] = [
      {
        name: "Progressive subsidence (covered)",
        confidence: movementAnalysis.progressiveConfidence,
        supportingEvidenceIds: movementAnalysis.progressiveIds,
        contradictingEvidenceIds: movementAnalysis.seasonalIds,
      },
      {
        name: "Seasonal movement only (not covered)",
        confidence: movementAnalysis.seasonalConfidence,
        supportingEvidenceIds: movementAnalysis.seasonalIds,
        contradictingEvidenceIds: movementAnalysis.progressiveIds,
      },
    ];

    if (treeAnalysis.treePresent) {
      hypotheses.push({
        name: "Tree-related soil shrinkage contributing factor",
        confidence: treeAnalysis.confidence,
        supportingEvidenceIds: treeAnalysis.evidenceIds,
        contradictingEvidenceIds: [],
      });
    }

    // Build coverage signals
    const coverageSignals: CoverageSignal[] = [
      {
        signal: "Movement shows progressive trend beyond seasonal variation",
        direction: movementAnalysis.isProgressive ? "supports" : "weakens",
        confidence: movementAnalysis.progressiveConfidence,
        evidenceIds: movementAnalysis.progressiveIds,
      },
      {
        signal: `Monitoring period: ${monitoringAnalysis.months} months`,
        direction: monitoringAnalysis.isSufficient ? "supports" : "unclear",
        confidence: monitoringAnalysis.confidence,
        evidenceIds: monitoringAnalysis.evidenceIds,
      },
    ];

    if (priorHistory.hasPriorClaim) {
      coverageSignals.push({
        signal: "Prior claim history indicates ongoing issue",
        direction: "supports",
        confidence: priorHistory.confidence,
        evidenceIds: priorHistory.evidenceIds,
      });
    }

    // Determine uncertainty drivers
    const uncertaintyDrivers: string[] = [];

    if (monitoringAnalysis.months < 12) {
      uncertaintyDrivers.push(
        `Monitoring period only ${monitoringAnalysis.months} months (recommend 12+ for seasonal cycle)`
      );
    }

    if (!movementAnalysis.hasTimeSeriesData) {
      uncertaintyDrivers.push("No objective movement monitoring data available");
    }

    if (movementAnalysis.ambiguousPattern) {
      uncertaintyDrivers.push("Movement pattern shows both seasonal and progressive characteristics");
    }

    if (!treeAnalysis.treeInvestigated) {
      uncertaintyDrivers.push("Tree/vegetation influence not yet investigated");
    }

    // Calculate overall assessment
    const overallConfidence = this.calculateOverallConfidence(
      movementAnalysis,
      monitoringAnalysis,
      uncertaintyDrivers.length
    );

    return {
      peril: "SUBSIDENCE",
      overallAssessment: {
        label: this.determineLabel(overallConfidence),
        confidence: overallConfidence,
        rationale: this.buildRationale(
          movementAnalysis,
          monitoringAnalysis,
          treeAnalysis
        ),
        keyEvidenceIds: [
          ...movementAnalysis.progressiveIds,
          ...movementAnalysis.seasonalIds,
          ...monitoringAnalysis.evidenceIds,
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

    const movementAnalysis = this.analyzeMovement();
    const monitoringAnalysis = this.analyzeMonitoringPeriod();
    const treeAnalysis = this.analyzeTreeInfluence();

    // Check monitoring duration
    if (monitoringAnalysis.months < 12) {
      actions.push({
        priority: 1,
        action: `Continue monitoring for at least ${12 - monitoringAnalysis.months} more months to capture full seasonal cycle`,
        rationale: "12-month monitoring period required to distinguish seasonal vs progressive movement",
        linkedUncertainty: `Monitoring period only ${monitoringAnalysis.months} months (recommend 12+ for seasonal cycle)`,
        expectedImpact: {
          type: "narrow_interval",
          estimatedReduction: "high",
        },
        evidenceIds: monitoringAnalysis.evidenceIds,
      });
    }

    // Check for sensor data
    if (!movementAnalysis.hasTimeSeriesData) {
      actions.push({
        priority: 1,
        action: "Install crack monitoring sensors at key locations",
        rationale: "Objective movement data essential for distinguishing subsidence type",
        linkedUncertainty: "No objective movement monitoring data available",
        expectedImpact: {
          type: "narrow_interval",
          estimatedReduction: "high",
        },
      });
    }

    // Check tree investigation
    if (!treeAnalysis.treeInvestigated) {
      actions.push({
        priority: 2,
        action: "Commission arboricultural survey of trees within influence zone",
        rationale: "Tree root activity can drive seasonal soil shrink-swell",
        linkedUncertainty: "Tree/vegetation influence not yet investigated",
        expectedImpact: {
          type: "shift_estimate",
          estimatedReduction: "medium",
        },
      });
    }

    // If pattern is ambiguous, suggest specialist
    if (movementAnalysis.ambiguousPattern) {
      actions.push({
        priority: 2,
        action: "Refer to structural engineer for detailed movement pattern analysis",
        rationale: "Movement shows characteristics of both seasonal and progressive subsidence",
        linkedUncertainty: "Movement pattern shows both seasonal and progressive characteristics",
        expectedImpact: {
          type: "shift_estimate",
          estimatedReduction: "high",
        },
        evidenceIds: movementAnalysis.progressiveIds,
      });
    }

    // Check for soil investigation
    const hasSoilReport = this.evidence.some(
      e => e.type === "REPORT" && e.contentText.toLowerCase().includes("soil")
    );
    if (!hasSoilReport) {
      actions.push({
        priority: 3,
        action: "Obtain soil analysis report (shrink-swell potential)",
        rationale: "Soil type affects likelihood of subsidence vs thermal/moisture movement",
        linkedUncertainty: "Soil characteristics not documented",
        expectedImpact: {
          type: "confirm_assumption",
          estimatedReduction: "medium",
        },
      });
    }

    // If monitoring complete and clear progressive, ready for decision
    if (
      monitoringAnalysis.months >= 12 &&
      movementAnalysis.isProgressive &&
      !movementAnalysis.ambiguousPattern
    ) {
      actions.push({
        priority: 5,
        action: "Review case for decision readiness",
        rationale: "12+ months monitoring complete; clear progressive movement pattern",
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

  private analyzeMovement() {
    const sensorData = this.evidence.filter(e => e.type === "SENSOR");
    const csvData = this.evidence.filter(e => e.type === "CSV");
    const reports = this.evidence.filter(e => e.type === "REPORT");

    const hasTimeSeriesData = sensorData.length > 0 || csvData.length > 0;
    let isProgressive = false;
    let ambiguousPattern = false;

    let progressiveConfidence = createConfidenceInterval(
      0.3,
      0.1,
      0.6,
      "Insufficient data to assess movement pattern"
    );

    let seasonalConfidence = createConfidenceInterval(
      0.5,
      0.3,
      0.7,
      "Default assumption without monitoring data"
    );

    const progressiveIds: string[] = [];
    const seasonalIds: string[] = [];

    if (hasTimeSeriesData) {
      // Parse time series data (simplified)
      const movementData = this.parseMovementData([...sensorData, ...csvData]);

      if (movementData.length >= 6) {
        // At least 6 data points
        const trend = this.calculateTrend(movementData);
        const seasonality = this.detectSeasonality(movementData);

        if (trend.slope > 0.5 && !seasonality.strong) {
          // Clear progressive movement
          isProgressive = true;
          progressiveConfidence = createConfidenceInterval(
            0.75,
            0.65,
            0.85,
            "Time-series shows consistent progressive movement with minimal seasonal variation"
          );
          progressiveIds.push(...sensorData.map(s => s.id), ...csvData.map(c => c.id));

          seasonalConfidence = createConfidenceInterval(
            0.25,
            0.15,
            0.35,
            "Movement pattern inconsistent with pure seasonal variation"
          );
        } else if (seasonality.strong && trend.slope < 0.3) {
          // Clear seasonal movement
          isProgressive = false;
          seasonalConfidence = createConfidenceInterval(
            0.7,
            0.6,
            0.8,
            "Movement shows strong seasonal pattern with limited net progression"
          );
          seasonalIds.push(...sensorData.map(s => s.id), ...csvData.map(c => c.id));

          progressiveConfidence = createConfidenceInterval(
            0.3,
            0.2,
            0.45,
            "Limited progressive component observed"
          );
        } else {
          // Ambiguous pattern
          ambiguousPattern = true;
          progressiveConfidence = createConfidenceInterval(
            0.5,
            0.3,
            0.7,
            "Movement shows both progressive and seasonal characteristics - further monitoring needed"
          );
          seasonalConfidence = createConfidenceInterval(
            0.5,
            0.3,
            0.7,
            "Movement shows both progressive and seasonal characteristics - further monitoring needed"
          );
          progressiveIds.push(...sensorData.map(s => s.id), ...csvData.map(c => c.id));
          seasonalIds.push(...sensorData.map(s => s.id), ...csvData.map(c => c.id));
        }
      }
    } else if (reports.length > 0) {
      // Rely on engineer's assessment
      const reportText = reports.map(r => r.contentText.toLowerCase()).join(" ");

      if (reportText.includes("progressive")) {
        isProgressive = true;
        progressiveConfidence = createConfidenceInterval(
          0.6,
          0.45,
          0.75,
          "Based on engineer's visual assessment (not objective monitoring)"
        );
        progressiveIds.push(...reports.map(r => r.id));
      }

      if (reportText.includes("seasonal")) {
        seasonalConfidence = createConfidenceInterval(
          0.6,
          0.45,
          0.75,
          "Based on engineer's visual assessment (not objective monitoring)"
        );
        seasonalIds.push(...reports.map(r => r.id));
      }
    }

    return {
      hasTimeSeriesData,
      isProgressive,
      ambiguousPattern,
      progressiveConfidence,
      seasonalConfidence,
      progressiveIds,
      seasonalIds,
    };
  }

  private analyzeTreeInfluence() {
    const reports = this.evidence.filter(e => e.type === "REPORT");
    const notes = this.evidence.filter(e => e.type === "NOTE");

    const allText = [...reports, ...notes]
      .map(e => e.contentText.toLowerCase())
      .join(" ");

    const treePresent = allText.includes("tree") || allText.includes("vegetation");
    const treeInvestigated = allText.includes("arboricultural") || allText.includes("root");

    let confidence = createConfidenceInterval(
      0.5,
      0.3,
      0.7,
      "Tree presence noted but influence not quantified"
    );

    if (treeInvestigated) {
      confidence = createConfidenceInterval(
        0.65,
        0.5,
        0.8,
        "Arboricultural assessment indicates tree influence on soil moisture"
      );
    }

    return {
      treePresent,
      treeInvestigated,
      confidence,
      evidenceIds: [...reports.map(r => r.id), ...notes.map(n => n.id)],
    };
  }

  private analyzeMonitoringPeriod() {
    const sensorData = this.evidence.filter(e => e.type === "SENSOR");
    const csvData = this.evidence.filter(e => e.type === "CSV");

    let months = 0;
    let isSufficient = false;

    const evidenceIds = [...sensorData.map(s => s.id), ...csvData.map(c => c.id)];

    if (sensorData.length > 0 || csvData.length > 0) {
      const movementData = this.parseMovementData([...sensorData, ...csvData]);
      if (movementData.length > 0) {
        const dates = movementData.map(d => new Date(d.date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const daysDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
        months = Math.floor(daysDiff / 30);
        isSufficient = months >= 12;
      }
    }

    let confidence: any;
    if (months >= 12) {
      confidence = createConfidenceInterval(
        0.85,
        0.75,
        0.95,
        "12+ months monitoring captures full seasonal cycle"
      );
    } else if (months >= 6) {
      confidence = createConfidenceInterval(
        0.5,
        0.35,
        0.65,
        `${months} months monitoring - partial seasonal data available`
      );
    } else {
      confidence = createConfidenceInterval(
        0.3,
        0.15,
        0.5,
        `Only ${months} months monitoring - insufficient for seasonal assessment`
      );
    }

    return {
      months,
      isSufficient,
      confidence,
      evidenceIds,
    };
  }

  private analyzePriorHistory() {
    const notes = this.evidence.filter(e => e.type === "NOTE");
    const allText = notes.map(n => n.contentText.toLowerCase()).join(" ");

    const hasPriorClaim = allText.includes("prior claim") || allText.includes("previous");

    let confidence = createConfidenceInterval(
      0.7,
      0.6,
      0.8,
      "Prior claim indicates ongoing structural issue"
    );

    return {
      hasPriorClaim,
      confidence,
      evidenceIds: notes.map(n => n.id),
    };
  }

  private parseMovementData(evidence: EvidenceItem[]): { date: string; value: number }[] {
    // Simplified parser - in real system would handle CSV properly
    const data: { date: string; value: number }[] = [];

    for (const item of evidence) {
      if (item.type === "CSV" || item.type === "SENSOR") {
        // Mock parsing - look for date and number patterns
        const lines = item.contentText.split("\n");
        for (const line of lines) {
          const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/);
          const valueMatch = line.match(/(\d+\.?\d*)\s*mm/);

          if (dateMatch && valueMatch) {
            data.push({
              date: dateMatch[0],
              value: parseFloat(valueMatch[1]),
            });
          }
        }
      }
    }

    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private calculateTrend(data: { date: string; value: number }[]) {
    if (data.length < 2) return { slope: 0, intercept: 0 };

    // Simple linear regression
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.value);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private detectSeasonality(data: { date: string; value: number }[]) {
    // Simplified seasonality detection
    // Look for regular up/down pattern
    if (data.length < 8) return { strong: false };

    const diffs = [];
    for (let i = 1; i < data.length; i++) {
      diffs.push(data[i].value - data[i - 1].value);
    }

    // Count direction changes
    let directionChanges = 0;
    for (let i = 1; i < diffs.length; i++) {
      if ((diffs[i] > 0 && diffs[i - 1] < 0) || (diffs[i] < 0 && diffs[i - 1] > 0)) {
        directionChanges++;
      }
    }

    const strong = directionChanges >= diffs.length * 0.4;

    return { strong };
  }

  private calculateOverallConfidence(
    movementAnalysis: any,
    monitoringAnalysis: any,
    uncertaintyCount: number
  ) {
    let pe = 0.5;
    let lb = 0.3;
    let ub = 0.7;

    // Adjust based on movement analysis
    if (movementAnalysis.isProgressive && !movementAnalysis.ambiguousPattern) {
      pe += 0.25;
      lb += 0.15;
      ub += 0.15;
    } else if (!movementAnalysis.hasTimeSeriesData) {
      // No objective data - very wide interval
      lb = 0.2;
      ub = 0.8;
    }

    // Adjust based on monitoring duration
    if (monitoringAnalysis.months < 6) {
      lb = Math.max(0, lb - 0.15);
      ub = Math.min(1, ub + 0.15);
    } else if (monitoringAnalysis.months >= 12) {
      const narrowing = 0.1;
      lb = Math.min(pe, lb + narrowing);
      ub = Math.max(pe, ub - narrowing);
    }

    // Widen based on uncertainty count
    const widthIncrease = uncertaintyCount * 0.04;
    lb = Math.max(0, lb - widthIncrease);
    ub = Math.min(1, ub + widthIncrease);

    pe = Math.max(0, Math.min(1, pe));
    lb = Math.max(0, Math.min(pe, lb));
    ub = Math.max(pe, Math.min(1, ub));

    let explanation = "Based on available monitoring data. ";
    if (monitoringAnalysis.months < 12) {
      explanation += `Wide interval due to incomplete seasonal cycle (${monitoringAnalysis.months} months).`;
    } else {
      explanation += "Full seasonal cycle observed; interval reflects movement pattern clarity.";
    }

    return createConfidenceInterval(pe, lb, ub, explanation);
  }

  private determineLabel(confidence: any): "likely" | "borderline" | "unlikely" | "unclear" {
    const { pointEstimate, lowerBound, upperBound } = confidence;

    if (upperBound - lowerBound > 0.6) {
      return "unclear";
    }

    if (pointEstimate >= 0.65) return "likely";
    if (pointEstimate <= 0.35) return "unlikely";
    return "borderline";
  }

  private buildRationale(
    movementAnalysis: any,
    monitoringAnalysis: any,
    treeAnalysis: any
  ): string {
    const parts: string[] = [];

    if (movementAnalysis.hasTimeSeriesData) {
      if (movementAnalysis.isProgressive) {
        parts.push("Monitoring data shows progressive movement trend.");
      } else {
        parts.push("Monitoring data suggests primarily seasonal movement.");
      }

      if (movementAnalysis.ambiguousPattern) {
        parts.push("Pattern shows both progressive and seasonal characteristics.");
      }
    } else {
      parts.push("No objective movement monitoring data available.");
    }

    if (monitoringAnalysis.months < 12) {
      parts.push(
        `Monitoring period of ${monitoringAnalysis.months} months is insufficient for full seasonal assessment.`
      );
    } else {
      parts.push("12+ months monitoring captures complete seasonal cycle.");
    }

    if (treeAnalysis.treePresent && treeAnalysis.treeInvestigated) {
      parts.push("Tree influence on soil moisture documented.");
    }

    return parts.join(" ");
  }
}
