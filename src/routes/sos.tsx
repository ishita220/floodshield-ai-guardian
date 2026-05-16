import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { emergencyContacts, shelters } from "@/lib/mockData";
import { ArrowLeft, Download, MapPin, Phone, ShieldCheck, Siren } from "lucide-react";

export const Route = createFileRoute("/sos")({
  component: () => (
    <AppLayout>
      <SosScreen />
    </AppLayout>
  ),
});

function SosScreen() {
  return (
    <div className="px-5 pt-2 pb-6 space-y-5">
      <header className="flex items-center gap-3">
        <Link to="/" className="h-10 w-10 rounded-2xl glass flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Emergency Mode</h1>
          <p className="text-xs text-muted-foreground">Offline-ready · Last sync 2 min ago</p>
        </div>
      </header>

      {/* SOS button */}
      <div className="glass-strong rounded-3xl p-6 flex flex-col items-center text-center">
        <button className="relative h-32 w-32 rounded-full gradient-danger flex items-center justify-center shadow-danger pulse-ring">
          <Siren className="h-12 w-12 text-white" />
        </button>
        <p className="mt-5 font-semibold">Hold to send SOS</p>
        <p className="text-xs text-muted-foreground mt-1">Shares your live location with NDRF & emergency contacts</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Nearest shelters</h2>
        {shelters.map((s) => (
          <div key={s.id} className="glass rounded-2xl p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-safe/15 text-safe flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.name}</p>
              <p className="text-[11px] text-muted-foreground">{s.distance} · {s.capacity}</p>
            </div>
            <button className="h-9 w-9 rounded-xl gradient-neon flex items-center justify-center shadow-neon">
              <MapPin className="h-4 w-4 text-neon-foreground" />
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Emergency contacts</h2>
        <div className="grid grid-cols-2 gap-2">
          {emergencyContacts.map((c) => (
            <a key={c.id} href={`tel:${c.number}`} className="glass rounded-2xl p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl gradient-danger flex items-center justify-center">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">{c.name}</p>
                <p className="text-sm font-bold font-mono">{c.number}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <button className="w-full glass rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Download className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Download offline city map</p>
            <p className="text-[11px] text-muted-foreground">Gurgaon · 42 MB</p>
          </div>
        </div>
        <span className="text-xs text-primary font-medium">Get</span>
      </button>
    </div>
  );
}
