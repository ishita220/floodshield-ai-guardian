import { riskZones } from "@/lib/mockData";

/**
 * Road Intelligence data model.
 *
 * PROTOTYPE NOTE: every value in this file is either demo data or produced by the
 * transparent rule-based scoring functions below. No trained computer-vision model
 * is connected — see `PRODUCTION_ARCHITECTURE` in this file for what a real
 * deployment would replace.
 */

export type DamageType = "pothole" | "crack" | "rutting" | "edge_break";
export type RoadHierarchy = "arterial" | "collector" | "residential";
export type Exposure = "low" | "medium" | "high";
export type VerificationStatus = "verified" | "rejected" | "pending";
export type Priority = "critical" | "high" | "normal" | "low";

export interface VerificationResults {
  incidentId: string;
  detectionConfidence: number; // 0-100
  geometryResult: string;
  depthResult: string;
  temporalResult: string | null;
  framesVerified: number | null;
  shadowCheck: boolean; // true = shadow characteristics matched
  manholeCheck: boolean; // true = manhole characteristics matched
  patchCheck: boolean;
  deformationDetected: boolean;
  classScores: { label: string; score: number }[];
  finalConfidence: number;
  verificationStatus: VerificationStatus;
  rejectionReasons?: string[];
}

export interface RoadIncident {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  damageType: DamageType;
  severity: number; // 0-10
  areaSqM: number;
  confidence: number; // 0-100
  verificationStatus: VerificationStatus;
  roadHierarchy: RoadHierarchy;
  trafficLevel: Exposure;
  floodExposure: Exposure;
  criticalInfrastructure: string | null;
  sourceFile: string;
  sourceKind: "image" | "video" | "demo";
  createdAt: string;
  verification: VerificationResults;
}

export const DAMAGE_LABELS: Record<DamageType, string> = {
  pothole: "Pothole",
  crack: "Crack",
  rutting: "Rutting",
  edge_break: "Edge break",
};

export const HIERARCHY_LABELS: Record<RoadHierarchy, string> = {
  arterial: "Arterial",
  collector: "Collector",
  residential: "Residential",
};

export const EXPOSURE_LABELS: Record<Exposure, string> = {
  low: "Low",
  medium: "Moderate",
  high: "High",
};

/* ------------------------------------------------------------------ */
/* Rule-based risk scoring (transparent, tunable — not a trained model) */
/* ------------------------------------------------------------------ */

export const RISK_WEIGHTS = {
  severity: 0.4,
  hierarchy: 0.2,
  traffic: 0.15,
  flood: 0.15,
  infrastructure: 0.1,
};

const HIERARCHY_SCORE: Record<RoadHierarchy, number> = { arterial: 100, collector: 65, residential: 30 };
const EXPOSURE_SCORE: Record<Exposure, number> = { high: 100, medium: 60, low: 25 };

export interface RiskFactor {
  key: string;
  label: string;
  detail: string;
  score: number; // 0-100 normalised
  weight: number;
}

export function riskFactors(i: RoadIncident): RiskFactor[] {
  return [
    {
      key: "severity",
      label: "Physical damage severity",
      detail: `${i.severity.toFixed(1)}/10`,
      score: i.severity * 10,
      weight: RISK_WEIGHTS.severity,
    },
    {
      key: "hierarchy",
      label: "Road importance",
      detail: i.roadHierarchy === "arterial" ? "Very High" : i.roadHierarchy === "collector" ? "Medium" : "Low",
      score: HIERARCHY_SCORE[i.roadHierarchy],
      weight: RISK_WEIGHTS.hierarchy,
    },
    {
      key: "traffic",
      label: "Traffic exposure",
      detail: EXPOSURE_LABELS[i.trafficLevel],
      score: EXPOSURE_SCORE[i.trafficLevel],
      weight: RISK_WEIGHTS.traffic,
    },
    {
      key: "flood",
      label: "Flood exposure (FloodShield)",
      detail: EXPOSURE_LABELS[i.floodExposure],
      score: EXPOSURE_SCORE[i.floodExposure],
      weight: RISK_WEIGHTS.flood,
    },
    {
      key: "infra",
      label: "Critical infrastructure proximity",
      detail: i.criticalInfrastructure ?? "None nearby",
      score: i.criticalInfrastructure ? 90 : 20,
      weight: RISK_WEIGHTS.infrastructure,
    },
  ];
}

