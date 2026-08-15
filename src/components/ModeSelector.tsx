import { Bike, Car, Footprints, Info } from "lucide-react";
import { MODE_DEPTH_THRESHOLDS, TRAVEL_MODES, TravelMode } from "@/lib/travelModes";

const icons: Record<TravelMode, typeof Car> = {
  walk: Footprints,
  bike: Bike,
  car: Car,
};

export function ModeSelector({
  mode,
  onChange,
  showInfo = true,
}: {
  mode: TravelMode;
  onChange: (m: TravelMode) => void;
  showInfo?: boolean;
}) {
  const t = MODE_DEPTH_THRESHOLDS[mode];
  return (
    <div className="space-y-2">
      <div className="glass rounded-2xl p-1 grid grid-cols-3 gap-1">
        {TRAVEL_MODES.map((m) => {
          const Icon = icons[m.id];
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              aria-pressed={active}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition ${
                active ? "gradient-neon text-neon-foreground shadow-neon" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>
      {showInfo && (
        <div className="glass rounded-xl p-2.5 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] leading-snug text-muted-foreground">
            Risk zones are calculated differently for each travel mode, since the same water depth affects walkers,
            two-wheelers, and cars differently. Current bands — safe under {t.safeMaxCm} cm, moderate up to{" "}
            {t.moderateMaxCm} cm, high risk above.
          </p>
        </div>
      )}
    </div>
  );
}
