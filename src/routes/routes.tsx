import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { FloodMap } from "@/components/FloodMap";
import { RiskBadge } from "@/components/RiskBadge";
import { computeSafeRoutes, suggestPlaces } from "@/lib/routing.functions";
import { decodePolyline, formatDistance, formatDuration, scoreRoute, RouteRisk } from "@/lib/routeRisk";
import { ArrowRight, Clock, Loader2, MapPin, Navigation, Search, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/routes")({
  head: () => ({
    meta: [
      { title: "Smart Safe Route — FloodShield AI" },
      { name: "description", content: "Enter your start and destination to get live driving routes scored against flood-risk zones in Indian cities." },
      { property: "og:title", content: "Smart Safe Route — FloodShield AI" },
      { property: "og:description", content: "Live routes scored against waterlogging-prone zones for safer monsoon commutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppLayout>
      <RoutesScreen />
    </AppLayout>
  ),
});

type Place = { placeId?: string; label: string };
type Suggestion = { placeId: string; main: string; secondary: string; full: string };

type ScoredStep = {
  instruction: string;
  maneuver: string;
  distance: string;
  duration: string;
  path: [number, number][];
  risk: RouteRisk;
};

type ScoredRoute = {
  id: string;
  label: string;
  description: string;
  duration: string;
  distance: string;
  path: [number, number][];
  risk: RouteRisk;
  steps: ScoredStep[];
};

function PlaceInput({
  dotClass,
  placeholder,
  value,
  onChange,
  fetchSuggestions,
}: {
  dotClass: string;
  placeholder: string;
  value: Place;
  onChange: (p: Place) => void;
  fetchSuggestions: (q: string) => Promise<Suggestion[]>;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const typedRef = useRef(false);

  useEffect(() => {
    if (!typedRef.current || value.label.trim().length < 3) {
      setItems([]);
      return;
    }
    const q = value.label;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        setItems(await fetchSuggestions(q));
        setOpen(true);
      } catch {
        setItems([]);
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [value.label, fetchSuggestions]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-secondary/60">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <input
          value={value.label}
          placeholder={placeholder}
          onChange={(e) => {
            typedRef.current = true;
            onChange({ label: e.target.value });
          }}
          onFocus={() => items.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
        />
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
      </div>
      {open && items.length > 0 && (
        <div className="absolute z-[1000] left-0 right-0 mt-1 glass-strong rounded-xl overflow-hidden border border-glass-border">
          {items.map((s) => (
            <button
              key={s.placeId}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                typedRef.current = false;
                onChange({ placeId: s.placeId, label: s.full || s.main });
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-secondary/70 transition"
            >
              <p className="text-xs font-medium truncate">{s.main}</p>
              <p className="text-[10px] text-muted-foreground truncate">{s.secondary}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RoutesScreen() {
  const suggest = useServerFn(suggestPlaces);
  const compute = useServerFn(computeSafeRoutes);

  const [from, setFrom] = useState<Place>({ label: "DLF Cyber City, Gurgaon" });
  const [to, setTo] = useState<Place>({ label: "Connaught Place, New Delhi" });
  const [routes, setRoutes] = useState<ScoredRoute[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useMemo(
    () => async (q: string) => (await suggest({ data: { query: q } })) as Suggestion[],
    [suggest],
  );

  const active = routes.find((r) => r.id === selected) ?? routes[0] ?? null;
  const activeStep = active && stepIndex !== null ? active.steps[stepIndex] ?? null : null;

  async function findRoutes() {
    if (!from.label.trim() || !to.label.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await compute({
        data: {
          origin: from.placeId ? { placeId: from.placeId } : { address: from.label },
          destination: to.placeId ? { placeId: to.placeId } : { address: to.label },
        },
      });
      const scored: ScoredRoute[] = raw
        .map((r) => {
          const path = decodePolyline(r.encodedPolyline);
          return {
            id: r.id,
            label: r.description || "Route",
            description: r.description,
            duration: formatDuration(r.durationSeconds),
            distance: formatDistance(r.distanceMeters),
            path,
            risk: scoreRoute(path),
            steps: (r.steps ?? []).map((s) => {
              const sp = decodePolyline(s.encodedPolyline);
              return {
                instruction: s.instruction,
                maneuver: s.maneuver,
                distance: formatDistance(s.distanceMeters),
                duration: formatDuration(s.durationSeconds),
                path: sp,
                risk: scoreRoute(sp),
              };
            }),
          };
        })
        .sort((a, b) => a.risk.score - b.risk.score);

      if (scored.length === 0) {
        setError("No driving route found between those locations.");
        setRoutes([]);
      } else {
        scored[0].label = "AI Safe Route";
        setRoutes(scored);
        setSelected(scored[0].id);
        setStepIndex(null);
        setNavOpen(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not calculate routes. Try again.");
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 pt-2 pb-6 space-y-4">
      <header>
        <h1 className="text-xl font-bold">Smart Safe Route</h1>
        <p className="text-xs text-muted-foreground">AI-recommended path avoiding waterlogged roads</p>
      </header>

      <div className="glass rounded-2xl p-3 space-y-2">
        <PlaceInput dotClass="bg-safe" placeholder="Starting point" value={from} onChange={setFrom} fetchSuggestions={fetchSuggestions} />
        <PlaceInput dotClass="bg-danger" placeholder="Destination" value={to} onChange={setTo} fetchSuggestions={fetchSuggestions} />
        <button
          onClick={findRoutes}
          disabled={loading}
          className="w-full rounded-xl gradient-neon text-neon-foreground font-semibold py-3 flex items-center justify-center gap-2 shadow-neon disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Analyzing routes…" : "Find safe route"}
        </button>
      </div>

      <FloodMap
        height={220}
        center={[28.5, 77.1]}
        zoom={11}
        interactive
        path={active?.path}
        endpoints={active ? { start: active.path[0], end: active.path[active.path.length - 1] } : undefined}
        highlight={activeStep?.path ?? null}
        highlightSafe={activeStep ? activeStep.risk.level === "low" : true}
      />

      {error && (
        <div className="glass rounded-2xl p-3 flex items-start gap-2 text-xs text-danger">
          <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {routes.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl gradient-neon shadow-neon">
          <Sparkles className="h-4 w-4 text-neon-foreground" />
          <p className="text-xs font-medium text-neon-foreground">
            AI analyzed {routes.length} live route{routes.length > 1 ? "s" : ""} ·{" "}
            {routes.filter((r) => r.risk.level === "low").length} avoid flood-prone zones
          </p>
        </div>
      )}

      <div className="space-y-2">
        {routes.map((r) => {
          const isActive = active?.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => {
                setSelected(r.id);
                setStepIndex(null);
              }}
              className={`w-full text-left rounded-2xl p-4 transition border ${isActive ? "glass-strong border-primary/60 shadow-neon" : "glass border-transparent"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.label}</p>
                  <RiskBadge level={r.risk.level} />
                </div>
                <span className="text-base font-bold font-display shrink-0">{r.duration}</span>
              </div>
              {r.description && <p className="text-[11px] text-muted-foreground mt-1 truncate">via {r.description}</p>}
              <div className="flex items-center justify-between mt-3 text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {r.risk.zones.length === 0 ? "No known risk zones" : `${r.risk.zones.length} risk zone${r.risk.zones.length > 1 ? "s" : ""} on path`}
                </span>
                <span className="text-muted-foreground">{r.distance}</span>
              </div>
              {isActive && r.risk.zones.length > 0 && (
                <p className="text-[10px] text-warning mt-2">Passes: {r.risk.zones.map((z) => z.name).join(", ")}</p>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <button
          onClick={() => {
            setNavOpen((v) => !v);
            if (!navOpen) setStepIndex(0);
          }}
          className="w-full rounded-2xl gradient-neon text-neon-foreground font-semibold py-3.5 flex items-center justify-center gap-2 shadow-neon"
        >
          <Navigation className="h-4 w-4" /> {navOpen ? "Hide turn-by-turn" : "Start safe navigation"} <ArrowRight className="h-4 w-4" />
        </button>
      )}

      {active && navOpen && active.steps.length > 0 && (
        <div className="glass rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Turn-by-turn</p>
            <p className="text-[10px] text-muted-foreground">
              {active.steps.filter((s) => s.risk.level === "low").length}/{active.steps.length} low-risk segments
            </p>
          </div>

          <div className="flex items-center gap-1">
            {active.steps.map((s, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{
                  background:
                    s.risk.level === "severe" ? "var(--danger)" : s.risk.level === "moderate" ? "var(--warning)" : "var(--safe)",
                  opacity: stepIndex === i ? 1 : 0.45,
                }}
              />
            ))}
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {active.steps.map((s, i) => {
              const isSafe = s.risk.level === "low";
              const isCurrent = stepIndex === i;
              return (
                <button
                  key={i}
                  onClick={() => setStepIndex(i)}
                  className={`w-full text-left rounded-xl p-3 border transition ${
                    isCurrent
                      ? isSafe
                        ? "border-safe/70 bg-safe/10"
                        : "border-warning/70 bg-warning/10"
                      : "border-transparent bg-secondary/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2 w-2 rounded-full shrink-0"
                      style={{
                        background:
                          s.risk.level === "severe" ? "var(--danger)" : s.risk.level === "moderate" ? "var(--warning)" : "var(--safe)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug">{s.instruction}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {s.distance} · {s.duration}
                        {isSafe ? " · low-risk segment" : ` · ${s.risk.zones.map((z) => z.name).join(", ") || "elevated risk"}`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setStepIndex((i) => Math.max(0, (i ?? 0) - 1))}
              className="flex-1 rounded-xl bg-secondary/70 py-2 text-xs font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setStepIndex((i) => Math.min(active.steps.length - 1, (i ?? -1) + 1))}
              className="flex-1 rounded-xl gradient-neon text-neon-foreground py-2 text-xs font-semibold shadow-neon"
            >
              Next step
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
