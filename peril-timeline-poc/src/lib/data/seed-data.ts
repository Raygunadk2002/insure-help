// FILE: src/lib/data/seed-data.ts
// Seed sample data for demonstration

import { ClaimCase, EvidenceItem } from "@/types";

/**
 * FLOOD CASE: Conflicting timeline, missing weather data
 * Produces wide confidence interval and clear next actions
 */
export const floodCase: ClaimCase = {
  id: "case_flood_001",
  peril: "FLOOD",
  createdAt: "2024-01-10T09:00:00Z",
  updatedAt: "2024-01-10T09:00:00Z",
  policy: {
    startDate: "2023-06-01",
    endDate: "2024-06-01",
    wordingNotes: "Standard home insurance with flood cover",
  },
  location: {
    postcode: "SE1 9SG",
    address: "45 Thames View, London",
  },
  status: "OPEN",
};

export const floodEvidence: EvidenceItem[] = [
  {
    id: "ev_flood_001",
    caseId: "case_flood_001",
    type: "FNOL",
    source: "policyholder",
    title: "Initial claim notification",
    contentText: `Policyholder called to report water damage. States damage was discovered on 2024-01-08 when returning from holiday. Ground floor flooded, approx 2 inches of water. Damage to carpets, skirting boards, and furniture. Policyholder believes heavy rain on 2024-01-05 caused flooding.`,
    eventDate: "2024-01-08",
    receivedDate: "2024-01-09",
    confidence: "medium",
    tags: ["initial", "verbal"],
  },
  {
    id: "ev_flood_002",
    caseId: "case_flood_001",
    type: "NOTE",
    source: "policyholder",
    title: "Follow-up interview notes",
    contentText: `Second call with policyholder. Now states they actually noticed water on 2024-01-06 but thought it was a minor leak. Confirmed away from 2024-01-03 to 2024-01-08. Neighbour called them about water visible outside property on 2024-01-06.`,
    receivedDate: "2024-01-10",
    confidence: "medium",
    tags: ["interview", "timeline"],
  },
  {
    id: "ev_flood_003",
    caseId: "case_flood_001",
    type: "PHOTO",
    source: "policyholder",
    title: "Photos of water damage",
    contentText: `5 photos showing water damage to carpet, waterline marks on walls approx 5cm high, damaged skirting boards. Photos show localised damage in utility room and adjacent hallway. No visible external ingress points in photos.`,
    fileName: "damage_photos.zip",
    eventDate: "2024-01-09",
    receivedDate: "2024-01-09",
    confidence: "high",
    tags: ["visual", "damage"],
  },
  {
    id: "ev_flood_004",
    caseId: "case_flood_001",
    type: "NOTE",
    source: "contractor",
    title: "Emergency plumber notes",
    contentText: `Attended property 2024-01-09. Visible water damage consistent with prolonged water exposure. No obvious plumbing leaks found in utility room or kitchen. However, stopped tap under sink was slightly loose - could be source. Recommended pipe inspection.`,
    eventDate: "2024-01-09",
    receivedDate: "2024-01-10",
    confidence: "high",
    tags: ["inspection", "alternative-cause"],
  },
];

/**
 * SUBSIDENCE CASE: Short monitoring period, seasonal ambiguity
 * Explicitly wide CI pending longer monitoring
 */
export const subsidenceCase: ClaimCase = {
  id: "case_subs_001",
  peril: "SUBSIDENCE",
  createdAt: "2024-01-05T10:00:00Z",
  updatedAt: "2024-01-05T10:00:00Z",
  policy: {
    startDate: "2023-01-01",
    endDate: "2025-01-01",
    wordingNotes: "Home insurance with subsidence cover, excess £1000",
  },
  location: {
    postcode: "RG1 4QZ",
    address: "12 Oak Avenue, Reading",
  },
  status: "AWAITING_INFO",
};

export const subsidenceEvidence: EvidenceItem[] = [
  {
    id: "ev_subs_001",
    caseId: "case_subs_001",
    type: "FNOL",
    source: "policyholder",
    title: "Subsidence claim notification",
    contentText: `Policyholder reports cracks appearing in external walls over past 6 months. Cracks widening, particularly noticeable after dry summer. Two mature oak trees in front garden, approx 8m from property. No prior subsidence claims.`,
    eventDate: "2024-01-03",
    receivedDate: "2024-01-05",
    confidence: "high",
    tags: ["initial", "trees"],
  },
  {
    id: "ev_subs_002",
    caseId: "case_subs_001",
    type: "REPORT",
    source: "engineer",
    title: "Initial structural inspection",
    contentText: `Site visit 2024-01-10. Observed diagonal cracks in front wall, max width 4mm. Cracking pattern consistent with differential settlement. Clay soil type confirmed - high shrink-swell potential. Mature oak trees within influence zone. Recommended installation of crack monitoring equipment for 12 months to establish movement pattern. Unable to determine if seasonal or progressive without monitoring data.`,
    eventDate: "2024-01-10",
    receivedDate: "2024-01-12",
    confidence: "high",
    tags: ["inspection", "engineering"],
  },
  {
    id: "ev_subs_003",
    caseId: "case_subs_001",
    type: "CSV",
    source: "sensor",
    title: "Crack monitoring data (6 months)",
    contentText: `Crack width measurements (mm):
2024-02-15, 4.2mm
2024-03-15, 4.0mm
2024-04-15, 4.5mm
2024-05-15, 5.1mm
2024-06-15, 5.8mm
2024-07-15, 6.2mm
2024-08-15, 6.0mm
2024-09-15, 5.3mm

Monitoring equipment installed 2024-02-15. Data shows expansion during spring/summer (typical drying season) and some recovery in autumn. Net increase of 1.8mm over 6 months.`,
    fileName: "monitoring_data.csv",
    eventDate: "2024-02-15",
    receivedDate: "2024-09-20",
    confidence: "high",
    tags: ["monitoring", "time-series"],
  },
  {
    id: "ev_subs_004",
    caseId: "case_subs_001",
    type: "NOTE",
    source: "insurer",
    title: "Case review notes",
    contentText: `Case reviewed 2024-09-20. 6 months monitoring data received. Pattern shows clear seasonal variation with some net progression. However, insufficient data to distinguish seasonal vs progressive movement - only one partial seasonal cycle captured. Recommend continuing monitoring through to at least 2025-02 to capture full 12-month cycle including winter recovery period.`,
    receivedDate: "2024-09-20",
    confidence: "high",
    tags: ["review", "monitoring-period"],
  },
  {
    id: "ev_subs_005",
    caseId: "case_subs_001",
    type: "PHOTO",
    source: "engineer",
    title: "Crack photographs",
    contentText: `Photos showing diagonal stepped cracking in brickwork, widest at top. Cracks follow mortar joints. Additional photos show oak trees, estimated height 15m, located 8m from affected wall. No visible root damage or lifting.`,
    fileName: "crack_photos.zip",
    eventDate: "2024-01-10",
    receivedDate: "2024-01-12",
    confidence: "high",
    tags: ["visual", "trees"],
  },
];

/**
 * Get all seed cases
 */
export function getAllCases(): ClaimCase[] {
  return [floodCase, subsidenceCase];
}

/**
 * Get evidence for a case
 */
export function getEvidenceForCase(caseId: string): EvidenceItem[] {
  if (caseId === "case_flood_001") return floodEvidence;
  if (caseId === "case_subs_001") return subsidenceEvidence;
  return [];
}
