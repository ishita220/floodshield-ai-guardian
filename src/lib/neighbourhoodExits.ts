import type { TravelMode } from "@/lib/travelModes";
import { classifyDepth } from "@/lib/travelModes";

export type ExitStatus = "open" | "risky" | "cut-off";

export type NeighbourhoodExit = {
  id: string;
  road: string;
  depthCm: number;
  confidence: number;
  confirmedMinutesAgo: number;
  reports: number;
  coords: [number, number];
  radius: number;
};

export type Neighbourhood = {
  id: "sector-29" | "palam-vihar" | "golf-course-road" | "sector-14";
  name: string;
  exits: NeighbourhoodExit[];
};

export const neighbourhoods: Neighbourhood[] = [
  {
    id: "sector-29",
    name: "Sector 29",
    exits: [
      { id: "iffco", road: "IFFCO Chowk Underpass", depthCm: 62, confidence: 96, confirmedMinutesAgo: 3, reports: 14, coords: [28.4733, 77.0726], radius: 700 },
      { id: "hero-honda", road: "Hero Honda Chowk", depthCm: 70, confidence: 98, confirmedMinutesAgo: 5, reports: 21, coords: [28.4221, 76.9926], radius: 800 },
      { id: "mg-road", road: "MG Road Metro", depthCm: 28, confidence: 89, confirmedMinutesAgo: 8, reports: 5, coords: [28.4796, 77.0805], radius: 500 },
      { id: "golf-course", road: "Golf Course Road", depthCm: 4, confidence: 93, confirmedMinutesAgo: 2, reports: 1, coords: [28.4419, 77.0954], radius: 450 },
    ],
  },
  {
    id: "palam-vihar",
    name: "Palam Vihar",
    exits: [
      { id: "rezang-la", road: "Rezang La Marg", depthCm: 58, confidence: 91, confirmedMinutesAgo: 6, reports: 9, coords: [28.5107, 76.9957], radius: 520 },
      { id: "bajghera", road: "Bajghera Road", depthCm: 66, confidence: 94, confirmedMinutesAgo: 4, reports: 12, coords: [28.5019, 76.9807], radius: 560 },
      { id: "old-delhi", road: "Old Delhi–Gurugram Road", depthCm: 55, confidence: 88, confirmedMinutesAgo: 11, reports: 7, coords: [28.5165, 77.0234], radius: 520 },
    ],
  },
  {
    id: "golf-course-road",
    name: "Golf Course Road area",
    exits: [
      { id: "gcr-main", road: "Golf Course Road", depthCm: 4, confidence: 93, confirmedMinutesAgo: 2, reports: 1, coords: [28.4419, 77.0954], radius: 450 },
      { id: "cyber-hub", road: "Cyber Hub Junction", depthCm: 24, confidence: 90, confirmedMinutesAgo: 7, reports: 6, coords: [28.4949, 77.0894], radius: 600 },
      { id: "sector-42", road: "Sector 42 Link Road", depthCm: 12, confidence: 84, confirmedMinutesAgo: 13, reports: 2, coords: [28.455, 77.1058], radius: 380 },
    ],
  },
  {
    id: "sector-14",
    name: "Sector 14",
    exits: [
      { id: "sohna-service", road: "Sohna Road service lane", depthCm: 40, confidence: 87, confirmedMinutesAgo: 9, reports: 8, coords: [28.4397, 77.0392], radius: 500 },
      { id: "old-jaipur", road: "Old Jaipur Road", depthCm: 16, confidence: 86, confirmedMinutesAgo: 12, reports: 3, coords: [28.4738, 77.037], radius: 420 },
      { id: "atul-kataria", road: "Atul Kataria Chowk", depthCm: 8, confidence: 92, confirmedMinutesAgo: 5, reports: 2, coords: [28.4809, 77.0203], radius: 400 },
    ],
  },
];

export function exitStatus(depthCm: number, mode: TravelMode): ExitStatus {
  const level = classifyDepth(depthCm, mode);
  return level === "low" ? "open" : level === "moderate" ? "risky" : "cut-off";
}

export function exitSummary(neighbourhood: Neighbourhood, mode: TravelMode) {
  const assessed = neighbourhood.exits.map((exit) => ({ ...exit, status: exitStatus(exit.depthCm, mode) }));
  const rank: Record<ExitStatus, number> = { open: 0, risky: 1, "cut-off": 2 };
  assessed.sort((a, b) => rank[a.status] - rank[b.status] || a.depthCm - b.depthCm);
  const open = assessed.filter((exit) => exit.status === "open");
  const cutOff = assessed.filter((exit) => exit.status === "cut-off");
  return { exits: assessed, open, cutOff, best: open[0] ?? null, isolated: cutOff.length === assessed.length };
}

export function allExitZones(mode: TravelMode) {
  const unique = new Map<string, NeighbourhoodExit>();
  neighbourhoods.flatMap((n) => n.exits).forEach((exit) => unique.set(exit.id, exit));
  return [...unique.values()].map((exit) => ({ ...exit, status: exitStatus(exit.depthCm, mode) }));
}