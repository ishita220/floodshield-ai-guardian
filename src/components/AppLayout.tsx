import { ReactNode } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { StatusBar } from "./StatusBar";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PhoneFrame>
      <StatusBar />
      <main className="flex-1 overflow-y-auto scrollbar-none">{children}</main>
      <BottomNav />
    </PhoneFrame>
  );
}
