import {
  RoadIncident,
  VerificationResults,
  floodExposureAt,
} from "@/lib/roadData";

/**
 * PROTOTYPE verification simulation.
 *
 * This module does NOT run a computer-vision model. It produces a deterministic,
 * rule-based walkthrough of the stages a real pipeline would perform, so the demo
 * can show the reasoning structure (geometry → deformation → temporal → false
 * positive rejection) without claiming an ML inference happened.
 */

export type ScenarioId = "pothole" | "manhole" | "shadow";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
}

export const SCENARIOS: Scenario[] = [
  { id: "pothole", label: "Genuine pothole", description: "Arterial road, monsoon-damaged surface" },
  { id: "manhole", label: "Manhole cover", description: "False-positive rejection demo" },
  { id: "shadow", label: "Shadow artifact", description: "False-positive rejection demo" },
];

export interface StageDef {
  id: string;
  title: string;
  running: string;
  lines: string[];
  note?: string;
  simulated: boolean;
}

export function buildStages(scenario: ScenarioId, isVideo: boolean): StageDef[] {
  const stages: StageDef[] = [];

  stages.push({
    id: "detect",
    title: "Object Detection",
    running: "Scanning frames for candidate road defects...",
    lines:
      scenario === "pothole"
        ? ["Candidate road defect detected", "Detection confidence: 91%"]
        : scenario === "manhole"
          ? ["Candidate road defect detected", "Detection confidence: 74%"]
          : ["Low-contrast candidate region detected", "Detection confidence: 63%"],
    simulated: true,
  });

  stages.push({
    id: "geometry",
    title: "Geometric Analysis",
    running: "Analyzing defect geometry and boundary characteristics...",
    lines:
      scenario === "pothole"
        ? ["Irregular boundary detected", "Pothole likelihood: 87%"]
        : scenario === "manhole"
          ? ["Regular circular boundary detected", "Pothole likelihood: 21%"]
          : ["Soft gradient edges, no hard boundary", "Pothole likelihood: 14%"],
    simulated: true,
  });

  stages.push({
    id: "surface",
    title: "Surface / Depth Analysis",
    running: "Checking pavement deformation and apparent depth...",
    lines:
      scenario === "pothole"
        ? ["Surface depression detected", "Physical deformation: Likely"]
        : scenario === "manhole"
          ? ["Flush metal surface, no depression", "Physical deformation: Unlikely"]
          : ["No measurable surface depression", "Physical deformation: Unlikely"],
    note: "Rule-based estimate in this prototype — production replaces it with monocular depth estimation.",
    simulated: true,
  });

  if (isVideo) {
    stages.push({
      id: "temporal",
      title: "Temporal Verification",
      running: "Tracking candidate across consecutive frames...",
      lines:
        scenario === "pothole"
          ? ["Object tracked across 12 frames", "Temporal consistency: 93%"]
          : scenario === "manhole"
            ? ["Object tracked across 14 frames", "Temporal consistency: 91% (static circular object)"]
            : ["Region tracked across 9 frames", "Temporal consistency: 38% — region moves with light source"],
      note: "Consistent geometry across multiple frames reduces the probability of a transient shadow or visual artifact.",
      simulated: true,
    });
  }

  stages.push({
    id: "falsepos",
    title: "False Positive Analysis",
    running: "Comparing candidate against common false-positive classes...",
    lines:
      scenario === "pothole"
        ? ["Pothole signature is more consistent with physical road damage than common false-positive classes."]
        : scenario === "manhole"
          ? ["Signature matches manhole-cover characteristics more strongly than pavement damage."]
          : ["Signature matches an illumination artifact; no pavement damage evidence."],
    simulated: true,
  });

  return stages;
}

export interface FalsePositiveRow {
  label: string;
  detected: boolean;
}

export function falsePositiveTable(scenario: ScenarioId): FalsePositiveRow[] {
  return [
    { label: "Shadow", detected: scenario === "shadow" },
    { label: "Manhole cover", detected: scenario === "manhole" },
    { label: "Road patch", detected: false },
    { label: "Genuine pavement deformation", detected: scenario === "pothole" },
  ];
}

