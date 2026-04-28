import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { PostJobSheet } from "@/components/PostJobSheet";
import { CATEGORIES } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { haptic } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "ServiLink — Find a service" }] }),
  component: Home,
});

function Home() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const firstName = (profile?.name ?? user?.email?.split("@")[0] ?? "there").split(" ")[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const openSheet = (cat?: string) => {
    haptic(10);
    if (cat) setPicked(cat);
    setOpen(true);
  };

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-muted-foreground">Hi {firstName} 👋</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight">
          What service do
          <br />
          you need today?
        </h1>
      </header>

      {/* Search */}
      <div className="glass-strong relative flex items-center gap-2 rounded-2xl px-4 py-3.5">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plumbing, cleaning, tech help…"
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

      {/* Hero CTA */}
      <motion.button
        onClick={() => openSheet()}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative mt-5 w-full overflow-hidden rounded-3xl bg-gradient-brand p-5 text-left text-primary-foreground shadow-glow tap-highlight-none"
      >
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider opacity-80">
            <Sparkles className="h-3.5 w-3.5" /> Get matched fast
          </div>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">
            Describe your job,
            <br />
            pick the best offer.
          </h2>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
            <Plus className="h-4 w-4" /> Post a Job
          </div>
        </div>
      </motion.button>

      {/* Category grid */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Browse services
          </h3>
          <span className="text-xs text-muted-foreground">{filtered.length} categories</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No category matches "{query}". <br />
            <button
              onClick={() => openSheet()}
              className="mt-2 font-semibold text-primary"
            >
              Post a custom job →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((c, i) => (
              <motion.button
                key={c.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => openSheet(c.name)}
                className="glass flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-xs font-medium tap-highlight-none transition hover:border-primary/40"
              >
                <span className="text-3xl">{c.icon}</span>
                <span className="text-center leading-tight">{c.name}</span>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 rounded-2xl border border-dashed border-border p-4">
        <p className="text-xs text-muted-foreground">
          Track all your jobs and offers in{" "}
          <Link to="/jobs" className="font-semibold text-primary">
            My Jobs
          </Link>
          .
        </p>
      </div>

      {/* Floating + */}
      <motion.button
        onClick={() => openSheet()}
        whileTap={{ scale: 0.88 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow tap-highlight-none"
        aria-label="Post a job"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </motion.button>

      <PostJobSheet
        open={open}
        onClose={() => {
          setOpen(false);
          setTimeout(() => setPicked(null), 300);
        }}
        onPosted={(job) => {
          toast.success("Job posted", { description: "Waiting for offers…" });
          navigate({ to: "/job/$jobId", params: { jobId: job.id } });
        }}
        prefillCategory={picked ?? undefined}
      />
    </MobileShell>
  );
}
