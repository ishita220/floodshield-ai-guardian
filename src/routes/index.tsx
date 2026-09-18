import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { FloodMap, MapMarker } from "@/components/FloodMap";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Construction,
  ListOrdered,
  MapPin,
  ScanSearch,
  ShieldCheck,
  Signpost,
} from "lucide-react";
import { useMemo } from "react";
import { useRoadIncidents } from "@/lib/roadStore";
import {
  DAMAGE_LABELS,
  HIERARCHY_LABELS,
  PRIORITY_STYLES,
  Priority,
  cityStats,
  priorityOf,
  riskScore,
} from "@/lib/roadData";
import { liveWeather } from "@/lib/mockData";
import { exitSummary, neighbourhoods } from "@/lib/neighbourhoodExits";
import { DEFAULT_TRAVEL_MODE } from "@/lib/travelModes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FloodShield AI — Road Damage Detection & Repair Prioritization" },
      {
        name: "description",
        content:
          "Municipal road intelligence: detect, verify and score pothole damage, then rank repairs by real danger using road hierarchy, traffic and monsoon exposure.",
      },
      { property: "og:title", content: "FloodShield AI — Road Damage Detection & Repair Prioritization" },
      {
        property: "og:description",
        content: "FloodShield verifies road defects, understands their context, and tells cities what to repair first.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppLayout>
      <Overview />
    </AppLayout>
  ),
});

const MARKER_COLOR: Record<Priority, string> = {
  critical: "#ef4444",
  high: "#f97316",
  normal: "#eab308",
  low: "#22c55e",
};

