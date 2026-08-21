import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FloodMap } from "@/components/FloodMap";
import { ArrowLeft, Info, Navigation, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/roads/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Route Health — FloodShield AI" },
      {
        name: "description",
        content:
          "Compare emergency routes using both flood risk and verified road-damage conditions to pick the safest corridor.",
      },
      { property: "og:title", content: "Emergency Route Health — FloodShield AI" },
      {
        property: "og:description",
        content: "Flood risk plus road damage combined into an emergency route recommendation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppLayout>
      <EmergencyRouteHealth />
    </AppLayout>
  ),
});

const ORIGINS = ["IFFCO Chowk", "Cyber Hub", "Sector 29", "MG Road Metro"];
const DESTINATIONS = ["Civil Hospital", "Medanta Medicity", "Sector 14 Shelter", "Railway Station"];

interface DemoRoute {
  id: string;
  label: string;
  via: string;
  time: string;
  floodRisk: "high" | "moderate" | "low";
  roadDamage: "severe" | "moderate" | "good";
  status: "avoid" | "caution" | "recommended";
}

const ROUTES: DemoRoute[] = [
  {
    id: "A",
    label: "Route A",
    via: "NH-48 → IFFCO underpass",
    time: "18 min",
    floodRisk: "high",
    roadDamage: "severe",
    status: "avoid",
  },
  {
    id: "B",
    label: "Route B",
    via: "Golf Course Rd → Sector 54",
    time: "24 min",
    floodRisk: "moderate",
    roadDamage: "good",
    status: "recommended",
  },
  {
    id: "C",
    label: "Route C",
    via: "Sohna Rd → Sector 48",
    time: "27 min",
    floodRisk: "moderate",
    roadDamage: "moderate",
    status: "caution",
  },
];

const dot = { high: "🔴", moderate: "🟡", low: "🟢", severe: "🔴", good: "🟢", avoid: "🔴", caution: "🟡", recommended: "🟢" } as const;

function EmergencyRouteHealth() {
  const [origin, setOrigin] = useState(ORIGINS[0]);
  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const recommended = ROUTES.find((r) => r.status === "recommended")!;

  return (
    <div className="px-5 pt-2 pb-6 space-y-4">
      <header className="flex items-center gap-3">
        <Link to="/roads" className="h-9 w-9 rounded-xl glass flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Emergency Route Health</h1>
          <p className="text-[11px] text-muted-foreground">Flood conditions + verified road damage</p>
        </div>
      </header>

      <div className="glass rounded-2xl p-3.5 space-y-2.5">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Origin</span>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full mt-1 bg-secondary/60 rounded-xl px-3 py-2.5 text-sm outline-none"
          >
            {ORIGINS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Destination</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full mt-1 bg-secondary/60 rounded-xl px-3 py-2.5 text-sm outline-none"
          >
            {DESTINATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      <FloodMap height={180} center={[28.4733, 77.0726]} zoom={12} interactive={false} />

      <div className="space-y-2">
        {ROUTES.map((r) => (
          <div
            key={r.id}
            className={`glass rounded-2xl p-3.5 ${
              r.status === "recommended" ? "border-safe/40" : r.status === "avoid" ? "border-danger/40" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{r.label}</p>
              <span className="text-[11px] text-muted-foreground">{r.time}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">via {r.via}</p>
            <div className="mt-2 space-y-1 text-[11px]">
              <p>{dot[r.floodRisk]} Flood risk: {r.floodRisk}</p>
              <p>{dot[r.roadDamage]} Road damage: {r.roadDamage}</p>
              <p className="font-semibold">
                {dot[r.status]} Status: {r.status === "avoid" ? "Avoid" : r.status === "caution" ? "Use with caution" : "Recommended"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-strong rounded-2xl p-4 border-safe/40">
        <p className="text-sm font-bold text-safe">🟢 RECOMMENDED EMERGENCY ROUTE</p>
        <p className="text-sm font-semibold mt-1.5">
          {recommended.label} · {origin} → {destination}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
          Chosen because it avoids both the high flood-risk corridor and the arterial segments carrying verified severe
          road damage, even though it costs a few extra minutes.
        </p>
        <div className="flex gap-2 mt-3">
          <Link
            to="/routes"
            className="flex-1 gradient-neon text-neon-foreground shadow-neon rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Navigation className="h-3.5 w-3.5" /> Open safe navigation
          </Link>
          <Link
            to="/roads/queue"
            className="flex-1 glass rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Repair queue
          </Link>
        </div>
      </div>

      <div className="glass rounded-xl p-2.5 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] leading-snug text-muted-foreground">
          Prototype/demo visualization. Route options and their damage ratings are illustrative; live turn-by-turn
          routing with real Google data lives on the Route screen.
        </p>
      </div>
    </div>
  );
}