export function riskScore(i: RoadIncident): number {
  if (i.verificationStatus !== "verified") return 0;
  const total = riskFactors(i).reduce((acc, f) => acc + f.score * f.weight, 0);
  return Math.min(100, Math.round(total));
}

export function priorityOf(score: number): Priority {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "normal";
  return "low";
}

export const PRIORITY_STYLES: Record<Priority, string> = {
  critical: "bg-danger/15 text-danger border-danger/40",
  high: "bg-warning/15 text-warning border-warning/40",
  normal: "bg-primary/15 text-primary border-primary/40",
  low: "bg-safe/15 text-safe border-safe/40",
};

/** Combined flood + road narrative used by the "Combined urban risk" card. */
export function combinedUrbanRisk(i: RoadIncident) {
  const score = riskScore(i);
  const floodHigh = i.floodExposure === "high";
  const level: Priority = floodHigh && score >= 75 ? "critical" : priorityOf(score);
  const reason = floodHigh
    ? `The damaged ${HIERARCHY_LABELS[i.roadHierarchy].toLowerCase()} road sits inside a monitored FloodShield risk zone. During waterlogging the defect becomes invisible under standing water and may significantly slow emergency response and evacuation.`
    : `Flood exposure here is ${EXPOSURE_LABELS[i.floodExposure].toLowerCase()}, so the defect is treated mainly on its physical severity and road importance.`;
  return { level, score, reason };
}

/** Nearest FloodShield risk zone → flood exposure for a road defect. */
export function floodExposureAt(lat: number, lng: number): { exposure: Exposure; zone: string | null } {
  let best: { d: number; zone: (typeof riskZones)[number] } | null = null;
  for (const z of riskZones) {
    const d = Math.hypot(z.coords[0] - lat, z.coords[1] - lng) * 111000; // metres approx
    if (!best || d < best.d) best = { d, zone: z };
  }
  if (!best || best.d > 2500) return { exposure: "low", zone: null };
  const level = best.zone.level;
  const exposure: Exposure = level === "severe" ? "high" : level === "moderate" ? "medium" : "low";
  return { exposure, zone: best.zone.name };
}

/* --------------------------- Demo incidents --------------------------- */

function vr(p: Partial<VerificationResults> & { incidentId: string }): VerificationResults {
  return {
    detectionConfidence: 90,
    geometryResult: "Irregular boundary detected",
    depthResult: "Surface depression detected",
    temporalResult: null,
    framesVerified: null,
    shadowCheck: false,
    manholeCheck: false,
    patchCheck: false,
    deformationDetected: true,
    classScores: [
      { label: "Pothole", score: 92 },
      { label: "Manhole", score: 6 },
      { label: "Shadow", score: 3 },
      { label: "Crack", score: 11 },
    ],
    finalConfidence: 92,
    verificationStatus: "verified",
    ...p,
  };
}

