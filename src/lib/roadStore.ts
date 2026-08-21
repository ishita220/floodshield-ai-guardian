import { useEffect, useState } from "react";
import { DEMO_INCIDENTS, RoadIncident } from "@/lib/roadData";

/** Session-scoped Road Intelligence incident store, shared across screens. */
let incidents: RoadIncident[] = [...DEMO_INCIDENTS];
const listeners = new Set<(i: RoadIncident[]) => void>();

function emit() {
  listeners.forEach((l) => l(incidents));
}

export function addIncident(incident: RoadIncident) {
  incidents = [incident, ...incidents];
  emit();
}

export function getIncidents() {
  return incidents;
}

export function useRoadIncidents(): RoadIncident[] {
  const [list, setList] = useState<RoadIncident[]>(incidents);
  useEffect(() => {
    listeners.add(setList);
    setList(incidents);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  return list;
}