const LOCATIONS: Record<ScenarioId, { name: string; lat: number; lng: number }> = {
  pothole: { name: "NH-48 near IFFCO Chowk", lat: 28.4733, lng: 77.0726 },
  manhole: { name: "Golf Course Road, near Sector 54", lat: 28.4419, lng: 77.0954 },
  shadow: { name: "Cyber Hub approach road", lat: 28.4949, lng: 77.0894 },
};

export function buildIncident(
  scenario: ScenarioId,
  file: { name: string; isVideo: boolean },
): RoadIncident {
  const loc = LOCATIONS[scenario];
  const flood = floodExposureAt(loc.lat, loc.lng);
  const id = `ri-${Date.now()}`;
  const frames = file.isVideo ? (scenario === "manhole" ? 14 : scenario === "shadow" ? 9 : 12) : null;

  const verification: VerificationResults =
    scenario === "pothole"
      ? {
          incidentId: id,
          detectionConfidence: 91,
          geometryResult: "Irregular boundary detected · pothole likelihood 87%",
          depthResult: "Surface depression detected · deformation likely",
          temporalResult: file.isVideo ? "Temporal consistency: 93%" : null,
          framesVerified: frames,
          shadowCheck: false,
          manholeCheck: false,
          patchCheck: false,
          deformationDetected: true,
          classScores: [
            { label: "Pothole", score: 94 },
            { label: "Manhole", score: 5 },
            { label: "Shadow", score: 3 },
            { label: "Crack", score: 14 },
          ],
          finalConfidence: 94,
          verificationStatus: "verified",
        }
      : scenario === "manhole"
        ? {
            incidentId: id,
            detectionConfidence: 74,
            geometryResult: "Regular circular boundary detected",
            depthResult: "Flush surface · no pavement depression",
            temporalResult: file.isVideo ? "Temporal consistency: 91% (static circular object)" : null,
            framesVerified: frames,
            shadowCheck: false,
            manholeCheck: true,
            patchCheck: false,
            deformationDetected: false,
            classScores: [
              { label: "Pothole", score: 18 },
              { label: "Manhole", score: 91 },
              { label: "Shadow", score: 4 },
              { label: "Crack", score: 7 },
            ],
            finalConfidence: 18,
            verificationStatus: "rejected",
            rejectionReasons: [
              "Regular geometric boundary",
              "Consistent circular structure",
              "Low evidence of pavement deformation",
              "Strong match with manhole-cover characteristics",
            ],
          }
        : {
            incidentId: id,
            detectionConfidence: 63,
            geometryResult: "Soft gradient edges, no hard boundary",
            depthResult: "No measurable surface depression",
            temporalResult: file.isVideo ? "Temporal consistency: 38% — region moves with light source" : null,
            framesVerified: frames,
            shadowCheck: true,
            manholeCheck: false,
            patchCheck: false,
            deformationDetected: false,
            classScores: [
              { label: "Pothole", score: 11 },
              { label: "Manhole", score: 3 },
              { label: "Shadow", score: 88 },
              { label: "Crack", score: 6 },
            ],
            finalConfidence: 11,
            verificationStatus: "rejected",
            rejectionReasons: [
              "Soft gradient edges typical of cast shadows",
              "Boundary shifts with illumination, not pavement",
              "Insufficient physical deformation evidence",
            ],
          };

  return {
    id,
    location: loc.name,
    latitude: loc.lat,
    longitude: loc.lng,
    damageType: "pothole",
    severity: scenario === "pothole" ? 8.7 : 0,
    areaSqM: scenario === "pothole" ? 1.8 : 0,
    confidence: verification.finalConfidence,
    verificationStatus: verification.verificationStatus,
    roadHierarchy: scenario === "pothole" ? "arterial" : scenario === "manhole" ? "arterial" : "collector",
    trafficLevel: "high",
    floodExposure: flood.exposure,
    criticalInfrastructure: scenario === "pothole" ? "Civil Hospital (1.4 km)" : null,
    sourceFile: file.name,
    sourceKind: file.isVideo ? "video" : "image",
    createdAt: "Just now",
    verification,
  };
}
