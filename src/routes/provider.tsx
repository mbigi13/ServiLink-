import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, Inbox, ListChecks, CheckCircle2, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/Sheet";
import { MobileShell } from "@/components/MobileShell";
import { StatusPill } from "@/components/StatusPill";
import { useAuth } from "@/lib/auth";
import { useOpenJobs, useMyOffers, useMyJobs } from "@/lib/realtime";
import { createOffer, type JobRow, type OfferRow } from "@/lib/api";
import { haptic } from "@/lib/store";
import { setRole } from "@/lib/role";

export const Route = createFileRoute("/provider")({
  head: () => ({ meta: [{ title: "Provider Dashboard — ServiLink" }] }),
  component: ProviderPage,
});

type Tab = "available" | "active" | "completed";

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ProviderPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { jobs: openJobs, loading: loadingOpen } = useOpenJobs(true);
  const { jobs: myJobs } = useMyJobs(user?.id ?? null);
  const myOffers = useMyOffers(user?.id ?? null);

  const [tab, setTab] = useState<Tab>("available");
  const [query, setQuery] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ----- Derive tab data ------------------------------------------------
  // Job IDs the provider has already bid on
  const myOfferByJob = useMemo(() => {
    const m = new Map<string, OfferRow>();
    for (const o of myOffers) m.set(o.job_id, o);
    return m;
  }, [myOffers]);

  // Available = open jobs not posted by me, optionally filtered by query
  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return openJobs
      .filter((j) => j.creator_id !== user?.id)
      .filter((j) =>
        q
          ? j.title.toLowerCase().includes(q) || j.category.toLowerCase().includes(q)
          : true,
      );
  }, [openJobs, query, user?.id]);

  // Active = jobs where my offer was accepted and job is in progress
  const active = useMemo(() => {
    const acceptedOfferJobIds = new Set(
      myOffers.filter((o) => o.status === "ACCEPTED").map((o) => o.job_id),
    );
    return myJobs.filter(
      (j) => acceptedOfferJobIds.has(j.id) && j.status === "IN_PROGRESS",
    );
  }, [myJobs, myOffers]);

  // Completed = my accepted offers on DONE jobs
  const completed = useMemo(() => {
    const acceptedOfferJobIds = new Set(
      myOffers.filter((o) => o.status === "ACCEPTED").map((o) => o.job_id),
    );
    return myJobs.filter(
      (j) => acceptedOfferJobIds.has(j.id) && j.status === "DONE",
    );
  }, [myJobs, myOffers]);

  // Pending bids count (offers I sent, not yet accepted/declined)
  const pendingBids = useMemo(
    () => myOffers.filter((o) => o.status === "PENDING").length,
    [myOffers],
  );

  const activeJob = openJobs.find((j) => j.id === activeJobId);

  const submitOffer = async () => {
    if (!activeJob || !user || !price || !eta) return;
    haptic([10, 30, 10]);
    setSubmitting(true);
    try {
      await createOffer({
        job_id: activeJob.id,
        provider_id: user.id,
        price: Number(price),
        eta,
        message: message || "I can help with this.",
      });
      setActiveJobId(null);
      setPrice("");
      setEta("");
      setMessage("");
      toast.success("Offer sent");
    } catch (e) {
      toast.error("Couldn't send offer", { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const switchToCustomer = () => {
    setRole("user");
    navigate({ to: "/" });
  };

  // Stats for header
  const earnings = completed.reduce((sum, j) => {
    const offer = myOffers.find((o) => o.job_id === j.id && o.status === "ACCEPTED");
    return sum + (offer ? Number(offer.price) : 0);
  }, 0);

  return (
    <MobileShell>
      {/* Header */}
      <header className="mb-5 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">Provider mode</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
            Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👷
          </h1>
        </div>
        <button
          onClick={switchToCustomer}
          className="glass shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary"
        >
          Switch to customer
        </button>
      </header>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <StatCard label="Active" value={active.length} accent />
        <StatCard label="Pending bids" value={pendingBids} />
        <StatCard label="Earnings" value={`$${earnings}`} />
      </div>

      {/* Tabs */}
      <div className="glass mb-5 flex rounded-2xl p-1">
        {(["available", "active", "completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              haptic(8);
              setTab(t);
            }}
            className="relative flex-1 rounded-xl py-2.5 text-xs font-semibold capitalize"
          >
            {tab === t && (
              <motion.div
                layoutId="providerTab"
                className="absolute inset-0 rounded-xl bg-gradient-brand shadow-glow"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className={`relative z-10 ${tab === t ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t === "available" ? `Available${available.length ? ` · ${available.length}` : ""}` : t}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "available" && (
            <>
              {/* Search */}
              <div className="glass-strong mb-4 flex items-center gap-2 rounded-2xl px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title or category…"
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

              {loadingOpen ? (
                <EmptyHint icon={<Inbox className="h-5 w-5" />} text="Loading available jobs…" />
              ) : available.length === 0 ? (
                <EmptyHint
                  icon={<Inbox className="h-5 w-5" />}
                  text={query ? "No matching jobs." : "No open jobs right now. Check back soon."}
                />
              ) : (
                <div className="space-y-2.5">
                  <AnimatePresence>
                    {available.map((j) => {
                      const myOffer = myOfferByJob.get(j.id);
                      return (
                        <motion.div
                          key={j.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", stiffness: 360, damping: 30 }}
                          className="glass rounded-2xl p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
                                  {j.category}
                                </span>
                                <span>{timeAgo(j.created_at)}</span>
                              </div>
                              <p className="mt-1.5 font-semibold">{j.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {j.description}
                              </p>
                            </div>
                            {j.budget != null && (
                              <span className="shrink-0 rounded-xl bg-gradient-brand px-3 py-1.5 text-sm font-bold text-primary-foreground tabular-nums">
                                ${j.budget}
                              </span>
                            )}
                          </div>

                          {myOffer ? (
                            <div className="mt-3 rounded-xl bg-success/15 px-3 py-2 text-center text-xs font-semibold text-success-foreground">
                              {myOffer.status === "PENDING"
                                ? `Offer sent · $${myOffer.price} · ${myOffer.eta}`
                                : myOffer.status === "ACCEPTED"
                                  ? "🎉 Offer accepted!"
                                  : "Offer declined"}
                            </div>
                          ) : (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                haptic(8);
                                setActiveJobId(j.id);
                              }}
                              className="mt-3 w-full rounded-xl bg-gradient-brand py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition"
                            >
                              Send offer
                            </motion.button>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {tab === "active" && (
            <ProgressList
              jobs={active}
              empty="No active jobs yet. Win a bid to start working!"
              icon={<ListChecks className="h-5 w-5" />}
            />
          )}

          {tab === "completed" && (
            <ProgressList
              jobs={completed}
              empty="No completed jobs yet."
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <Sheet
        open={!!activeJobId}
        onClose={() => setActiveJobId(null)}
        title="Send an offer"
      >
        {activeJob && (
          <>
            <div className="rounded-2xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">{activeJob.category}</p>
              <p className="text-sm font-semibold">{activeJob.title}</p>
              {activeJob.budget != null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Customer budget: ${activeJob.budget}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <Field label="Your price">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-border bg-card py-3.5 pl-9 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                  />
                </div>
              </Field>
              <Field label="ETA">
                <input
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  placeholder="e.g. 30 min"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </Field>
              <Field label="Message">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Tell the customer why you're a great fit"
                  className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </Field>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={submitOffer}
              disabled={!price || !eta || submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 font-semibold text-primary-foreground shadow-glow transition disabled:opacity-40 disabled:shadow-none"
            >
              <Send className="h-4 w-4" /> {submitting ? "Sending…" : "Send offer"}
            </motion.button>
          </>
        )}
      </Sheet>
    </MobileShell>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 ${
        accent
          ? "bg-gradient-brand text-primary-foreground shadow-glow"
          : "glass text-foreground"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider ${accent ? "opacity-80" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ProgressList({
  jobs,
  empty,
  icon,
}: {
  jobs: JobRow[];
  empty: string;
  icon: React.ReactNode;
}) {
  if (jobs.length === 0) return <EmptyHint icon={icon} text={empty} />;
  return (
    <div className="space-y-2.5">
      {jobs.map((j) => (
        <Link
          key={j.id}
          to="/job/$jobId"
          params={{ jobId: j.id }}
          className="glass flex items-center justify-between gap-3 rounded-2xl p-4 transition active:scale-[0.98] tap-highlight-none"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StatusPill status={j.status} />
              <span className="truncate text-xs text-muted-foreground">{j.category}</span>
            </div>
            <p className="mt-1.5 truncate font-semibold">{j.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(j.created_at)}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      {text}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
