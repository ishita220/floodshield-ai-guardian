import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Map, Navigation, Users, BarChart3, Construction } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/map", label: "Map", icon: Map },
  { to: "/routes", label: "Route", icon: Navigation },
  { to: "/roads", label: "Roads", icon: Construction },
  { to: "/reports", label: "Reports", icon: Users },
  { to: "/insights", label: "Insights", icon: BarChart3 },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-2">
      <div className="glass-strong rounded-3xl px-2 py-2 flex items-center justify-between shadow-glass">
        {tabs.map((t) => {
          const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="relative flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl gradient-neon opacity-90 shadow-neon"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={`relative h-5 w-5 ${active ? "text-neon-foreground" : "text-muted-foreground"}`} />
              <span className={`relative text-[10px] font-medium ${active ? "text-neon-foreground" : "text-muted-foreground"}`}>
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
