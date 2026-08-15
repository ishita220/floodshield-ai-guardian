import { useEffect, useState } from "react";
import { DEFAULT_TRAVEL_MODE, TravelMode } from "@/lib/travelModes";

/** Session-scoped travel mode shared across screens. */
let current: TravelMode = DEFAULT_TRAVEL_MODE;
const listeners = new Set<(m: TravelMode) => void>();

export function useTravelMode(): [TravelMode, (m: TravelMode) => void] {
  const [mode, setMode] = useState<TravelMode>(current);

  useEffect(() => {
    listeners.add(setMode);
    setMode(current);
    return () => {
      listeners.delete(setMode);
    };
  }, []);

  return [
    mode,
    (m: TravelMode) => {
      current = m;
      listeners.forEach((l) => l(m));
    },
  ];
}
