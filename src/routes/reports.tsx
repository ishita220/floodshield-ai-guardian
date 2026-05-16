import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { communityReports } from "@/lib/mockData";
import { Camera, CheckCircle2, Image as ImageIcon, MapPin, Plus, ThumbsUp, Video } from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: () => (
    <AppLayout>
      <ReportsScreen />
    </AppLayout>
  ),
});

function ReportsScreen() {
  return (
    <div className="px-5 pt-2 pb-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Community Reports</h1>
          <p className="text-xs text-muted-foreground">AI-verified live updates from commuters</p>
        </div>
        <button className="h-10 w-10 rounded-2xl gradient-neon shadow-neon flex items-center justify-center">
          <Plus className="h-5 w-5 text-neon-foreground" />
        </button>
      </header>

      {/* Upload card */}
      <div className="glass-strong rounded-2xl p-4">
        <p className="text-sm font-semibold mb-1">Report waterlogging</p>
        <p className="text-[11px] text-muted-foreground mb-3">Help others avoid danger. AI filters duplicates automatically.</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Camera, label: "Photo" },
            { icon: Video, label: "Video" },
            { icon: ImageIcon, label: "Gallery" },
          ].map((b) => (
            <button key={b.label} className="rounded-xl bg-secondary/70 py-3 flex flex-col items-center gap-1.5 hover:bg-secondary transition">
              <b.icon className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-medium">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: "248", l: "reports today" },
          { v: "89%", l: "AI verified" },
          { v: "12", l: "zones flagged" },
        ].map((s) => (
          <div key={s.l} className="glass rounded-2xl p-3 text-center">
            <p className="text-lg font-bold font-display text-gradient-neon">{s.v}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Live near you</h2>
        {communityReports.map((r) => (
          <article key={r.id} className="glass rounded-2xl p-3.5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full gradient-neon flex items-center justify-center text-sm font-bold text-neon-foreground shrink-0">
                {r.user[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold truncate">{r.user}</p>
                  {r.verified && <CheckCircle2 className="h-3.5 w-3.5 text-safe" />}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{r.area} · {r.time}</p>
              </div>
            </div>
            <p className="text-sm mt-2.5 leading-snug">{r.note}</p>
            <div className="mt-3 h-24 rounded-xl bg-gradient-to-br from-secondary to-secondary/40 border border-glass-border relative overflow-hidden">
              <div className="absolute inset-0 shimmer opacity-40" />
              <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full glass-strong">Photo evidence</span>
            </div>
            <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
              <button className="flex items-center gap-1.5 hover:text-primary"><ThumbsUp className="h-3.5 w-3.5" /> {r.upvotes} confirmed</button>
              <span>AI confidence: {r.verified ? "94%" : "71%"}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
