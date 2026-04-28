import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col">
      <main className="flex-1 px-5 pb-32 pt-safe">
        <div className="pt-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