export const DEMO_INCIDENTS: RoadIncident[] = [
  {
    id: "ri-1",
    location: "NH-48 near Hero Honda Chowk",
    latitude: 28.4221,
    longitude: 76.9926,
    damageType: "pothole",
    severity: 9.1,
    areaSqM: 2.4,
    confidence: 96,
    verificationStatus: "verified",
    roadHierarchy: "arterial",
    trafficLevel: "high",
    floodExposure: "high",
    criticalInfrastructure: "Civil Hospital (1.1 km)",
    sourceFile: "nh48_dashcam_0714.mp4",
    sourceKind: "video",
    createdAt: "2 h ago",
    verification: vr({ incidentId: "ri-1", detectionConfidence: 96, finalConfidence: 96, temporalResult: "Temporal consistency: 95%", framesVerified: 18 }),
  },
  {
    id: "ri-2",
    location: "MG Road near Metro Pillar 42",
    latitude: 28.4796,
    longitude: 77.0805,
    damageType: "pothole",
    severity: 8.4,
    areaSqM: 1.8,
    confidence: 94,
    verificationStatus: "verified",
    roadHierarchy: "arterial",
    trafficLevel: "high",
    floodExposure: "medium",
    criticalInfrastructure: "MG Road Metro Station",
    sourceFile: "mgroad_patrol_clip.mp4",
    sourceKind: "video",
    createdAt: "5 h ago",
    verification: vr({ incidentId: "ri-2", detectionConfidence: 94, finalConfidence: 94, temporalResult: "Temporal consistency: 93%", framesVerified: 12 }),
  },
  {
    id: "ri-3",
    location: "IFFCO Chowk service lane",
    latitude: 28.4733,
    longitude: 77.0726,
    damageType: "pothole",
    severity: 8.9,
    areaSqM: 2.1,
    confidence: 93,
    verificationStatus: "verified",
    roadHierarchy: "arterial",
    trafficLevel: "high",
    floodExposure: "high",
    criticalInfrastructure: "Bus depot (0.4 km)",
    sourceFile: "iffco_underpass.jpg",
    sourceKind: "image",
    createdAt: "8 h ago",
    verification: vr({ incidentId: "ri-3", detectionConfidence: 93, finalConfidence: 93 }),
  },
  {
    id: "ri-4",
    location: "Sector 29 collector road",
    latitude: 28.4682,
    longitude: 77.0696,
    damageType: "crack",
    severity: 6.8,
    areaSqM: 3.2,
    confidence: 88,
    verificationStatus: "verified",
    roadHierarchy: "collector",
    trafficLevel: "medium",
    floodExposure: "medium",
    criticalInfrastructure: null,
    sourceFile: "sector29_survey.jpg",
    sourceKind: "image",
    createdAt: "1 d ago",
    verification: vr({
      incidentId: "ri-4",
      detectionConfidence: 88,
      finalConfidence: 88,
      geometryResult: "Linear fracture pattern detected",
      depthResult: "Shallow deformation detected",
      classScores: [
        { label: "Crack", score: 88 },
        { label: "Pothole", score: 24 },
        { label: "Manhole", score: 3 },
        { label: "Shadow", score: 5 },
      ],
    }),
  },
  {
    id: "ri-5",
    location: "Palam Vihar residential lane",
    latitude: 28.5062,
    longitude: 77.0334,
    damageType: "crack",
    severity: 4.1,
    areaSqM: 0.9,
    confidence: 82,
    verificationStatus: "verified",
    roadHierarchy: "residential",
    trafficLevel: "low",
    floodExposure: "low",
    criticalInfrastructure: null,
    sourceFile: "palam_lane.jpg",
    sourceKind: "image",
    createdAt: "1 d ago",
    verification: vr({
      incidentId: "ri-5",
      detectionConfidence: 82,
      finalConfidence: 82,
      geometryResult: "Hairline fracture detected",
      depthResult: "Minimal deformation",
      classScores: [
        { label: "Crack", score: 82 },
        { label: "Pothole", score: 12 },
        { label: "Manhole", score: 2 },
        { label: "Shadow", score: 8 },
      ],
    }),
  },
  {
    id: "ri-6",
    location: "Golf Course Road, near Sector 54",
    latitude: 28.4419,
    longitude: 77.0954,
    damageType: "pothole",
    severity: 0,
    areaSqM: 0,
    confidence: 18,
    verificationStatus: "rejected",
    roadHierarchy: "arterial",
    trafficLevel: "high",
    floodExposure: "low",
    criticalInfrastructure: null,
    sourceFile: "golfcourse_clip.mp4",
    sourceKind: "video",
    createdAt: "3 h ago",
    verification: vr({
      incidentId: "ri-6",
      detectionConfidence: 74,
      geometryResult: "Regular circular boundary detected",
      depthResult: "No pavement depression evidence",
      temporalResult: "Temporal consistency: 91% (static circular object)",
      framesVerified: 14,
      manholeCheck: true,
      deformationDetected: false,
      classScores: [
        { label: "Manhole", score: 91 },
        { label: "Pothole", score: 18 },
        { label: "Crack", score: 7 },
        { label: "Shadow", score: 4 },
      ],
      finalConfidence: 18,
      verificationStatus: "rejected",
      rejectionReasons: [
        "Regular geometric boundary",
        "Consistent circular structure",
        "Low evidence of pavement deformation",
        "Strong match with manhole-cover characteristics",
      ],
    }),
  },
  {
    id: "ri-7",
    location: "Cyber Hub approach road",
    latitude: 28.4949,
    longitude: 77.0894,
    damageType: "pothole",
    severity: 0,
    areaSqM: 0,
    confidence: 11,
    verificationStatus: "rejected",
    roadHierarchy: "collector",
    trafficLevel: "high",
    floodExposure: "medium",
    criticalInfrastructure: null,
    sourceFile: "cyberhub_frame.jpg",
    sourceKind: "image",
    createdAt: "6 h ago",
    verification: vr({
      incidentId: "ri-7",
      detectionConfidence: 63,
      geometryResult: "Soft, low-contrast boundary",
      depthResult: "No measurable surface depression",
      temporalResult: null,
      shadowCheck: true,
      deformationDetected: false,
      classScores: [
        { label: "Shadow", score: 88 },
        { label: "Pothole", score: 11 },
        { label: "Manhole", score: 3 },
        { label: "Crack", score: 6 },
      ],
      finalConfidence: 11,
      verificationStatus: "rejected",
      rejectionReasons: [
        "Soft gradient edges typical of cast shadows",
        "Boundary shifts with illumination, not pavement",
        "Insufficient physical deformation evidence",
      ],
    }),
  },
  {
    id: "ri-8",
    location: "Sohna Road, opposite Sector 48",
    latitude: 28.4089,
    longitude: 77.0378,
    damageType: "pothole",
    severity: 7.2,
    areaSqM: 1.3,
    confidence: 0,
    verificationStatus: "pending",
    roadHierarchy: "collector",
    trafficLevel: "medium",
    floodExposure: "medium",
    criticalInfrastructure: null,
    sourceFile: "sohna_upload.mp4",
    sourceKind: "video",
    createdAt: "20 min ago",
    verification: vr({ incidentId: "ri-8", finalConfidence: 0, verificationStatus: "pending" }),
  },
];

