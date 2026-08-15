import { riskZones, RiskLevel } from "@/lib/mockData";

/** Decode a Google encoded polyline into [lat, lng] pairs. */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function metersBetween(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type RouteRisk = {
  level: RiskLevel;
  zones: { name: string; level: RiskLevel; area: string; depthCm: number }[];
  score: number;
  maxDepthCm: number;
};

/** Score a decoded path against known flood-risk zones, using the travel mode's depth thresholds. */
export function scoreRoute(path: [number, number][], mode: TravelMode = DEFAULT_TRAVEL_MODE): RouteRisk {
  const sampled = path.filter((_, i) => i % 3 === 0);
  const hit = riskZones.filter((z) => sampled.some((p) => metersBetween(p, z.coords) <= z.radius));
  const weight = { low: 1, moderate: 3, severe: 6 } as const;

  const zones = hit.map((z) => {
    const depthCm = estimateDepthCm(z);
    return { name: z.name, area: z.area, depthCm, level: classifyDepth(depthCm, mode) };
  });

  const score = zones.reduce((sum, z) => sum + weight[z.level], 0);
  const maxDepthCm = zones.reduce((m, z) => Math.max(m, z.depthCm), 0);
  const level: RiskLevel = zones.some((z) => z.level === "severe") ? "severe" : score >= 3 ? "moderate" : "low";
  return { level, score, zones, maxDepthCm };
}


export function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

export function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(1)} km`;
}
