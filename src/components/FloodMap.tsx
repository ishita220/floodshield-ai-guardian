import { useEffect, useState } from "react";
import { riskZones, riskColor, RiskLevel } from "@/lib/mockData";
import { classifyDepth, DEFAULT_TRAVEL_MODE, estimateDepthCm, TravelMode } from "@/lib/travelModes";

export type RouteSegment = { path: [number, number][]; level: RiskLevel; changed?: boolean };

export type MapMarker = {
  id: string;
  position: [number, number];
  color: string;
  label: string;
  sub?: string;
};

const levelVar: Record<RiskLevel, string> = {
  low: "--safe",
  moderate: "--warning",
  severe: "--danger",
};

const levelHex: Record<RiskLevel, string> = {
  low: "#22c55e",
  moderate: "#f59e0b",
  severe: "#ef4444",
};

export function FloodMap({
  height = 240,
  center = [28.4595, 77.0266] as [number, number],
  zoom = 12,
  interactive = true,
  path,
  endpoints,
  highlight,
  highlightSafe = true,
  segments,
  mode = DEFAULT_TRAVEL_MODE,
  showZones = true,
  markers,
  onMarkerClick,
}: {
  height?: number | string;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  path?: [number, number][];
  endpoints?: { start?: [number, number] | null; end?: [number, number] | null };
  highlight?: [number, number][] | null;
  highlightSafe?: boolean;
  segments?: RouteSegment[] | null;
  mode?: TravelMode;
  showZones?: boolean;
  markers?: MapMarker[];
  onMarkerClick?: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [RL, setRL] = useState<any>(null);
  const [pulseOn, setPulseOn] = useState(false);

  useEffect(() => {
    setMounted(true);
    import("react-leaflet").then((m) => setRL(m));
  }, []);

  const changedKey = (segments ?? []).map((s) => (s.changed ? "1" : "0")).join("");
  useEffect(() => {
    if (!changedKey.includes("1")) return;
    let n = 0;
    setPulseOn(true);
    const id = setInterval(() => {
      n += 1;
      setPulseOn(n % 2 === 0);
      if (n >= 6) {
        clearInterval(id);
        setPulseOn(false);
      }
    }, 350);
    return () => clearInterval(id);
  }, [changedKey]);


  if (!mounted || !RL) {
    return (
      <div
        className="rounded-2xl glass overflow-hidden relative shimmer"
        style={{ height }}
      />
    );
  }

  const { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, Polyline, useMap } = RL;

  const hasPath = !!path && path.length > 1;
  const bounds = hasPath
    ? ([
        [Math.min(...path!.map((p) => p[0])), Math.min(...path!.map((p) => p[1]))],
        [Math.max(...path!.map((p) => p[0])), Math.max(...path!.map((p) => p[1]))],
      ] as [[number, number], [number, number]])
    : undefined;

  function FitBounds({ b }: { b?: [[number, number], [number, number]] }) {
    const map = useMap();
    useEffect(() => {
      if (!b) return;
      const t = setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(b, { padding: [24, 24] });
      }, 150);
      return () => clearTimeout(t);
    }, [map, b && JSON.stringify(b)]);
    return null;
  }




  return (
    <div className="rounded-2xl overflow-hidden relative border border-glass-border shadow-glass" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}

        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%", background: "#0a1020" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <FitBounds b={bounds} />

        {hasPath && !segments?.length && (
          <>
            <Polyline positions={path} pathOptions={{ color: "#22d3ee", weight: 7, opacity: 0.25 }} />
            <Polyline positions={path} pathOptions={{ color: "#22d3ee", weight: 3.5, opacity: 0.95 }} />
          </>
        )}
        {segments?.map((seg, i) =>
          seg.path.length > 1 ? (
            <Polyline
              key={`seg-${i}-${seg.level}-${seg.changed ? "c" : ""}`}
              positions={seg.path}
              pathOptions={{
                color: levelHex[seg.level],
                weight: seg.changed && pulseOn ? 9 : 4.5,
                opacity: seg.changed && pulseOn ? 1 : 0.9,
              }}
            />
          ) : null,
        )}
        {highlight && highlight.length > 1 && (
          <>
            <Polyline
              positions={highlight}
              pathOptions={{ color: highlightSafe ? "#22c55e" : "#f59e0b", weight: 12, opacity: 0.25 }}
            />
            <Polyline
              positions={highlight}
              pathOptions={{ color: highlightSafe ? "#22c55e" : "#f59e0b", weight: 5, opacity: 1 }}
            />
          </>
        )}
        {endpoints?.start && (
          <CircleMarker center={endpoints.start} radius={6} pathOptions={{ color: "#fff", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }} />
        )}
        {endpoints?.end && (
          <CircleMarker center={endpoints.end} radius={6} pathOptions={{ color: "#fff", fillColor: "#ef4444", fillOpacity: 1, weight: 2 }} />
        )}

        {showZones && riskZones.map((z) => {
          const depth = estimateDepthCm(z);
          const level = classifyDepth(depth, mode);
          return (
            <Circle
              key={z.id + mode}
              center={z.coords}
              radius={z.radius}
              pathOptions={{
                color: `var(${levelVar[level]})`,
                fillColor: `var(${levelVar[level]})`,
                fillOpacity: 0.25,
                weight: 1.5,
              }}
            >
              <Tooltip direction="top" opacity={0.95}>
                <div style={{ fontSize: 11 }}>
                  <strong>{z.name}</strong><br />
                  {(level === "low" ? "OPEN" : level === "moderate" ? "RISKY" : "CUT-OFF")} • ~{depth} cm water • {z.reports} reports
                </div>
              </Tooltip>
            </Circle>
          );
        })}
        {showZones && riskZones.map((z) => (
          <CircleMarker
            key={z.id + "-m" + mode}
            center={z.coords}
            radius={4}
            pathOptions={{
              color: "#fff",
              fillColor: `var(${levelVar[classifyDepth(estimateDepthCm(z), mode)]})`,
              fillOpacity: 1,
              weight: 1.5,
            }}
          />
        ))}

        {markers?.map((m) => (
          <CircleMarker
            key={m.id}
            center={m.position}
            radius={8}
            pathOptions={{ color: "#ffffff", fillColor: m.color, fillOpacity: 1, weight: 2 }}
            eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
          >
            <Tooltip direction="top" opacity={0.95}>
              <div style={{ fontSize: 11 }}>
                <strong>{m.label}</strong>
                {m.sub ? <><br />{m.sub}</> : null}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

      </MapContainer>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5 rounded-2xl" />
    </div>
  );
}

export function LegendDot({ level }: { level: RiskLevel }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: riskColor[level] }} />;
}
