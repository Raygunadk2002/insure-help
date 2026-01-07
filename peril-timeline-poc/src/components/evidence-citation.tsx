// FILE: src/components/evidence-citation.tsx
"use client";

import { EvidenceItem } from "@/types";
import { FileText, Camera, ClipboardList, Activity, Cloud, FileSpreadsheet } from "lucide-react";

interface EvidenceCitationProps {
  evidenceIds: string[];
  evidence: EvidenceItem[];
}

/**
 * Shows citations to supporting evidence
 * Critical for auditability - every claim must link back to evidence
 */
export function EvidenceCitation({ evidenceIds, evidence }: EvidenceCitationProps) {
  const cited = evidence.filter(e => evidenceIds.includes(e.id));

  if (cited.length === 0) {
    return <span className="text-xs text-gray-400">[No evidence cited]</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {cited.map(item => (
        <EvidenceTag key={item.id} item={item} />
      ))}
    </div>
  );
}

function EvidenceTag({ item }: { item: EvidenceItem }) {
  const getIcon = () => {
    switch (item.type) {
      case "FNOL":
        return <ClipboardList className="w-3 h-3" />;
      case "PHOTO":
        return <Camera className="w-3 h-3" />;
      case "REPORT":
        return <FileText className="w-3 h-3" />;
      case "SENSOR":
      case "CSV":
        return <Activity className="w-3 h-3" />;
      case "WEATHER":
        return <Cloud className="w-3 h-3" />;
      default:
        return <FileSpreadsheet className="w-3 h-3" />;
    }
  };

  const getConfidenceColor = () => {
    switch (item.confidence) {
      case "high":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-orange-100 text-orange-800 border-orange-300";
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border ${getConfidenceColor()}`}
      title={`${item.title} (${item.confidence} confidence)`}
    >
      {getIcon()}
      <span className="font-medium">{item.type}</span>
      <span className="opacity-75">· {item.source}</span>
    </div>
  );
}
