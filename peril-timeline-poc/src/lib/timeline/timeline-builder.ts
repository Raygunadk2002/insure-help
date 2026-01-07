// FILE: src/lib/timeline/timeline-builder.ts
// Timeline extraction and construction logic

import { EvidenceItem, TimelineEvent, Contradiction } from "@/types";
import { generateId, parseDate } from "@/lib/utils";

interface ExtractedEvent {
  date: string;
  label: string;
  eventType: string;
  evidenceId: string;
  isApproximate: boolean;
  confidence: number;
}

/**
 * Extract timeline events from evidence items
 */
export function extractEventsFromEvidence(evidence: EvidenceItem[]): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];

  for (const item of evidence) {
    // Extract events based on evidence type
    switch (item.type) {
      case "FNOL":
        if (item.eventDate) {
          events.push({
            date: item.eventDate,
            label: "First Notice of Loss",
            eventType: "claim_reported",
            evidenceId: item.id,
            isApproximate: false,
            confidence: item.confidence === "high" ? 0.9 : item.confidence === "medium" ? 0.7 : 0.5,
          });
        }
        // Also extract mentioned damage discovery date from text
        const discoveryMatch = item.contentText.match(
          /discovered?.*?on.*?(\d{4}-\d{2}-\d{2})/i
        );
        if (discoveryMatch) {
          events.push({
            date: discoveryMatch[1],
            label: "Damage discovered",
            eventType: "damage_discovered",
            evidenceId: item.id,
            isApproximate: false,
            confidence: 0.8,
          });
        }
        break;

      case "WEATHER":
        if (item.eventDate) {
          events.push({
            date: item.eventDate,
            label: "Weather event",
            eventType: "weather_event",
            evidenceId: item.id,
            isApproximate: false,
            confidence: 0.95, // Weather data is usually accurate
          });
        }
        break;

      case "PHOTO":
        if (item.eventDate) {
          events.push({
            date: item.eventDate,
            label: "Photographic evidence taken",
            eventType: "photo_taken",
            evidenceId: item.id,
            isApproximate: true, // Photos may not be dated accurately
            confidence: 0.6,
          });
        }
        break;

      case "REPORT":
        if (item.eventDate) {
          events.push({
            date: item.eventDate,
            label: `${item.source} report`,
            eventType: "inspection",
            evidenceId: item.id,
            isApproximate: false,
            confidence: 0.85,
          });
        }
        break;

      case "SENSOR":
      case "CSV":
        // Extract multiple readings from sensor data
        const readings = extractSensorReadings(item);
        events.push(...readings);
        break;

      case "NOTE":
        // Extract any dates mentioned in notes
        const mentionedDates = extractDatesFromText(item.contentText);
        for (const dateStr of mentionedDates) {
          events.push({
            date: dateStr,
            label: "Event mentioned in notes",
            eventType: "mentioned_event",
            evidenceId: item.id,
            isApproximate: true,
            confidence: 0.5,
          });
        }
        break;
    }
  }

  return events;
}

/**
 * Extract sensor readings from sensor/CSV evidence
 */
function extractSensorReadings(item: EvidenceItem): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];
  const lines = item.contentText.split("\n");

  for (const line of lines) {
    const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/);
    const valueMatch = line.match(/(\d+\.?\d*)\s*mm/);

    if (dateMatch && valueMatch) {
      events.push({
        date: dateMatch[0],
        label: `Movement reading: ${valueMatch[1]}mm`,
        eventType: "sensor_reading",
        evidenceId: item.id,
        isApproximate: false,
        confidence: 0.95,
      });
    }
  }

  return events;
}

/**
 * Extract date strings from text
 */
function extractDatesFromText(text: string): string[] {
  const dates: string[] = [];
  const datePattern = /\d{4}-\d{2}-\d{2}/g;
  const matches = text.match(datePattern);

  if (matches) {
    dates.push(...matches);
  }

  return dates;
}

/**
 * Normalize event dates and merge similar events
 */
export function normalizeEventDates(events: ExtractedEvent[]): ExtractedEvent[] {
  // Sort by date
  const sorted = [...events].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });

  return sorted;
}

