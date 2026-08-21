import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { FloodMap, LegendDot } from "@/components/FloodMap";
import { RiskBadge } from "@/components/RiskBadge";
import { alerts, cities, liveWeather, rainfallTrend, riskZones } from "@/lib/mockData";
import { AlertTriangle, ChevronRight, CloudRain, Droplets, Gauge, MapPin, Radio, ShieldAlert, Siren, Wind } from "lucide-react";
import { useState } from "react";
import { useRoadIncidents } from "@/lib/roadStore";
import { riskScore } from "@/lib/roadData";

export const Route = createFileRoute("/")({
  component: () => (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  ),
});

function Dashboard() {
  const [city, setCity] = useState(cities[1]);
  const roadIncidents = useRoadIncidents();
  const priorityIncidents = roadIncidents.filter(
    (i) => i.verificationStatus === "verified" && riskScore(i) >= 65,
  ).length;

  return (
    <div className="px-5 pb-6 pt-2 space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">FloodShield AI</p>
          <h1 className="text-2xl font-bold mt-0.5">Good morning, Runtime Terror</h1>
        </div>
        <div className="h-11 w-11 rounded-2xl glass flex items-center justify-center relative">
          <Radio className="h-5 w-5 text-primary" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-safe pulse-ring" />
        </div>
      </header>

      {/* City selector */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
        {cities.map((c) => {
          const active = c.id === city.id;
          return (
            <button
              key={c.id}
              onClick={() => setCity(c)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${active ? "gradient-neon text-neon-foreground border-transparent shadow-neon" : "glass text-muted-foreground"}`}
            >
              <MapPin className="inline h-3 w-3 mr-1 -mt-0.5" />
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Emergency banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-4 gradient-danger shadow-danger"
      >
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="flex items-start gap-3 relative">
          <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Siren className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-white/80 font-semibold">Active alert · {city.name}</p>
            <p className="text-white font-semibold mt-0.5 leading-snug">Severe waterlogging detected near IFFCO Chowk</p>
            <p className="text-white/80 text-xs mt-1">Multiple roads impacted · Avoid underpasses</p>
          </div>
        </div>
      </motion.div>

      {/* Weather grid */}
      <section className="glass rounded-2xl p-4 shadow-glass">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Live conditions</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-4xl font-bold font-display">{liveWeather.temp}°</span>
              <span className="text-sm text-muted-foreground mb-1.5">{liveWeather.condition}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Source: {liveWeather.source} · {liveWeather.updated}</p>
          </div>
          <div className="h-16 w-16 rounded-2xl gradient-neon flex items-center justify-center shadow-neon">
            <CloudRain className="h-8 w-8 text-neon-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { icon: Droplets, label: "Rain", value: `${liveWeather.rainfall}mm` },
            { icon: Wind, label: "Wind", value: `${liveWeather.wind}km/h` },
            { icon: Gauge, label: "Press.", value: `${liveWeather.pressure}` },
            { icon: ShieldAlert, label: "Visib.", value: `${liveWeather.visibility}km` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-secondary/60 p-2.5 text-center">
              <s.icon className="h-4 w-4 mx-auto text-primary" />
              <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
              <p className="text-xs font-semibold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Rainfall mini chart */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>Rainfall intensity · last 12h</span>
            <span className="text-warning font-medium">Peak {Math.max(...rainfallTrend)}mm</span>
          </div>
          <div className="flex items-end gap-1 h-16">
            {rainfallTrend.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-md gradient-neon opacity-80" style={{ height: `${(v / 40) * 100}%` }} />
            ))}
          </div>
        </div>
      </section>

      {/* Risk index */}
      <section className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">AI Flood Risk Index</p>
            <p className="text-xl font-bold mt-0.5">High <span className="text-danger">7.8</span><span className="text-muted-foreground text-sm">/10</span></p>
          </div>
          <RiskBadge level="severe" />
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ duration: 1.1, ease: "easeOut" }} className="h-full gradient-danger" />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
          <span>Safe</span><span>Moderate</span><span>Severe</span>
        </div>
      </section>

      {/* Urban risk overview — flood + road */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Urban risk overview</h2>
          <Link to="/roads" className="text-xs text-primary flex items-center gap-0.5">
            Road Intelligence <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Link to="/map" className="glass rounded-2xl p-3">
            <p className="text-lg">🌊</p>
            <p className="text-[10px] text-muted-foreground mt-1">Flood risk</p>
            <p className="text-sm font-bold text-danger">HIGH</p>
          </Link>
          <Link to="/roads" className="glass rounded-2xl p-3">
            <p className="text-lg">🛣️</p>
            <p className="text-[10px] text-muted-foreground mt-1">Road risk</p>
            <p className="text-sm font-bold text-danger">CRITICAL</p>
          </Link>
          <Link to="/roads/queue" className="glass rounded-2xl p-3">
            <p className="text-lg">🚨</p>
            <p className="text-[10px] text-muted-foreground mt-1">Priority incidents</p>
            <p className="text-sm font-bold">{priorityIncidents}</p>
          </Link>
        </div>
      </section>

      {/* Map preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Flood risk map</h2>
          <Link to="/map" className="text-xs text-primary flex items-center gap-0.5">Open <ChevronRight className="h-3 w-3" /></Link>
        </div>
        <FloodMap height={200} center={city.coords} zoom={12} interactive={false} />
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><LegendDot level="low" /> Low</span>
          <span className="flex items-center gap-1.5"><LegendDot level="moderate" /> Moderate</span>
          <span className="flex items-center gap-1.5"><LegendDot level="severe" /> Severe</span>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Intelligent alerts</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{alerts.length} active</span>
        </div>
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="glass rounded-2xl p-3.5 flex items-start gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${a.level === "severe" ? "bg-danger/20 text-danger" : a.level === "moderate" ? "bg-warning/20 text-warning" : "bg-safe/20 text-safe"}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{a.source} · {a.time}</p>
              </div>
              <RiskBadge level={a.level} />
            </div>
          ))}
        </div>
      </section>

      {/* SOS quick action */}
      <Link to="/sos" className="block">
        <div className="glass-strong rounded-2xl p-4 flex items-center gap-4 border-danger/40">
          <div className="h-12 w-12 rounded-2xl gradient-danger flex items-center justify-center shadow-danger pulse-ring">
            <Siren className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Emergency Assistance</p>
            <p className="text-xs text-muted-foreground">SOS · shelters · offline maps</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>

      <p className="text-center text-[10px] text-muted-foreground pt-2">
        Powered by IMD · OpenWeatherMap · Weather.com · community reports
      </p>
    </div>
  );
}
