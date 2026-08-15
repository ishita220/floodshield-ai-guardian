import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { FloodMap, LegendDot } from "@/components/FloodMap";
import { RiskBadge } from "@/components/RiskBadge";
import { ModeSelector } from "@/components/ModeSelector";
import { useTravelMode } from "@/hooks/useTravelMode";
import { classifyDepth, estimateDepthCm } from "@/lib/travelModes";
import { riskZones } from "@/lib/mockData";
import { Layers, Search, SlidersHorizontal, Siren } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/map")({
  component: () => (
    <AppLayout>
      <MapScreen />
    </AppLayout>
  ),
});

function MapScreen() {
  const [filter, setFilter] = useState<"all" | "low" | "moderate" | "severe">("all");
  const [mode, setMode] = useTravelMode();
  const zones = riskZones.map((z) => {
    const depthCm = estimateDepthCm(z);
    return { ...z, depthCm, level: classifyDepth(depthCm, mode) };
  });
  const filtered = filter === "all" ? zones : zones.filter((z) => z.level === filter);

  return (
    <div className="relative h-full">
      <div className="px-5 pt-2 pb-3">
        <h1 className="text-xl font-bold">Flood Risk Map</h1>
        <p className="text-xs text-muted-foreground">Live AI heatmap · Gurgaon NCR</p>
      </div>

      <div className="px-5 mb-3">
        <ModeSelector mode={mode} onChange={setMode} />
      </div>

      <div className="px-5">
        <div className="glass rounded-2xl p-2 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground ml-2" />
          <input
            placeholder="Search area or road"
            className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
          </button>
        </div>
      </div>

      <div className="px-5 mt-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {(["all", "low", "moderate", "severe"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider border ${filter === f ? "gradient-neon text-neon-foreground border-transparent shadow-neon" : "glass text-muted-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-5 mt-3">
        <FloodMap height={340} center={[28.4595, 77.0266]} zoom={12} mode={mode} />
      </div>

      <div className="px-5 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><LegendDot level="low" /> Low</span>
          <span className="flex items-center gap-1.5"><LegendDot level="moderate" /> Moderate</span>
          <span className="flex items-center gap-1.5"><LegendDot level="severe" /> Severe</span>
        </div>
        <button className="flex items-center gap-1 text-primary"><Layers className="h-3.5 w-3.5" /> Layers</button>
      </div>

      <section className="px-5 mt-5 space-y-2 pb-4">
        <h2 className="text-sm font-semibold">Zones near you</h2>
        {filtered.map((z) => (
          <div key={z.id} className="glass rounded-2xl p-3.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{z.name}</p>
                <RiskBadge level={z.level} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {z.area} · ~{z.depthCm} cm water · Drainage {z.drainage}% · {z.reports} reports
              </p>
            </div>
            <Link to="/sos" className="h-9 w-9 rounded-xl gradient-danger flex items-center justify-center shrink-0">
              <Siren className="h-4 w-4 text-white" />
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
