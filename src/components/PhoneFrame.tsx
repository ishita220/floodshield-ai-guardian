import { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-stretch md:items-center md:justify-center md:py-8">
      <div className="relative w-full md:w-[420px] md:h-[860px] md:rounded-[2.5rem] md:border md:border-glass-border md:shadow-glass overflow-hidden bg-background flex flex-col">
        {children}
      </div>
    </div>
  );
}
