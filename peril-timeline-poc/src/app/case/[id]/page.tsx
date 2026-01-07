// FILE: src/app/case/[id]/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Droplet,
  Mountain,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Calendar,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Disclaimer } from "@/components/disclaimer";
import { ConfidenceIntervalBar, ConfidenceIntervalBadge } from "@/components/confidence-interval-bar";
import { EvidenceCitation } from "@/components/evidence-citation";
import { getAllCases, getEvidenceForCase } from "@/lib/data/seed-data";
import { CaseAnalyzer } from "@/lib/inference/analyzer";
import { formatDate, intervalWidth } from "@/lib/utils";
import type { EvidenceItem, TimelineEvent, NextAction } from "@/types";

export default function CasePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Load case data
  const cases = getAllCases();
  const caseItem = cases.find((c) => c.id === params.id);

  if (!caseItem) {
    return <div className="p-8">Case not found</div>;
  }

  // Run analysis
  const evidence = getEvidenceForCase(caseItem.id);
  const analyzer = new CaseAnalyzer(caseItem, evidence);
  const analysis = analyzer.analyze();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cases
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {caseItem.peril === "FLOOD" ? (
                  <Droplet className="w-6 h-6 text-blue-600" />
                ) : (
                  <Mountain className="w-6 h-6 text-amber-600" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {caseItem.peril} Claim - {caseItem.location.postcode}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Case ID: {caseItem.id}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant={caseItem.status === "OPEN" ? "default" : "secondary"}>
              {caseItem.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Disclaimer */}
          <Disclaimer />

          {/* Tabs */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="actions">Next Actions</TabsTrigger>
                  <TabsTrigger value="changelog">Change Log</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {/* Tab 1: Overview */}
                <TabsContent value="overview">
                  <OverviewTab caseItem={caseItem} analysis={analysis} evidence={evidence} />
                </TabsContent>

                {/* Tab 2: Evidence */}
                <TabsContent value="evidence">
                  <EvidenceTab evidence={evidence} />
                </TabsContent>

                {/* Tab 3: Timeline */}
                <TabsContent value="timeline">
                  <TimelineTab timeline={analysis.timeline} evidence={evidence} />
                </TabsContent>

                {/* Tab 4: Analysis */}
                <TabsContent value="analysis">
                  <AnalysisTab analysis={analysis} evidence={evidence} />
                </TabsContent>

                {/* Tab 5: Next Actions */}
                <TabsContent value="actions">
                  <NextActionsTab actions={analysis.nextActions} />
                </TabsContent>

                {/* Tab 6: Change Log */}
                <TabsContent value="changelog">
                  <ChangeLogTab changeLog={analysis.changeLog} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ==================== Tab Components ====================

function OverviewTab({ caseItem, analysis, evidence }: any) {
  const theory = analysis.theory;
  const uncertaintyWidth = intervalWidth(theory.overallAssessment.confidence);

  return (
    <div className="space-y-6">
      {/* Overall Assessment */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Overall Assessment</h3>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    theory.overallAssessment.label === "likely"
                      ? "default"
                      : theory.overallAssessment.label === "borderline"
                      ? "outline"
                      : "secondary"
                  }
                  className="text-lg px-4 py-2"
                >
                  {theory.overallAssessment.label.toUpperCase()}
                </Badge>
                <ConfidenceIntervalBadge
                  interval={theory.overallAssessment.confidence}
                />
              </div>
              {uncertaintyWidth > 0.4 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">High Uncertainty</span>
                </div>
              )}
            </div>

            <ConfidenceIntervalBar
              interval={theory.overallAssessment.confidence}
              label="Confidence Interval"
            />

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Rationale</h4>
              <p className="text-sm text-gray-700">
                {theory.overallAssessment.rationale}
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Key Evidence</h4>
              <EvidenceCitation
                evidenceIds={theory.overallAssessment.keyEvidenceIds}
                evidence={evidence}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Why the interval is this wide */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Uncertainty Drivers</h3>
        <Card>
          <CardContent className="pt-6">
            {theory.uncertaintyDrivers.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">
                  No major uncertainty drivers identified
                </span>
              </div>
            ) : (
              <ul className="space-y-3">
                {theory.uncertaintyDrivers.map((driver: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{driver}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Case Details */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Case Details</h3>
        <Card>
          <CardContent className="pt-6">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-600">Peril</dt>
                <dd className="font-semibold">{caseItem.peril}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Location</dt>
                <dd className="font-semibold">
                  {caseItem.location.postcode}
                  {caseItem.location.address && (
                    <span className="block text-gray-600 font-normal">
                      {caseItem.location.address}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Policy Period</dt>
                <dd className="font-semibold">
                  {formatDate(caseItem.policy.startDate)} -{" "}
                  {formatDate(caseItem.policy.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Evidence Items</dt>
                <dd className="font-semibold">{evidence.length}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Created</dt>
                <dd className="font-semibold">{formatDate(caseItem.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Last Updated</dt>
                <dd className="font-semibold">{formatDate(caseItem.updatedAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EvidenceTab({ evidence }: { evidence: EvidenceItem[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Evidence Items ({evidence.length})
        </h3>
      </div>

      <div className="space-y-4">
        {evidence.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge variant="secondary">{item.source}</Badge>
                    <Badge
                      variant={
                        item.confidence === "high"
                          ? "default"
                          : item.confidence === "medium"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {item.confidence} confidence
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  {item.eventDate && (
                    <CardDescription>
                      Event date: {formatDate(item.eventDate)} · Received:{" "}
                      {formatDate(item.receivedDate)}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {item.contentText}
              </p>
              {item.fileName && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{item.fileName}</span>
                </div>
              )}
              {item.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TimelineTab({
  timeline,
  evidence,
}: {
  timeline: TimelineEvent[];
  evidence: EvidenceItem[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Timeline Events ({timeline.length})
        </h3>
      </div>

      {timeline.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-600">
            No timeline events extracted
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

          <div className="space-y-6">
            {timeline.map((event, idx) => (
              <div key={event.id} className="relative pl-16">
                {/* Timeline dot */}
                <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-blue-500 border-4 border-white" />

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold">
                            {formatDate(event.eventDate)}
                          </span>
                          {event.isApproximate && (
                            <Badge variant="outline" className="text-xs">
                              Approximate
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base">{event.label}</CardTitle>
                        <CardDescription className="text-xs">
                          Type: {event.eventType} · Confidence:{" "}
                          {(event.confidenceScore * 100).toFixed(0)}%
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-gray-600 mb-2">
                      Supporting evidence:
                    </div>
                    <EvidenceCitation
                      evidenceIds={event.evidenceIds}
                      evidence={evidence}
                    />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisTab({ analysis, evidence }: any) {
  const theory = analysis.theory;

  return (
    <div className="space-y-6">
      {/* Hypotheses */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Hypotheses</h3>
        <div className="space-y-4">
          {theory.hypotheses.map((hyp: any, idx: number) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base">{hyp.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ConfidenceIntervalBar
                  interval={hyp.confidence}
                  label="Confidence Interval"
                />

                {hyp.supportingEvidenceIds.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2 text-green-700">
                      Supporting Evidence
                    </div>
                    <EvidenceCitation
                      evidenceIds={hyp.supportingEvidenceIds}
                      evidence={evidence}
                    />
                  </div>
                )}

                {hyp.contradictingEvidenceIds.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2 text-red-700">
                      Contradicting Evidence
                    </div>
                    <EvidenceCitation
                      evidenceIds={hyp.contradictingEvidenceIds}
                      evidence={evidence}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coverage Signals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Coverage Signals</h3>
        <div className="space-y-4">
          {theory.coverageSignals.map((signal: any, idx: number) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{signal.signal}</CardTitle>
                  <Badge
                    variant={
                      signal.direction === "supports"
                        ? "default"
                        : signal.direction === "weakens"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {signal.direction}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ConfidenceIntervalBar
                  interval={signal.confidence}
                  label="Confidence"
                />

                <div>
                  <div className="text-sm font-semibold mb-2">Evidence</div>
                  <EvidenceCitation
                    evidenceIds={signal.evidenceIds}
                    evidence={evidence}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function NextActionsTab({ actions }: { actions: NextAction[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Prioritized Actions ({actions.length})
        </h3>
      </div>

      {actions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-600">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-semibold">No further actions required</p>
            <p className="text-sm mt-1">
              Confidence interval is sufficiently narrow for decision making
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {actions.map((action, idx) => (
            <Card
              key={idx}
              className={
                action.priority === 1
                  ? "border-l-4 border-l-red-500"
                  : action.priority === 2
                  ? "border-l-4 border-l-orange-500"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          action.priority <= 2
                            ? "destructive"
                            : action.priority === 3
                            ? "default"
                            : "outline"
                        }
                      >
                        Priority {action.priority}
                      </Badge>
                      <Badge variant="outline">
                        {action.expectedImpact.estimatedReduction.toUpperCase()}{" "}
                        impact
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{action.action}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-semibold mb-1">Rationale</div>
                  <p className="text-sm text-gray-700">{action.rationale}</p>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-1">
                    Linked Uncertainty
                  </div>
                  <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{action.linkedUncertainty}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-1">Expected Impact</div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">
                      {action.expectedImpact.type.replace(/_/g, " ")} ·{" "}
                      {action.expectedImpact.estimatedReduction} reduction in
                      uncertainty
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeLogTab({ changeLog }: { changeLog: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Change History ({changeLog.length})
        </h3>
      </div>

      {changeLog.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-600">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-semibold">No changes recorded yet</p>
            <p className="text-sm mt-1">
              Changes will appear here when new evidence is added
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {changeLog.map((change: any, idx: number) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{change.type}</Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(change.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{change.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
