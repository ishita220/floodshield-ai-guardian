import { RiskLevel } from "@/lib/mockData";

const labels: Record<RiskLevel, string> = {
  low: "Low Risk",
  moderate: "Moderate",
  severe: "Severe",
};

export function RiskBadge({ level, className = "" }: { level: RiskLevel; className?: string }) {
  const styles: Record<RiskLevel, string> = {
    low: "bg-safe/15 text-safe border-safe/30",
    moderate: "bg-warning/15 text-warning border-warning/30",
    severe: "bg-danger/15 text-danger border-danger/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${styles[level]} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${level === "severe" ? "bg-danger pulse-ring" : level === "moderate" ? "bg-warning" : "bg-safe"}`} />
      {labels[level]}
    </span>
  );
}
