import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { rainfallTrend, riskZones } from "@/lib/mockData";
import { Activity, Droplets, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/insights")({
  component: () => (
    <AppLayout>
      <Insights />
    </AppLayout>
  ),
});

function Insights() {
  const stats = [
    { icon: Droplets, label: "Avg rainfall", value: "26mm", trend: "+18%", color: "text-primary" },
    { icon: Activity, label: "Active zones", value: "12", trend: "+3", color: "text-warning" },
    { icon: Users, label: "Reports", value: "248", trend: "+82", color: "text-safe" },
    { icon: TrendingUp, label: "Risk score", value: "7.8", trend: "+1.2", color: "text-danger" },
  ];

  const hotspots = [...riskZones].sort((a, b) => b.reports - a.reports).slice(0, 5);

  return (
    <div className="px-5 pt-2 pb-6 space-y-5">
      <header>
        <h1 className="text-xl font-bold">Insights</h1>
        <p className="text-xs text-muted-foreground">Rainfall, hotspots & live disruptions</p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-[10px] text-muted-foreground">{s.trend}</span>
            </div>
            <p className="text-2xl font-bold font-display mt-2">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Rainfall trend · 12h</p>
          <span className="text-[11px] text-warning">↑ rising</span>
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {rainfallTrend.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-t-md ${v > 30 ? "gradient-danger" : v > 20 ? "bg-warning/70" : "gradient-neon"} opacity-90`}
                style={{ height: `${(v / 40) * 100}%` }}
              />
              <span className="text-[9px] text-muted-foreground">{i * 1 + 6}h</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <p className="text-sm font-semibold mb-3">Top flooding hotspots</p>
        <div className="space-y-3">
          {hotspots.map((h, i) => (
            <div key={h.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{h.name}</p>
                  <span className="text-[11px] text-muted-foreground">{h.reports} reports</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary mt-1.5 overflow-hidden">
                  <div
                    className={h.level === "severe" ? "h-full gradient-danger" : h.level === "moderate" ? "h-full bg-warning" : "h-full bg-safe"}
                    style={{ width: `${(h.reports / 21) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <p className="text-sm font-semibold mb-3">Live traffic disruption</p>
        <div className="space-y-2">
          {[
            { road: "NH-48 (Delhi-Gurgaon)", status: "Heavy", color: "danger" },
            { road: "Sohna Road", status: "Moderate", color: "warning" },
            { road: "Golf Course Ext.", status: "Clear", color: "safe" },
            { road: "MG Road", status: "Moderate", color: "warning" },
          ].map((d) => (
            <div key={d.road} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{d.road}</span>
              <span className={`text-xs font-semibold text-${d.color}`} style={{ color: `var(--${d.color})` }}>{d.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
