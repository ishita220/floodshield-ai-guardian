import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { FloodMap } from "@/components/FloodMap";
import { RiskBadge } from "@/components/RiskBadge";
import { safeRoutes } from "@/lib/mockData";
import { ArrowRight, Clock, MapPin, Navigation, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/routes")({
  component: () => (
    <AppLayout>
      <RoutesScreen />
    </AppLayout>
  ),
});

function RoutesScreen() {
  const [from, setFrom] = useState("DLF Cyber City, Gurgaon");
  const [to, setTo] = useState("Connaught Place, Delhi");
  const [selected, setSelected] = useState(safeRoutes[0].id);

  return (
    <div className="px-5 pt-2 pb-6 space-y-4">
      <header>
        <h1 className="text-xl font-bold">Smart Safe Route</h1>
        <p className="text-xs text-muted-foreground">AI-recommended path avoiding waterlogged roads</p>
      </header>

      <div className="glass rounded-2xl p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-secondary/60">
          <span className="h-2 w-2 rounded-full bg-safe" />
          <input value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent flex-1 text-sm outline-none" />
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-secondary/60">
          <span className="h-2 w-2 rounded-full bg-danger" />
          <input value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent flex-1 text-sm outline-none" />
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <FloodMap height={180} center={[28.5, 77.1]} zoom={11} interactive={false} />

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl gradient-neon shadow-neon">
        <Sparkles className="h-4 w-4 text-neon-foreground" />
        <p className="text-xs font-medium text-neon-foreground">
          AI analyzed 14 routes · 3 avoid flood-prone zones
        </p>
      </div>

      <div className="space-y-2">
        {safeRoutes.map((r) => {
          const active = selected === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={`w-full text-left rounded-2xl p-4 transition border ${active ? "glass-strong border-primary/60 shadow-neon" : "glass border-transparent"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{r.label}</p>
                  <RiskBadge level={r.risk} />
                </div>
                <span className="text-base font-bold font-display">{r.time}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">via {r.via}</p>
              <div className="flex items-center justify-between mt-3 text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {r.delay}</span>
                <span className="text-muted-foreground">{r.distance}</span>
              </div>
            </button>
          );
        })}
      </div>

      <button className="w-full rounded-2xl gradient-neon text-neon-foreground font-semibold py-3.5 flex items-center justify-center gap-2 shadow-neon">
        <Navigation className="h-4 w-4" /> Start safe navigation <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
