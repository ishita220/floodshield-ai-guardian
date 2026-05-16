import { Outlet } from "@tanstack/react-router";
import { PhoneFrame } from "./PhoneFrame";
import { StatusBar } from "./StatusBar";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <PhoneFrame>
      <StatusBar />
      <main className="flex-1 overflow-y-auto scrollbar-none">
        <Outlet />
      </main>
      <BottomNav />
    </PhoneFrame>
  );
}
