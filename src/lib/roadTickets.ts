import { useEffect, useState } from "react";

/**
 * Session-scoped repair-ticket store (prototype).
 * A production deployment would persist these rows in `repair_tickets`.
 */
export type TicketStatus = "detected" | "verified" | "queued" | "assigned" | "resolved";

export const TICKET_FLOW: TicketStatus[] = ["detected", "verified", "queued", "assigned", "resolved"];

export const TICKET_LABELS: Record<TicketStatus, string> = {
  detected: "Detected",
  verified: "Verified",
  queued: "Queued",
  assigned: "Assigned",
  resolved: "Resolved",
};

export interface RepairTicket {
  id: string;
  incidentId: string;
  location: string;
  damageType: string;
  severity: number;
  riskScore: number;
  roadHierarchy: string;
  confidence: number;
  evidence: string;
  priority: string;
  status: TicketStatus;
  createdAt: string;
}

let tickets: RepairTicket[] = [];
const listeners = new Set<(t: RepairTicket[]) => void>();

function emit() {
  listeners.forEach((l) => l(tickets));
}

export function createTicket(t: Omit<RepairTicket, "id" | "status" | "createdAt">): RepairTicket {
  const existing = tickets.find((x) => x.incidentId === t.incidentId);
  if (existing) return existing;
  const ticket: RepairTicket = {
    ...t,
    id: `RT-${String(tickets.length + 1).padStart(4, "0")}`,
    status: "queued",
    createdAt: "Just now",
  };
  tickets = [ticket, ...tickets];
  emit();
  return ticket;
}

export function advanceTicket(id: string) {
  tickets = tickets.map((t) => {
    if (t.id !== id) return t;
    const idx = TICKET_FLOW.indexOf(t.status);
    return { ...t, status: TICKET_FLOW[Math.min(idx + 1, TICKET_FLOW.length - 1)] };
  });
  emit();
}

export function useTickets(): RepairTicket[] {
  const [list, setList] = useState<RepairTicket[]>(tickets);
  useEffect(() => {
    listeners.add(setList);
    setList(tickets);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  return list;
}
