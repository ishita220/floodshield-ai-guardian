import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { ArrowLeft, ArrowRight, Cpu, Filter, Ticket } from "lucide-react";
import {
  DAMAGE_LABELS,
  HIERARCHY_LABELS,
  PRIORITY_STYLES,
  RoadHierarchy,
  VerificationStatus,
  priorityOf,
  riskScore,
} from "@/lib/roadData";
import { useRoadIncidents } from "@/lib/roadStore";
import {
  RepairTicket,
  TICKET_FLOW,
  TICKET_LABELS,
  advanceTicket,
  createTicket,
  useTickets,
} from "@/lib/roadTickets";

export const Route = createFileRoute("/roads/queue")({
  head: () => ({
    meta: [
      { title: "Priority Repair Queue — FloodShield AI" },
      {
        name: "description",
        content:
          "Municipal repair queue ranked by calculated urban risk — damage severity fused with road hierarchy, traffic and flood exposure.",
      },
      { property: "og:title", content: "Priority Repair Queue — FloodShield AI" },
      {
        property: "og:description",
        content: "Road repairs ranked by danger, not by report order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppLayout>
      <RepairQueue />
    </AppLayout>
  ),
});

type SortKey = "risk" | "severity" | "hierarchy";

function RepairQueue() {
  const incidents = useRoadIncidents();
  const tickets = useTickets();
  const [sort, setSort] = useState<SortKey>("risk");
  const [hierarchy, setHierarchy] = useState<RoadHierarchy | "all">("all");
  const [status, setStatus] = useState<VerificationStatus | "all">("verified");

  const rows = useMemo(() => {
    const order: Record<RoadHierarchy, number> = { arterial: 3, collector: 2, residential: 1 };
    return incidents
      .filter((i) => (hierarchy === "all" ? true : i.roadHierarchy === hierarchy))
      .filter((i) => (status === "all" ? true : i.verificationStatus === status))
      .map((i) => ({ i, score: riskScore(i) }))
      .sort((a, b) => {
        if (sort === "severity") return b.i.severity - a.i.severity;
        if (sort === "hierarchy") return order[b.i.roadHierarchy] - order[a.i.roadHierarchy] || b.score - a.score;
        return b.score - a.score;
      });
  }, [incidents, sort, hierarchy, status]);

  return (
    <div className="px-5 pt-2 pb-6 space-y-4">
      <header className="flex items-center gap-3">
        <Link to="/roads" className="h-9 w-9 rounded-xl glass flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">🛠️ Priority Repair Queue</h1>
          <p className="text-[11px] text-muted-foreground">Ranked by calculated risk, not report order</p>
        </div>
      </header>

      <div className="glass rounded-2xl p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3 w-3" /> Sort & filter
        </div>
        <Segmented
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={[
            { id: "risk", label: "Risk score" },
            { id: "severity", label: "Severity" },
            { id: "hierarchy", label: "Road type" },
          ]}
        />
        <Segmented
          value={hierarchy}
          onChange={(v) => setHierarchy(v as RoadHierarchy | "all")}
          options={[
            { id: "all", label: "All roads" },
            { id: "arterial", label: "Arterial" },
            { id: "collector", label: "Collector" },
            { id: "residential", label: "Residential" },
          ]}
        />
        <Segmented
          value={status}
          onChange={(v) => setStatus(v as VerificationStatus | "all")}
          options={[
            { id: "verified", label: "Verified" },
            { id: "pending", label: "Pending" },
            { id: "rejected", label: "Rejected" },
            { id: "all", label: "All" },
          ]}
        />
      </div>

      <div className="space-y-2">
        {rows.map(({ i, score }, idx) => {
          const p = priorityOf(score);
          return (
            <motion.div
              key={i.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-2xl p-3.5 ${p === "critical" && i.verificationStatus === "verified" ? "border-danger/40" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                    idx === 0 && i.verificationStatus === "verified"
                      ? "gradient-danger text-white shadow-danger"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{i.location}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {DAMAGE_LABELS[i.damageType]} · severity {i.severity.toFixed(1)} · {HIERARCHY_LABELS[i.roadHierarchy]}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Flood exposure {i.floodExposure} · traffic {i.trafficLevel} · {i.createdAt}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold font-display leading-none">
                    {i.verificationStatus === "verified" ? score : "—"}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      i.verificationStatus === "verified" ? PRIORITY_STYLES[p] : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {i.verificationStatus === "verified" ? p : i.verificationStatus}
                  </span>
                </div>
              </div>
              {i.verificationStatus === "verified" && (
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-2.5">
                  <div
                    className={score >= 85 ? "h-full gradient-danger" : score >= 65 ? "h-full bg-warning" : "h-full gradient-neon"}
                    style={{ width: `${score}%` }}
                  />
                </div>
              )}
              {i.verificationStatus === "verified" && (
                <TicketActions
                  ticket={tickets.find((t) => t.incidentId === i.id) ?? null}
                  onCreate={() =>
                    createTicket({
                      incidentId: i.id,
                      location: i.location,
                      damageType: DAMAGE_LABELS[i.damageType],
                      severity: i.severity,
                      riskScore: score,
                      roadHierarchy: HIERARCHY_LABELS[i.roadHierarchy],
                      confidence: i.confidence,
                      evidence: i.sourceFile,
                      priority: p,
                    })
                  }
                />
              )}
            </motion.div>
          );
        })}
        {rows.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No defects match these filters.</p>
        )}
      </div>

      <Link to="/roads/architecture" className="glass rounded-2xl p-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Cpu className="h-3.5 w-3.5 text-primary" /> Ranking uses a transparent rule-based score — see prototype vs
        production architecture.
      </Link>
    </div>
  );
}

function TicketActions({ ticket, onCreate }: { ticket: RepairTicket | null; onCreate: () => void }) {
  if (!ticket) {
    return (
      <button
        onClick={onCreate}
        className="mt-2.5 w-full glass rounded-xl py-2 text-[11px] font-semibold flex items-center justify-center gap-1.5"
      >
        <Ticket className="h-3.5 w-3.5 text-primary" /> Create municipal repair ticket
      </button>
    );
  }
  const idx = TICKET_FLOW.indexOf(ticket.status);
  return (
    <div className="mt-2.5 rounded-xl bg-secondary/60 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold">{ticket.id}</span>
        <span className="text-[10px] text-muted-foreground">Evidence: {ticket.evidence}</span>
      </div>
      <div className="flex items-center gap-1">
        {TICKET_FLOW.map((s, k) => (
          <div key={s} className="flex-1">
            <div className={`h-1 rounded-full ${k <= idx ? "gradient-neon" : "bg-border"}`} />
            <p className={`text-[8px] mt-1 text-center ${k <= idx ? "text-foreground" : "text-muted-foreground"}`}>
              {TICKET_LABELS[s]}
            </p>
          </div>
        ))}
      </div>
      {ticket.status !== "resolved" && (
        <button
          onClick={() => advanceTicket(ticket.id)}
          className="w-full gradient-neon text-neon-foreground rounded-lg py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1"
        >
          Advance to {TICKET_LABELS[TICKET_FLOW[idx + 1]]} <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${
            value === o.id ? "gradient-neon text-neon-foreground border-transparent" : "glass text-muted-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
