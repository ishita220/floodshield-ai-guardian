import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FloodMap, MapMarker } from "@/components/FloodMap";
import { ArrowLeft, ScanSearch, Waves } from "lucide-react";
import {
  DAMAGE_LABELS,
  EXPOSURE_LABELS,
  HIERARCHY_LABELS,
  PRIORITY_STYLES,
  Priority,
  priorityOf,
  riskScore,
} from "@/lib/roadData";
import { useRoadIncidents } from "@/lib/roadStore";

export const Route = createFileRoute("/roads/map")({
  head: () => ({
    meta: [
      { title: "Road Risk Map — FloodShield AI" },
      {
        name: "description",
        content:
          "Map of verified road defects across the city, colour-coded by calculated repair risk from severity, road hierarchy, traffic and monsoon exposure.",
      },
      { property: "og:title", content: "Road Risk Map — FloodShield AI" },
      { property: "og:description", content: "Every verified defect, ranked and mapped by repair risk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppLayout>
      <RoadRiskMap />
    </AppLayout>
  ),
});

const MARKER_COLOR: Record<Priority, string> = {
  critical: "#ef4444",
  high: "#f97316",
  normal: "#eab308",
  low: "#22c55e",
};

function RoadRiskMap() {
  const incidents = useRoadIncidents();
  const [selected, setSelected] = useState<string | null>(null);
  const [flood, setFlood] = useState(false);

  const verified = useMemo(
    () => incidents.filter((i) => i.verificationStatus === "verified").map((i) => ({ i, score: riskScore(i) })),
    [incidents],
  );

  const markers: MapMarker[] = verified.map(({ i, score }) => ({
    id: i.id,
    position: [i.latitude, i.longitude] as [number, number],
    color: MARKER_COLOR[priorityOf(score)],
    label: `${DAMAGE_LABELS[i.damageType]} · ${i.location}`,
    sub: `Risk ${score} · severity ${i.severity.toFixed(1)}`,
  }));

  const active = verified.find(({ i }) => i.id === selected) ?? null;

  return (
    <div className="px-5 pt-2 pb-6 space-y-4">
      <header className="flex items-center gap-3">
        <Link to="/roads" className="h-9 w-9 rounded-xl glass flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Road Risk Map</h1>
          <p className="text-[11px] text-muted-foreground">Verified defects colour-coded by repair risk</p>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setFlood((v) => !v)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium border flex items-center gap-1.5 ${
            flood ? "gradient-neon text-neon-foreground border-transparent" : "glass text-muted-foreground"
          }`}
        >
          <Waves className="h-3 w-3" /> Monsoon context layer
        </button>
      </div>

      <FloodMap
        height={330}
        center={[28.4595, 77.0266]}
        zoom={11}
        showZones={flood}
        markers={markers}
        onMarkerClick={setSelected}
      />

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        {(["critical", "high", "normal", "low"] as Priority[]).map((p) => (
          <span key={p} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: MARKER_COLOR[p] }} />
            {p === "normal" ? "Moderate" : p[0].toUpperCase() + p.slice(1)}
          </span>
        ))}
      </div>

      {active ? (
        <section className="glass-strong rounded-2xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{DAMAGE_LABELS[active.i.damageType]} · {active.i.location}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{active.i.sourceFile}</p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${PRIORITY_STYLES[priorityOf(active.score)]}`}
            >
              {priorityOf(active.score)}
            </span>
          </div>
          {[
            ["Severity", `${active.i.severity.toFixed(1)} / 10`],
            ["Confidence", `${active.i.confidence}%`],
            ["Road", HIERARCHY_LABELS[active.i.roadHierarchy]],
            ["Traffic", EXPOSURE_LABELS[active.i.trafficLevel]],
            ["Monsoon exposure", EXPOSURE_LABELS[active.i.floodExposure]],
            ["Risk score", `${active.score} / 100`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{k}</span>
              <span className="text-[11px] font-semibold">{v}</span>
            </div>
          ))}
          <Link
            to="/roads/verify"
            className="mt-2 w-full gradient-neon text-neon-foreground shadow-neon rounded-2xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ScanSearch className="h-3.5 w-3.5" /> View verification
          </Link>
        </section>
      ) : (
        <p className="text-[11px] text-muted-foreground text-center">Tap a marker to inspect a defect.</p>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">All mapped defects</h2>
        {verified
          .sort((a, b) => b.score - a.score)
          .map(({ i, score }) => (
            <button
              key={i.id}
              onClick={() => setSelected(i.id)}
              className={`w-full text-left glass rounded-2xl p-3 flex items-center gap-3 ${
                selected === i.id ? "border-primary/50" : ""
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: MARKER_COLOR[priorityOf(score)] }} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate">{i.location}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {DAMAGE_LABELS[i.damageType]} · {HIERARCHY_LABELS[i.roadHierarchy]}
                </span>
              </span>
              <span className="text-sm font-bold font-display">{score}</span>
            </button>
          ))}
      </section>
    </div>
  );
}