/**
 * Merge similar events that occur on the same date
 */
export function mergeEvents(events: ExtractedEvent[]): TimelineEvent[] {
  const eventMap = new Map<string, ExtractedEvent[]>();

  // Group by date and type
  for (const event of events) {
    const key = `${event.date}_${event.eventType}`;
    if (!eventMap.has(key)) {
      eventMap.set(key, []);
    }
    eventMap.get(key)!.push(event);
  }

  // Create merged timeline events
  const timeline: TimelineEvent[] = [];

  for (const [_key, eventGroup] of eventMap) {
    if (eventGroup.length === 0) continue;

    const first = eventGroup[0];
    const evidenceIds = [...new Set(eventGroup.map(e => e.evidenceId))];
    const avgConfidence =
      eventGroup.reduce((sum, e) => sum + e.confidence, 0) / eventGroup.length;

    timeline.push({
      id: generateId("evt"),
      caseId: "", // Will be set by caller
      eventDate: first.date,
      label: eventGroup.length > 1 ? `${first.label} (${eventGroup.length} sources)` : first.label,
      eventType: first.eventType,
      evidenceIds,
      confidenceScore: avgConfidence,
      isApproximate: eventGroup.some(e => e.isApproximate),
    });
  }

  return timeline.sort((a, b) => {
    const dateA = parseDate(a.eventDate);
    const dateB = parseDate(b.eventDate);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Detect contradictions in the timeline
 */
export function detectContradictions(
  timeline: TimelineEvent[],
  evidence: EvidenceItem[]
): Contradiction[] {
  const contradictions: Contradiction[] = [];

  // Check for conflicting dates for the same event type
  const eventsByType = new Map<string, TimelineEvent[]>();

  for (const event of timeline) {
    if (!eventsByType.has(event.eventType)) {
      eventsByType.set(event.eventType, []);
    }
    eventsByType.get(event.eventType)!.push(event);
  }

  for (const [eventType, events] of eventsByType) {
    if (events.length > 1 && eventType !== "sensor_reading") {
      // Multiple events of same type on different dates
      const dates = [...new Set(events.map(e => e.eventDate))];
      if (dates.length > 1) {
        const allEvidenceIds = events.flatMap(e => e.evidenceIds);
        contradictions.push({
          id: generateId("contra"),
          description: `Multiple dates reported for ${eventType}: ${dates.join(", ")}`,
          evidenceIds: allEvidenceIds,
          impactOnUncertainty: "Conflicting timeline increases uncertainty about event sequence",
        });
      }
    }
  }

  // Check for impossible sequences (e.g., damage discovered before weather event)
  const weatherEvents = timeline.filter(e => e.eventType === "weather_event");
  const damageEvents = timeline.filter(e => e.eventType === "damage_discovered");

  for (const damage of damageEvents) {
    for (const weather of weatherEvents) {
      const damageDate = parseDate(damage.eventDate);
      const weatherDate = parseDate(weather.eventDate);

      if (damageDate && weatherDate && damageDate < weatherDate) {
        contradictions.push({
          id: generateId("contra"),
          description: "Damage discovered before weather event occurred",
          evidenceIds: [...damage.evidenceIds, ...weather.evidenceIds],
          impactOnUncertainty:
            "Timeline inconsistency raises questions about causation",
        });
      }
    }
  }

  return contradictions;
}

/**
 * Build complete timeline from evidence
 */
export function buildTimeline(
  caseId: string,
  evidence: EvidenceItem[]
): { timeline: TimelineEvent[]; contradictions: Contradiction[] } {
  // Step 1: Extract events from evidence
  const extracted = extractEventsFromEvidence(evidence);

  // Step 2: Normalize dates
  const normalized = normalizeEventDates(extracted);

  // Step 3: Merge similar events
  let timeline = mergeEvents(normalized);

  // Set case ID
  timeline = timeline.map(e => ({ ...e, caseId }));

  // Step 4: Detect contradictions
  const contradictions = detectContradictions(timeline, evidence);

  return { timeline, contradictions };
}