function Overview() {
  const incidents = useRoadIncidents();
  const stats = cityStats(incidents);
  const homeExits = exitSummary(neighbourhoods[0], DEFAULT_TRAVEL_MODE);

  const ranked = useMemo(
    () =>
      incidents
        .filter((i) => i.verificationStatus === "verified")
        .map((i) => ({ i, score: riskScore(i) }))
        .sort((a, b) => b.score - a.score),
    [incidents],
  );

  const markers: MapMarker[] = ranked.map(({ i, score }) => ({
    id: i.id,
    position: [i.latitude, i.longitude] as [number, number],
    color: MARKER_COLOR[priorityOf(score)],
    label: i.location,
    sub: `Risk ${score}`,
  }));

  const monsoonBoosted = ranked.filter(({ i }) => i.floodExposure === "high").length;
  const avgSeverity = ranked.length
    ? (ranked.reduce((a, r) => a + r.i.severity, 0) / ranked.length).toFixed(1)
    : "0.0";

  const cards = [
    { icon: "🛣️", label: "Road defects", value: stats.defects, sub: "detected", tone: "text-foreground" },
    { icon: "🔴", label: "Critical", value: stats.critical, sub: "require urgent repair", tone: "text-danger" },
    { icon: "🟠", label: "High priority", value: stats.high, sub: "scheduled soon", tone: "text-warning" },
    { icon: "✓", label: "Verified", value: stats.verified, sub: "passed AI checks", tone: "text-safe" },
  ];

  return (
    <div className="px-5 pb-6 pt-2 space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">FloodShield AI</p>
          <h1 className="text-xl font-bold mt-0.5 leading-tight">Good morning</h1>
          <p className="text-[11px] text-muted-foreground mt-1">Gurugram · live neighbourhood safety</p>
        </div>
        <div className="h-11 w-11 rounded-2xl glass flex items-center justify-center relative shrink-0">
          <Construction className="h-5 w-5 text-primary" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-safe pulse-ring" />
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl border-primary/30 overflow-hidden"
      >
        <Link to="/exits" className="block p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.15em] text-primary">Your neighbourhood · Sector 29</p>
            <Signpost className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2">{homeExits.cutOff.length} of {homeExits.exits.length} exits cut off</p>
          <p className="text-sm mt-2">Best way out: <span className="font-semibold text-safe">{homeExits.best?.road}</span></p>
          <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">Check every exit <ChevronRight className="h-3 w-3" /></p>
        </Link>
      </motion.div>

      {/* Road summary cards */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Road Intelligence</h2>
          <Link to="/roads" className="text-[11px] text-primary flex items-center gap-0.5">
            Open <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cards.map((c) => (
            <div key={c.label} className="glass rounded-2xl p-3.5">
              <p className="text-base leading-none">{c.icon}</p>
              <p className={`text-2xl font-bold font-display mt-2 ${c.tone}`}>{c.value}</p>
              <p className="text-[11px] font-medium">{c.label}</p>
              <p className="text-[10px] text-muted-foreground">{c.sub}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Demo dataset — simulated municipal survey backlog plus defects analysed in this session.
        </p>
      </section>

      {/* Primary actions */}
      <div className="space-y-2">
        <Link
          to="/roads/verify"
          className="w-full gradient-neon text-neon-foreground shadow-neon rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Camera className="h-4 w-4" /> Analyze Road Video
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/roads/verify" className="glass rounded-2xl py-3 text-xs font-semibold flex items-center justify-center gap-1.5">
            <ScanSearch className="h-3.5 w-3.5 text-primary" /> AI Verification
          </Link>
          <Link to="/roads/queue" className="glass rounded-2xl py-3 text-xs font-semibold flex items-center justify-center gap-1.5">
            <ListOrdered className="h-3.5 w-3.5 text-primary" /> Repair Queue
          </Link>
        </div>
      </div>

      {/* Priority repair queue — top 5 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Priority repair queue</h2>
          <Link to="/roads/queue" className="text-xs text-primary flex items-center gap-0.5">
            All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="glass rounded-2xl divide-y divide-border overflow-hidden">
          {ranked.slice(0, 5).map(({ i, score }, idx) => {
            const p = priorityOf(score);
            return (
              <Link
                key={i.id}
                to="/roads/queue"
                className="flex items-center gap-3 px-3.5 py-3"
              >
                <span
                  className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    idx === 0 ? "gradient-danger text-white shadow-danger" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{i.location}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {DAMAGE_LABELS[i.damageType]} · severity {i.severity.toFixed(1)} · {HIERARCHY_LABELS[i.roadHierarchy]}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-base font-bold font-display leading-none">{score}</span>
                  <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${PRIORITY_STYLES[p]}`}>
                    {p}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Road risk map */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Road risk map</h2>
          <Link to="/roads/map" className="text-xs text-primary flex items-center gap-0.5">
            Open <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <FloodMap height={190} center={[28.4595, 77.0266]} zoom={11} showZones={false} markers={markers} interactive={false} />
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {(["critical", "high", "normal", "low"] as Priority[]).map((p) => (
            <span key={p} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: MARKER_COLOR[p] }} />
              {p === "normal" ? "Moderate" : p[0].toUpperCase() + p.slice(1)}
            </span>
          ))}
        </div>
      </section>

      {/* Severity statistics */}
      <section className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Road severity statistics</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Avg severity", value: `${avgSeverity}/10`, icon: AlertTriangle },
            { label: "Verified rate", value: `${Math.round((stats.verified / Math.max(1, stats.defects)) * 100)}%`, icon: CheckCircle2 },
            { label: "Rejected FPs", value: stats.rejected, icon: ShieldCheck },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-secondary/60 p-2.5 text-center">
              <s.icon className="h-4 w-4 mx-auto text-primary" />
              <p className="text-sm font-semibold mt-1">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        {(["arterial", "collector", "residential"] as const).map((h) => {
          const rows = ranked.filter(({ i }) => i.roadHierarchy === h);
          const pct = Math.round((rows.length / Math.max(1, ranked.length)) * 100);
          return (
            <div key={h}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{HIERARCHY_LABELS[h]} roads</span>
                <span className="font-semibold">{rows.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                <div className="h-full gradient-neon" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Monsoon context — supporting factor */}
      <section className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">🌧️ Flood &amp; monsoon context</h2>
          </div>
          <Link to="/map" className="text-[11px] text-primary flex items-center gap-0.5">
            Open <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
          {monsoonBoosted} verified defect{monsoonBoosted === 1 ? "" : "s"} sit inside high monsoon-exposure zones, which
          raises their repair risk score. Live conditions: {liveWeather.temp}° · {liveWeather.condition} ·{" "}
          {liveWeather.rainfall}mm rain.
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          Monsoon exposure is one contextual input to the road risk score — not the primary output.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Link to="/map" className="glass rounded-xl py-2.5 text-[11px] font-semibold flex items-center justify-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Monsoon map
          </Link>
          <Link to="/roads/emergency" className="glass rounded-xl py-2.5 text-[11px] font-semibold flex items-center justify-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-primary" /> Route health
          </Link>
        </div>
      </section>

      <p className="text-center text-[10px] text-muted-foreground pt-2">
        Prototype: rule-based verification &amp; scoring · flood context from IMD / OpenWeatherMap demo feeds
      </p>
    </div>
  );
}
