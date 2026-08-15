import type { RiskLevel } from "@/lib/mockData";

export type TravelMode = "walk" | "bike" | "car";

/**
 * Water-depth risk bands per travel mode, in centimetres.
 * Tune these values as real-world data comes in — nothing else hardcodes depths.
 */
export const MODE_DEPTH_THRESHOLDS: Record<TravelMode, { safeMaxCm: number; moderateMaxCm: number }> = {
  walk: { safeMaxCm: 5, moderateMaxCm: 15 },
  bike: { safeMaxCm: 15, moderateMaxCm: 30 },
  car: { safeMaxCm: 30, moderateMaxCm: 50 },
};

export const DEFAULT_TRAVEL_MODE: TravelMode = "car";

export const TRAVEL_MODES: { id: TravelMode; label: string; short: string }[] = [
  { id: "walk", label: "Walking", short: "walking" },
  { id: "bike", label: "Two-Wheeler", short: "two-wheeler" },
  { id: "car", label: "Car", short: "car" },
];

/** Fallback depth estimate (cm) for legacy records that only carry a risk label. */
export const LABEL_DEPTH_MIDPOINTS: Record<RiskLevel, number> = {
  low: 4,
  moderate: 22,
  severe: 55,
};

export function estimateDepthCm(input: { depthCm?: number | null; level: RiskLevel }): number {
  return typeof input.depthCm === "number" ? input.depthCm : LABEL_DEPTH_MIDPOINTS[input.level];
}

/** Classify a water depth into a risk level for a given travel mode. */
export function classifyDepth(depthCm: number, mode: TravelMode): RiskLevel {
  const t = MODE_DEPTH_THRESHOLDS[mode];
  if (depthCm <= t.safeMaxCm) return "low";
  if (depthCm <= t.moderateMaxCm) return "moderate";
  return "severe";
}

export function modeLabel(mode: TravelMode) {
  return TRAVEL_MODES.find((m) => m.id === mode)?.label ?? "Car";
}

export function modeShort(mode: TravelMode) {
  return TRAVEL_MODES.find((m) => m.id === mode)?.short ?? "car";
}
