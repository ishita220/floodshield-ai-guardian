import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FloodMap, MapMarker } from "@/components/FloodMap";
import { IncidentRow } from "@/components/road/RoadAnalysis";
import {
  AlertTriangle,
  Camera,
  ImageIcon,
  Info,
  Layers,
  ListOrdered,
  Loader2,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
} from "lucide-react";
import { cityStats, priorityOf, riskScore } from "@/lib/roadData";
import { useRoadIncidents } from "@/lib/roadStore";

export const Route = createFileRoute("/roads/")({
  head: () => ({
    meta: [
      { title: "Road Intelligence — FloodShield AI" },
      {
        name: "description",
        content:
          "Detect and prioritize road damage using computer vision and contextual risk analysis — severity fused with road hierarchy, traffic and monsoon exposure.",
      },
      { property: "og:title", content: "Road Intelligence — FloodShield AI" },
      {
        property: "og:description",
        content: "Verify road defects and rank municipal repairs by danger rather than report order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppLayout>
      <RoadIntelligence />
    </AppLayout>
  ),
});

const MARKER_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  normal: "#eab308",
  low: "#22c55e",
};

function RoadIntelligence() {
  const incidents = useRoadIncidents();
  const stats = cityStats(incidents);

  const markers: MapMarker[] = useMemo(
    () =>
      incidents
        .filter((i) => i.verificationStatus === "verified")
        .map((i) => {
          const score = riskScore(i);
          return {
            id: i.id,
            position: [i.latitude, i.longitude] as [number, number],
            color: MARKER_COLOR[priorityOf(score)],
            label: i.location,
            sub: `Risk ${score}`,
          };
        }),
    [incidents],
  );

  const summary = [
    { label: "Road defects", value: stats.defects, icon: Layers, color: "text-primary" },
    { label: "Verified", value: stats.verified, icon: ShieldCheck, color: "text-safe" },
    { label: "High-risk roads", value: stats.high, icon: AlertTriangle, color: "text-warning" },
    { label: "Pending verification", value: stats.pending, icon: Loader2, color: "text-muted-foreground" },
  ];

  return (
    <div className="px-5 pt-2 pb-6 space-y-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">FloodShield AI</p>
        <h1 className="text-xl font-bold mt-0.5">🛣️ Road Intelligence</h1>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">
          Detect and prioritize road damage using computer vision and contextual risk analysis.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {summary.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3.5">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <p className="text-2xl font-bold font-display mt-2">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Link
          to="/roads/verify"
          className="w-full gradient-neon text-neon-foreground shadow-neon rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Camera className="h-4 w-4" /> + Analyze Road Video
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/roads/verify" className="glass rounded-2xl py-3 text-xs font-semibold flex items-center justify-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-primary" /> Analyze Image
          </Link>
          <Link to="/roads/queue" className="glass rounded-2xl py-3 text-xs font-semibold flex items-center justify-center gap-1.5">
            <ListOrdered className="h-3.5 w-3.5 text-primary" /> Repair Queue
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/roads/map" className="glass rounded-2xl py-3 text-xs font-semibold flex items-center justify-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Risk Map
          </Link>
          <Link to="/roads/emergency" className="glass rounded-2xl py-3 text-xs font-semibold flex items-center justify-center gap-1.5">
            <RouteIcon className="h-3.5 w-3.5 text-primary" /> Route Health
          </Link>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Detected defects</h2>
          <Link to="/roads/map" className="text-[11px] text-primary">Open risk map</Link>
        </div>
        <FloodMap height={200} center={[28.4595, 77.0266]} zoom={11} showZones={false} markers={markers} interactive={false} />
      </section>

      <div className="glass rounded-xl p-2.5 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] leading-snug text-muted-foreground">
          Prototype verification pipeline — defect classification and scoring are simulated and rule-based, not the
          output of a trained computer-vision model.{" "}
          <Link to="/roads/architecture" className="text-primary underline underline-offset-2">
            Prototype vs production architecture
          </Link>
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Recent detections</h2>
        {incidents.slice(0, 5).map((i) => (
          <IncidentRow key={i.id} incident={i} />
        ))}
      </section>
    </div>
  );
}