/* ------------------- Prototype vs production architecture ------------------- */

export const PROTOTYPE_ARCHITECTURE = [
  "Simulated / rule-based verification pipeline",
  "Demonstration road-damage classifications",
  "Rule-based, fully transparent risk scoring",
  "Demo road hierarchy and flood-exposure data",
  "Flood exposure derived from FloodShield demo risk zones",
];

export const PRODUCTION_ARCHITECTURE = [
  "Real object-detection model (e.g. YOLO/DETR family) on road frames",
  "Instance segmentation for defect boundary extraction",
  "Multi-class classification: pothole / crack / manhole / patch / shadow",
  "Temporal object tracking across consecutive video frames",
  "Monocular depth estimation for pavement deformation",
  "Geospatial road-hierarchy data from municipal GIS layers",
  "Live traffic volume feeds",
  "Real flood and weather feeds (IMD / OpenWeatherMap)",
  "Human verification workflow before ticket dispatch",
];

/* ------------------------- City-wide demo statistics ------------------------- */

/**
 * Demo dataset baseline for the city-wide counters shown on the Overview screen.
 * These represent a simulated municipal survey backlog; incidents analysed in the
 * current session are added on top of them.
 */
export const CITY_BASELINE = {
  defects: 239,
  critical: 29,
  high: 71,
  verified: 186,
};

export function cityStats(incidents: RoadIncident[]) {
  const verified = incidents.filter((i) => i.verificationStatus === "verified");
  let critical = 0;
  let high = 0;
  for (const i of verified) {
    const p = priorityOf(riskScore(i));
    if (p === "critical") critical += 1;
    else if (p === "high") high += 1;
  }
  return {
    defects: CITY_BASELINE.defects + incidents.length,
    critical: CITY_BASELINE.critical + critical,
    high: CITY_BASELINE.high + high,
    verified: CITY_BASELINE.verified + verified.length,
    pending: incidents.filter((i) => i.verificationStatus === "pending").length,
    rejected: incidents.filter((i) => i.verificationStatus === "rejected").length,
  };
}
