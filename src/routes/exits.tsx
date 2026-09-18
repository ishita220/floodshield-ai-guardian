import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, Clock3, MapPin, Radio, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ModeSelector } from "@/components/ModeSelector";
import { Button } from "@/components/ui/button";
import { useTravelMode } from "@/hooks/useTravelMode";
import { exitSummary, ExitStatus, neighbourhoods } from "@/lib/neighbourhoodExits";
import { useState } from "react";

export const Route = createFileRoute("/exits")({
  head: () => ({
    meta: [
      { title: "Neighbourhood Exits — FloodShield AI" },
      { name: "description", content: "See which roads out of Gurugram neighbourhoods remain usable during waterlogging." },
      { property: "og:title", content: "Neighbourhood Exits — FloodShield AI" },
      { property: "og:description", content: "Live-style exit status, water depth, confidence, and safer ways out for Gurugram neighbourhoods." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AppLayout><ExitsScreen /></AppLayout>,
});

const statusStyle: Record<ExitStatus, string> = {
  open: "border-safe/40 bg-safe/10 text-safe",
  risky: "border-warning/40 bg-warning/10 text-warning",
  "cut-off": "border-danger/40 bg-danger/10 text-danger",
};

function ExitsScreen() {
  const [neighbourhoodId, setNeighbourhoodId] = useState(neighbourhoods[0].id);
  const [mode, setMode] = useTravelMode();
  const neighbourhood = neighbourhoods.find((item) => item.id === neighbourhoodId) ?? neighbourhoods[0];
  const summary = exitSummary(neighbourhood, mode);

  return (
    <div className="px-5 pb-6 pt-2 space-y-4">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Live exit intelligence</p>
        <h1 className="text-xl font-bold mt-1">Can you still get out?</h1>
        <p className="text-xs text-muted-foreground mt-1">Road usability around your neighbourhood, updated by depth and reports.</p>
      </header>

      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground">Neighbourhood</span>
        <select value={neighbourhoodId} onChange={(event) => setNeighbourhoodId(event.target.value as typeof neighbourhoodId)} className="w-full rounded-xl border border-glass-border bg-secondary px-3 py-3 text-sm outline-none focus:border-primary">
          {neighbourhoods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>

      <ModeSelector mode={mode} onChange={setMode} />

      {summary.isolated && (
        <section className="rounded-2xl border border-danger/50 bg-danger/10 p-4 shadow-danger">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-danger shrink-0" />
            <div>
              <h2 className="font-bold text-danger">This neighbourhood is currently isolated</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Stay put unless you are in danger. Move to a higher floor and keep your phone charged.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button asChild variant="destructive" className="rounded-xl"><Link to="/sos">Call SOS</Link></Button>
            <Button asChild variant="secondary" className="rounded-xl"><Link to="/sos">Nearest shelter</Link></Button>
          </div>
        </section>
      )}

      <section className="glass-strong rounded-2xl p-4 border-primary/30">
        <p className="text-[11px] text-muted-foreground">{neighbourhood.name}</p>
        <p className="text-2xl font-bold mt-1">{summary.cutOff.length} of {summary.exits.length} exits cut off</p>
        <div className="flex items-start gap-2 mt-3 rounded-xl bg-secondary/60 p-3">
          <MapPin className="h-4 w-4 text-safe mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Best way out</p>
            <p className="text-sm font-semibold">{summary.best?.road ?? "No usable exit"}</p>
            {summary.best && <p className="text-[11px] text-muted-foreground">{summary.best.depthCm} cm observed water</p>}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Roads out</h2>
        {summary.exits.map((exit) => (
          <article key={exit.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{exit.road}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">{exit.depthCm} cm water · {exit.confidence}% confidence</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold uppercase ${statusStyle[exit.status]}`}>{exit.status}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />Last confirmed {exit.confirmedMinutesAgo} min ago</span>
              <span className="flex items-center gap-1"><Radio className="h-3 w-3" />{exit.reports} reports</span>
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-2 w-full justify-between rounded-xl text-primary">
              <Link to="/reports" search={{ exit: exit.road }}>Report this exit <ArrowUpRight /></Link>
            </Button>
          </article>
        ))}
      </section>

      <Button asChild variant="outline" className="w-full rounded-xl border-danger/40 text-danger">
        <Link to="/reports" search={{ exit: "" }}><AlertTriangle />Report a blocked exit</Link>
      </Button>
      <p className="text-center text-[10px] text-muted-foreground">Prototype: demo data and rule-based scoring.</p>
    </div>
  );
}