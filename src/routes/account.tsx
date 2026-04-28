import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, Moon, ChevronRight, Star, LogOut, Wrench, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { haptic } from "@/lib/store";
import { useUI } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRole, setRole, clearRole } from "@/lib/role";
import { useMyJobs } from "@/lib/realtime";
import { useState } from "react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — ServiLink" }] }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { role } = useRole();
  const darkMode = useUI((s) => s.darkMode);
  const toggleDark = useUI((s) => s.toggleDark);
  const { jobs } = useMyJobs(user?.id ?? null);
  const completed = jobs.filter((j) => j.status === "DONE").length;
  const [confirmReset, setConfirmReset] = useState(false);

  const userName = profile?.name ?? user?.email?.split("@")[0] ?? "Guest";

  const switchRole = () => {
    haptic([8, 30, 8]);
    const next = role === "provider" ? "user" : "provider";
    setRole(next);
    navigate({ to: next === "provider" ? "/provider" : "/" });
  };

  return (
    <MobileShell>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
      </header>

      <div className="glass relative overflow-hidden rounded-3xl p-5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-brand opacity-20 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-2xl font-bold text-primary-foreground shadow-glow">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{userName}</h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-warning text-warning" />
              <span>
                {profile?.rating?.toFixed(1) ?? "5.0"} · {completed} jobs done
              </span>
            </div>
            <span className="mt-1.5 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
              {role === "provider" ? "Service provider" : "Customer"}
            </span>
          </div>
        </div>
      </div>

      {role === "provider" && (
        <Link
          to="/provider"
          preload="intent"
          className="glass mt-4 flex items-center justify-between rounded-2xl p-4 transition active:scale-[0.98] tap-highlight-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Provider Dashboard</p>
              <p className="text-xs text-muted-foreground">See available jobs</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <div className="mt-4 space-y-2.5">
        <button
          onClick={switchRole}
          className="glass flex w-full items-center justify-between rounded-2xl p-4 text-left tap-highlight-none transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              {role === "provider" ? (
                <Briefcase className="h-4 w-4" />
              ) : (
                <Wrench className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">
                Switch to {role === "provider" ? "customer" : "provider"}
              </p>
              <p className="text-xs text-muted-foreground">
                {role === "provider"
                  ? "Browse and post jobs"
                  : "Find work and send offers"}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <Toggle
          icon={<Moon className="h-4 w-4" />}
          label="Dark mode"
          hint="Easier on the eyes"
          on={darkMode}
          onChange={() => {
            haptic(8);
            toggleDark();
          }}
        />
      </div>

      <button
        onClick={() => setConfirmReset(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-semibold text-muted-foreground transition active:scale-[0.98] hover:bg-muted"
      >
        <RefreshCcw className="h-4 w-4" /> Reset role
      </button>

      <button
        onClick={async () => {
          haptic(10);
          await signOut();
          clearRole();
          toast.success("Signed out");
          navigate({ to: "/welcome" });
        }}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-semibold text-muted-foreground transition active:scale-[0.98] hover:bg-muted"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          clearRole();
          toast.success("Role cleared");
          navigate({ to: "/welcome" });
        }}
        title="Reset your role?"
        description="You'll be sent back to the welcome screen to choose again."
        confirmLabel="Reset"
        destructive
      />
    </MobileShell>
  );
}

function Toggle({
  icon,
  label,
  hint,
  on,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <div className="glass flex items-center justify-between rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        role="switch"
        aria-checked={on}
        className={`relative h-7 w-12 rounded-full transition ${
          on ? "bg-gradient-brand" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-soft transition-all duration-300 ease-out ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
