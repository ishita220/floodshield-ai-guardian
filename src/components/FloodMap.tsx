import { useEffect, useState } from "react";
import { riskZones, riskColor, RiskLevel } from "@/lib/mockData";

export function FloodMap({ height = 240, center = [28.4595, 77.0266] as [number, number], zoom = 12, interactive = true }: { height?: number | string; center?: [number, number]; zoom?: number; interactive?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [RL, setRL] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    import("react-leaflet").then((m) => setRL(m));
  }, []);

  if (!mounted || !RL) {
    return (
      <div
        className="rounded-2xl glass overflow-hidden relative shimmer"
        style={{ height }}
      />
    );
  }

  const { MapContainer, TileLayer, Circle, CircleMarker, Tooltip } = RL;

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
        {riskZones.map((z) => (
          <Circle
            key={z.id}
            center={z.coords}
            radius={z.radius}
            pathOptions={{
              color: `var(--${z.level === "severe" ? "danger" : z.level === "moderate" ? "warning" : "safe"})`,
              fillColor: `var(--${z.level === "severe" ? "danger" : z.level === "moderate" ? "warning" : "safe"})`,
              fillOpacity: 0.25,
              weight: 1.5,
            }}
          >
            <Tooltip direction="top" opacity={0.95}>
              <div style={{ fontSize: 11 }}>
                <strong>{z.name}</strong><br />
                {z.level.toUpperCase()} • {z.reports} reports
              </div>
            </Tooltip>
          </Circle>
        ))}
        {riskZones.map((z) => (
          <CircleMarker
            key={z.id + "-m"}
            center={z.coords}
            radius={4}
            pathOptions={{
              color: "#fff",
              fillColor: `var(--${z.level === "severe" ? "danger" : z.level === "moderate" ? "warning" : "safe"})`,
              fillOpacity: 1,
              weight: 1.5,
            }}
          />
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5 rounded-2xl" />
    </div>
  );
}

export function LegendDot({ level }: { level: RiskLevel }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: riskColor[level] }} />;
}
