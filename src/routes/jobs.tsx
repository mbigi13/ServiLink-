import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronRight, Search, X } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { StatusPill } from "@/components/StatusPill";
import { useAuth } from "@/lib/auth";
import { useMyJobs } from "@/lib/realtime";

export const Route = createFileRoute("/jobs")({
  head: () => ({ meta: [{ title: "My Jobs — ServiLink" }] }),
  component: JobsPage,
});

type Tab = "active" | "completed";

function JobsPage() {
  const { user } = useAuth();
  const { jobs, loading } = useMyJobs(user?.id ?? null);
  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const filtered =
      tab === "active"
        ? jobs.filter((j) => j.status !== "DONE")
        : jobs.filter((j) => j.status === "DONE");
    const q = query.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q) || j.category.toLowerCase().includes(q),
    );
  }, [jobs, tab, query]);

  return (
    <MobileShell>
      <header className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">Your jobs</h1>
        <p className="text-sm text-muted-foreground">Track everything in one place.</p>
      </header>

      {/* Search */}
      <div className="glass-strong mb-4 flex items-center gap-2 rounded-2xl px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your jobs…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="glass mb-5 flex rounded-2xl p-1">
        {(["active", "completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize"
          >
            {tab === t && (
              <motion.div
                layoutId="jobsTab"
                className="absolute inset-0 rounded-xl bg-gradient-brand shadow-glow"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className={`relative z-10 ${tab === t ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {loading && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {!loading && list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {tab === "active" ? "No active jobs." : "No completed jobs yet."}
            </div>
          )}
          {list.map((j) => (
            <Link
              key={j.id}
              to="/job/$jobId"
              params={{ jobId: j.id }}
              className="glass block rounded-2xl p-4 transition active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <StatusPill status={j.status} />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="mt-2 font-semibold">{j.title}</h3>
              <p className="text-xs text-muted-foreground">{j.category}</p>
              {j.budget != null && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-semibold text-primary">${j.budget}</span>
                </div>
              )}
              {j.rating_stars && (
                <div className="mt-2 flex items-center gap-1 text-xs text-warning-foreground">
                  {Array.from({ length: j.rating_stars }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                  ))}
                </div>
              )}
            </Link>
          ))}
        </motion.div>
      </AnimatePresence>
    </MobileShell>
  );
}
