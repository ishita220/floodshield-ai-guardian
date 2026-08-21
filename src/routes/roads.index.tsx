import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FloodMap } from "@/components/FloodMap";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileVideo,
  Image as ImageIcon,
  Info,
  Layers,
  ListOrdered,
  Loader2,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
  Trash2,
  Waves,
  X,
  XCircle,
} from "lucide-react";
import {
  DAMAGE_LABELS,
  EXPOSURE_LABELS,
  HIERARCHY_LABELS,
  PRIORITY_STYLES,
  RoadIncident,
  combinedUrbanRisk,
  priorityOf,
  riskFactors,
  riskScore,
} from "@/lib/roadData";
import { addIncident, useRoadIncidents } from "@/lib/roadStore";
import {
  ScenarioId,
  SCENARIOS,
  buildIncident,
  buildStages,
  falsePositiveTable,
} from "@/lib/roadVerification";

export const Route = createFileRoute("/roads/")({
  head: () => ({
    meta: [
      { title: "Road Intelligence — FloodShield AI" },
      {
        name: "description",
        content:
          "AI-assisted road damage detection, verification and risk-based repair prioritization for Indian cities, combined with live flood risk.",
      },
      { property: "og:title", content: "Road Intelligence — FloodShield AI" },
      {
        property: "og:description",
        content:
          "Verify road defects, score their urban risk and rank municipal repairs by danger rather than report order.",
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

type Phase = "overview" | "upload" | "verifying" | "result";

function RoadIntelligence() {
  const incidents = useRoadIncidents();
  const [phase, setPhase] = useState<Phase>("overview");
  const [scenario, setScenario] = useState<ScenarioId>("pothole");
  const [file, setFile] = useState<{ name: string; type: string; size: number; isVideo: boolean } | null>(null);
  const [incident, setIncident] = useState<RoadIncident | null>(null);

  const verified = incidents.filter((i) => i.verificationStatus === "verified");
  const potholes = verified.filter((i) => i.damageType === "pothole");
  const pending = incidents.filter((i) => i.verificationStatus === "pending");
  const highRisk = verified.filter((i) => riskScore(i) >= 65);

  const summary = [
    { label: "Total defects", value: incidents.length, icon: Layers, color: "text-primary" },
    { label: "Verified potholes", value: potholes.length, icon: ShieldCheck, color: "text-safe" },
    { label: "High-risk roads", value: highRisk.length, icon: AlertTriangle, color: "text-danger" },
    { label: "Pending verification", value: pending.length, icon: Loader2, color: "text-warning" },
  ];

  return (
    <div className="px-5 pt-2 pb-6 space-y-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">FloodShield AI</p>
        <h1 className="text-xl font-bold mt-0.5">Road Intelligence</h1>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">
          AI-powered road damage detection, verification and risk-based repair prioritization.
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
        <button
          onClick={() => setPhase("upload")}
          className="w-full gradient-neon text-neon-foreground shadow-neon rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Camera className="h-4 w-4" /> Analyze Road Video
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/roads/queue"
            className="glass rounded-2xl py-3 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ListOrdered className="h-3.5 w-3.5 text-primary" /> Repair Queue
          </Link>
          <Link
            to="/roads/emergency"
            className="glass rounded-2xl py-3 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <RouteIcon className="h-3.5 w-3.5 text-primary" /> Route Health
          </Link>
        </div>
      </div>

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

      {/* Recent incidents */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Recent detections</h2>
        {incidents.slice(0, 4).map((i) => (
          <IncidentRow key={i.id} incident={i} />
        ))}
      </section>

      {/* Upload / pipeline sheet */}
      <AnimatePresence>
        {phase !== "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto scrollbar-none"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="px-5 py-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Road damage analysis</p>
                <button
                  onClick={() => {
                    setPhase("overview");
                    setFile(null);
                    setIncident(null);
                  }}
                  className="h-8 w-8 rounded-xl glass flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {phase === "upload" && (
                <UploadPanel
                  file={file}
                  setFile={setFile}
                  scenario={scenario}
                  setScenario={setScenario}
                  onStart={() => setPhase("verifying")}
                />
              )}

              {phase === "verifying" && file && (
                <VerificationPipeline
                  scenario={scenario}
                  isVideo={file.isVideo}
                  onDone={() => {
                    const built = buildIncident(scenario, { name: file.name, isVideo: file.isVideo });
                    setIncident(built);
                    addIncident(built);
                    setPhase("result");
                  }}
                />
              )}

              {phase === "result" && incident && (
                <ResultPanel
                  incident={incident}
                  scenario={scenario}
                  onRestart={() => {
                    setFile(null);
                    setIncident(null);
                    setPhase("upload");
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IncidentRow({ incident }: { incident: RoadIncident }) {
  const score = riskScore(incident);
  const p = priorityOf(score);
  const rejected = incident.verificationStatus === "rejected";
  return (
    <div className="glass rounded-2xl p-3.5 flex items-start gap-3">
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
          rejected
            ? "bg-muted text-muted-foreground"
            : incident.verificationStatus === "pending"
              ? "bg-warning/20 text-warning"
              : score >= 85
                ? "bg-danger/20 text-danger"
                : "bg-primary/20 text-primary"
        }`}
      >
        {rejected ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{incident.location}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {DAMAGE_LABELS[incident.damageType]} · {HIERARCHY_LABELS[incident.roadHierarchy]} · {incident.createdAt}
        </p>
      </div>
      {rejected ? (
        <span className="px-2 py-1 rounded-full text-[10px] font-semibold uppercase border bg-muted text-muted-foreground border-border">
          Rejected
        </span>
      ) : incident.verificationStatus === "pending" ? (
        <span className="px-2 py-1 rounded-full text-[10px] font-semibold uppercase border bg-warning/15 text-warning border-warning/40">
          Pending
        </span>
      ) : (
        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase border ${PRIORITY_STYLES[p]}`}>
          {score}
        </span>
      )}
    </div>
  );
}

function UploadPanel({
  file,
  setFile,
  scenario,
  setScenario,
  onStart,
}: {
  file: { name: string; type: string; size: number; isVideo: boolean } | null;
  setFile: (f: { name: string; type: string; size: number; isVideo: boolean } | null) => void;
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;
  onStart: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (f: File) => {
    setFile({ name: f.name, type: f.type || "unknown", size: f.size, isVideo: f.type.startsWith("video") });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Upload road footage</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Add a road image or dashcam video. Files stay on your device in this prototype — nothing is uploaded to a
          server.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) accept(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl border border-dashed p-6 text-center cursor-pointer transition ${
          dragging ? "border-primary bg-primary/10" : "border-glass-border glass"
        }`}
      >
        <div className="h-12 w-12 rounded-2xl gradient-neon mx-auto flex items-center justify-center shadow-neon">
          <ImageIcon className="h-6 w-6 text-neon-foreground" />
        </div>
        <p className="text-sm font-semibold mt-3">Drag & drop, or tap to browse</p>
        <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, MP4 or MOV</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) accept(f);
          }}
        />
      </div>

      {file && (
        <div className="glass rounded-2xl p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            {file.isVideo ? <FileVideo className="h-5 w-5 text-primary" /> : <ImageIcon className="h-5 w-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {file.type} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button onClick={() => setFile(null)} className="h-8 w-8 rounded-xl glass flex items-center justify-center" aria-label="Remove file">
            <Trash2 className="h-4 w-4 text-danger" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Demo scenario (prototype)</p>
        <div className="grid grid-cols-3 gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`rounded-xl p-2.5 text-left border transition ${
                scenario === s.id ? "gradient-neon text-neon-foreground border-transparent shadow-neon" : "glass border-glass-border"
              }`}
            >
              <p className="text-[11px] font-semibold leading-tight">{s.label}</p>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Because no CV model is connected yet, the scenario selects which pre-scripted verification walkthrough is
          shown for the file you picked.
        </p>
      </div>

      <button
        disabled={!file}
        onClick={onStart}
        className="w-full rounded-2xl py-3.5 font-semibold text-sm gradient-neon text-neon-foreground shadow-neon disabled:opacity-40 disabled:shadow-none"
      >
        🔍 Analyze Road Damage
      </button>
      {!file && (
        <p className="text-[10px] text-center text-muted-foreground">Select a file to enable analysis.</p>
      )}
    </div>
  );
}

function VerificationPipeline({
  scenario,
  isVideo,
  onDone,
}: {
  scenario: ScenarioId;
  isVideo: boolean;
  onDone: () => void;
}) {
  const stages = buildStages(scenario, isVideo);
  const [step, setStep] = useState(0);
  const rows = falsePositiveTable(scenario);

  useEffect(() => {
    if (step > stages.length) return;
    const t = setTimeout(() => {
      if (step === stages.length) onDone();
      else setStep((s) => s + 1);
    }, 1400);
    return () => clearTimeout(t);
  }, [step, stages.length, onDone]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">AI Verification in Progress</h2>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">
          Multiple verification signals are evaluated before a road defect is added to the repair queue.
        </p>
      </div>

      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full gradient-neon"
          animate={{ width: `${(step / stages.length) * 100}%` }}
          transition={{ ease: "easeOut", duration: 0.6 }}
        />
      </div>

      <div className="space-y-2.5">
        {stages.map((s, idx) => {
          const state = idx < step ? "done" : idx === step ? "running" : "idle";
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: state === "idle" ? 0.45 : 1, y: 0 }}
              className={`glass rounded-2xl p-3.5 ${state === "running" ? "border-primary/50" : ""}`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                    state === "done" ? "bg-safe/20 text-safe" : state === "running" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {state === "done" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : state === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Cpu className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stage {idx + 1}</p>
                  <p className="text-sm font-semibold">{s.title}</p>
                </div>
                {state === "done" && <span className="text-[10px] font-semibold text-safe">✓ Complete</span>}
              </div>

              {state !== "idle" && (
                <div className="mt-2.5 pl-9.5 space-y-1">
                  {state === "running" ? (
                    <p className="text-[11px] text-muted-foreground shimmer">{s.running}</p>
                  ) : (
                    <>
                      {s.lines.map((l) => (
                        <p key={l} className="text-[11px] text-foreground/90">
                          • {l}
                        </p>
                      ))}
                      {s.id === "falsepos" && (
                        <div className="mt-2 rounded-xl bg-secondary/50 divide-y divide-border">
                          {rows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between px-2.5 py-1.5">
                              <span className="text-[11px] text-muted-foreground">{r.label}</span>
                              <span className={`text-[11px] font-semibold ${r.detected ? "text-danger" : "text-safe"}`}>
                                {r.detected ? "✅ Detected" : "❌ Not detected"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.note && <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">{s.note}</p>}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      <p className="text-[10px] text-center text-muted-foreground">Prototype verification pipeline · simulated stages</p>
    </div>
  );
}

function ResultPanel({
  incident,
  scenario,
  onRestart,
}: {
  incident: RoadIncident;
  scenario: ScenarioId;
  onRestart: () => void;
}) {
  const verified = incident.verificationStatus === "verified";
  const score = riskScore(incident);
  const factors = riskFactors(incident);
  const combined = combinedUrbanRisk(incident);
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-2xl p-4 ${verified ? "glass-strong border-safe/40" : "glass-strong border-danger/40"}`}
      >
        <p className={`text-lg font-bold ${verified ? "text-safe" : "text-danger"}`}>
          {verified ? "🟢 VERIFIED POTHOLE" : "🔴 REJECTED AS POTHOLE"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {verified
            ? `Confidence: ${incident.confidence}%`
            : scenario === "shadow"
              ? "Rejected — insufficient physical deformation evidence"
              : "Rejected — matches manhole-cover characteristics"}
        </p>

        {verified ? (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              ["Damage type", DAMAGE_LABELS[incident.damageType]],
              ["Severity", `${incident.severity.toFixed(1)} / 10`],
              ["Detection confidence", `${incident.confidence}%`],
              ["Frames verified", incident.verification.framesVerified ? `${incident.verification.framesVerified}` : "Single image"],
              ["Estimated damage area", `${incident.areaSqM} m²`],
              ["Verification status", "Verified"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-secondary/60 p-2.5">
                <p className="text-[10px] text-muted-foreground">{k}</p>
                <p className="text-sm font-semibold mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Candidate classification</p>
              {incident.verification.classScores.map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-[11px] w-16 text-muted-foreground">{c.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={c.score > 60 ? "h-full gradient-danger" : "h-full bg-primary/70"}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold w-9 text-right">{c.score}%</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Reasons</p>
              <ul className="space-y-1">
                {(incident.verification.rejectionReasons ?? []).map((r) => (
                  <li key={r} className="text-[11px] text-foreground/90">
                    • {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-secondary/60 p-2.5">
              <p className="text-[10px] text-muted-foreground">Action</p>
              <p className="text-sm font-semibold mt-0.5">No repair ticket generated</p>
            </div>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-3">Prototype verification pipeline</p>
      </motion.div>

      <button
        onClick={() => setShowWhy((v) => !v)}
        className="w-full glass rounded-2xl px-3.5 py-3 flex items-center justify-between"
      >
        <span className="text-sm font-semibold">Why was this classified this way?</span>
        <ChevronDown className={`h-4 w-4 transition ${showWhy ? "rotate-180" : ""}`} />
      </button>
      {showWhy && (
        <div className="glass rounded-2xl p-3.5 space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Geometry: {incident.verification.geometryResult}</p>
          <p className="text-[11px] text-muted-foreground">Surface: {incident.verification.depthResult}</p>
          <p className="text-[11px] text-muted-foreground">
            Temporal: {incident.verification.temporalResult ?? "Not applicable (single image)"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Shadow match: {incident.verification.shadowCheck ? "yes" : "no"} · Manhole match:{" "}
            {incident.verification.manholeCheck ? "yes" : "no"}
          </p>
        </div>
      )}

      {verified && (
        <>
          <section className="glass rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Road Context</h3>
              <span className="text-[10px] text-muted-foreground">Demo data</span>
            </div>
            {[
              ["Road hierarchy", HIERARCHY_LABELS[incident.roadHierarchy]],
              ["Traffic level", EXPOSURE_LABELS[incident.trafficLevel]],
              ["Flood exposure", EXPOSURE_LABELS[incident.floodExposure]],
              ["Nearby critical infrastructure", incident.criticalInfrastructure ?? "None mapped"],
              ["Population / vehicle exposure", "~48,000 vehicles/day (demo estimate)"],
              ["Location", incident.location],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-muted-foreground">{k}</span>
                <span className="text-[11px] font-semibold text-right">{v}</span>
              </div>
            ))}
            <FloodMap height={150} center={[incident.latitude, incident.longitude]} zoom={13} interactive={false} />
          </section>

          <section className="glass-strong rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">🚨 Road risk score</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-4xl font-bold font-display">{score}</span>
              <span className="text-sm text-muted-foreground mb-1.5">/ 100</span>
              <span
                className={`ml-auto mb-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${PRIORITY_STYLES[priorityOf(score)]}`}
              >
                {priorityOf(score)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden mt-3">
              <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} className="h-full gradient-danger" />
            </div>
            <div className="space-y-2 mt-3">
              {factors.map((f) => (
                <div key={f.key}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-semibold">{f.detail}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                    <div className="h-full gradient-neon" style={{ width: `${f.score}%` }} />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">weight {Math.round(f.weight * 100)}%</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 leading-snug">
              Transparent rule-based score: weighted sum of the factors above. Not a trained predictive model.
            </p>
          </section>

          <section className="glass rounded-2xl p-4 border-danger/30">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5 text-primary" /> 🌊 + 🛣️ Combined urban risk
            </p>
            <p className="text-sm font-semibold mt-2">
              {incident.floodExposure === "high"
                ? "Severe road damage detected inside a high flood-risk zone."
                : "Road damage detected outside the highest flood-risk zones."}
            </p>
            <p className={`text-lg font-bold mt-1 ${combined.level === "critical" ? "text-danger" : "text-warning"}`}>
              Combined risk: {combined.level.toUpperCase()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{combined.reason}</p>
          </section>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onRestart} className="glass rounded-2xl py-3 text-xs font-semibold">
          Analyze another
        </button>
        <Link
          to="/roads/queue"
          className="gradient-neon text-neon-foreground shadow-neon rounded-2xl py-3 text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <MapPin className="h-3.5 w-3.5" /> Open repair queue
        </Link>
      </div>
    </div>
  );
}
