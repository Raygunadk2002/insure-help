// FILE: src/app/page.tsx
"use client";

import Link from "next/link";
import { AlertCircle, Droplet, Mountain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclaimer, DisclaimerBadge } from "@/components/disclaimer";
import { getAllCases, getEvidenceForCase } from "@/lib/data/seed-data";
import { CaseAnalyzer } from "@/lib/inference/analyzer";
import { formatDate, formatInterval } from "@/lib/utils";

export default function HomePage() {
  const cases = getAllCases();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Peril Timeline POC
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Claims decision support with confidence intervals
              </p>
            </div>
            <DisclaimerBadge />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Disclaimer */}
          <Disclaimer />

          {/* Cases Grid */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Cases
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {cases.map((caseItem) => {
                // Run quick analysis for overview
                const evidence = getEvidenceForCase(caseItem.id);
                const analyzer = new CaseAnalyzer(caseItem, evidence);
                const analysis = analyzer.analyze();

                return (
                  <Link key={caseItem.id} href={`/case/${caseItem.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {caseItem.peril === "FLOOD" ? (
                              <Droplet className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Mountain className="w-5 h-5 text-amber-600" />
                            )}
                            <CardTitle className="text-lg">
                              {caseItem.peril} Claim
                            </CardTitle>
                          </div>
                          <Badge
                            variant={
                              caseItem.status === "OPEN"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {caseItem.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {caseItem.location.postcode} · Created{" "}
                          {formatDate(caseItem.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Overall Assessment */}
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Current Assessment
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                analysis.theory.overallAssessment.label ===
                                "likely"
                                  ? "default"
                                  : analysis.theory.overallAssessment.label ===
                                    "borderline"
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {analysis.theory.overallAssessment.label.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {formatInterval(
                                analysis.theory.overallAssessment.confidence
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
                          <div>
                            <div className="text-gray-600">Evidence Items</div>
                            <div className="font-semibold">{evidence.length}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">
                              Uncertainty Drivers
                            </div>
                            <div className="font-semibold flex items-center gap-1">
                              {analysis.theory.uncertaintyDrivers.length}
                              {analysis.theory.uncertaintyDrivers.length > 2 && (
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full mt-4">
                          Open Case Analysis
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About This POC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                This proof-of-concept demonstrates claims analysis with{" "}
                <strong>confidence intervals</strong> to represent epistemic
                uncertainty.
              </p>
              <p>
                Every conclusion includes a point estimate, lower/upper bounds,
                and an explanation of what drives uncertainty. Next actions are
                prioritized by their expected impact on narrowing confidence
                intervals.
              </p>
              <p>
                <strong>Key features:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Evidence-based timeline construction</li>
                <li>Peril-specific inference engines (Flood/Subsidence)</li>
                <li>Confidence intervals throughout all analysis</li>
                <li>Living timeline with change tracking</li>
                <li>Prioritized next actions tied to uncertainty reduction</li>
                <li>Full auditability with evidence citations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
