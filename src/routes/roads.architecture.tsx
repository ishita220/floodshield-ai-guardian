import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ArrowLeft, CircleDot, Cpu, FlaskConical } from "lucide-react";
import { PRODUCTION_ARCHITECTURE, PROTOTYPE_ARCHITECTURE, RISK_WEIGHTS } from "@/lib/roadData";

export const Route = createFileRoute("/roads/architecture")({
  head: () => ({
    meta: [
      { title: "Prototype Architecture — FloodShield AI Road Intelligence" },
      {
        name: "description",
        content:
          "What the Road Intelligence prototype simulates today and what a production computer-vision deployment would replace it with.",
      },
      { property: "og:title", content: "Prototype Architecture — FloodShield AI" },
      {
        property: "og:description",
        content: "Transparent breakdown of simulated vs production road-damage verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppLayout>
      <ArchitecturePage />
    </AppLayout>
  ),
});

function ArchitecturePage() {
  return (
    <div className="px-5 pt-2 pb-6 space-y-4">
      <header className="flex items-center gap-3">
        <Link to="/roads" className="h-9 w-9 rounded-xl glass flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Prototype Architecture</h1>
          <p className="text-[11px] text-muted-foreground">Technical / admin view</p>
        </div>
      </header>

      <section className="glass rounded-2xl p-4">
        <p className="text-sm font-semibold flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-warning" /> Current prototype
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {PROTOTYPE_ARCHITECTURE.map((x) => (
            <li key={x} className="flex gap-2 text-[11px] text-muted-foreground">
              <CircleDot className="h-3 w-3 text-warning shrink-0 mt-0.5" /> {x}
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-muted-foreground mt-3 leading-snug">
          No trained computer-vision model is connected. Verification stages replay a deterministic rule-based script so
          the reasoning structure can be demonstrated honestly.
        </p>
      </section>

      <section className="glass rounded-2xl p-4">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" /> Production-ready architecture
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {PRODUCTION_ARCHITECTURE.map((x) => (
            <li key={x} className="flex gap-2 text-[11px] text-muted-foreground">
              <CircleDot className="h-3 w-3 text-primary shrink-0 mt-0.5" /> {x}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-2xl p-4">
        <p className="text-sm font-semibold">Risk score formula</p>
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
          Every factor is normalised to 0–100 and combined with a fixed weight. Editing the weights below changes the
          ranking of the whole repair queue.
        </p>
        <div className="mt-2.5 space-y-1.5">
          {Object.entries(RISK_WEIGHTS).map(([k, w]) => (
            <div key={k} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground capitalize">{k}</span>
              <span className="font-semibold">{Math.round(w * 100)}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <p className="text-sm font-semibold">Data model</p>
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
          Incidents are held in a session store shaped exactly like the future tables, so a database can be attached
          without reworking the UI.
        </p>
        <div className="mt-2.5 space-y-2">
          <div className="rounded-xl bg-secondary/60 p-2.5">
            <p className="text-[11px] font-semibold">road_incidents</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono leading-relaxed">
              id · location · latitude · longitude · damage_type · severity · confidence · verification_status ·
              road_hierarchy · traffic_level · flood_exposure · critical_infrastructure · risk_score · priority ·
              source_file · created_at
            </p>
          </div>
          <div className="rounded-xl bg-secondary/60 p-2.5">
            <p className="text-[11px] font-semibold">verification_results</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono leading-relaxed">
              incident_id · detection_confidence · geometry_result · depth_result · temporal_result · shadow_check ·
              manhole_check · final_confidence · verification_status
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2.5 leading-snug">
          No backend is connected yet, so nothing is persisted between sessions and no API keys are used in the browser.
        </p>
      </section>
    </div>
  );
}
