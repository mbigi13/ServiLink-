import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, MessageCircle, Check, X, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/StatusPill";
import { RatingSheet } from "@/components/RatingSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CardSkeleton } from "@/components/Skeletons";
import { haptic } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useJob, useOffersForJob } from "@/lib/realtime";
import { useProfiles } from "@/lib/profiles";
import { acceptOffer, completeJob, declineOffer, type OfferRow } from "@/lib/api";

export const Route = createFileRoute("/job/$jobId")({
  head: () => ({ meta: [{ title: "Job Room — ServiLink" }] }),
  component: JobRoom,
});

function JobRoom() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { job, loading: jobLoading } = useJob(jobId);
  const { offers: rawOffers, loading: offersLoading } = useOffersForJob(jobId);

  // Filter declined and sort by newest first
  const offers = useMemo(
    () =>
      [...rawOffers]
        .filter((o) => o.status !== "DECLINED")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [rawOffers],
  );

  const providerIds = useMemo(() => rawOffers.map((o) => o.provider_id), [rawOffers]);
  const providers = useProfiles(providerIds);

  const [viewers, setViewers] = useState(2);
  const [rateOpen, setRateOpen] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isOwner = !!user && !!job && job.creator_id === user.id;
  const accepted = useMemo(
    () => rawOffers.find((o) => o.id === job?.accepted_offer_id) ?? null,
    [rawOffers, job?.accepted_offer_id],
  );

  useEffect(() => {
    if (!job || job.status !== "OPEN") return;
    const id = setInterval(() => {
      setViewers((v) => Math.max(1, Math.min(8, v + (Math.random() > 0.5 ? 1 : -1))));
    }, 3500);
    return () => clearInterval(id);
  }, [job?.status]);

  useEffect(() => {
    if (job?.status === "DONE" && !job.rating_stars && isOwner) {
      const t = setTimeout(() => setRateOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [job?.status, job?.rating_stars, isOwner]);

  if (jobLoading && !job) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pt-20">
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">Job not found.</p>
        <Link
          to="/"
          className="rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    );
  }

  const handleAccept = async (o: OfferRow) => {
    if (busyId) return;
    haptic([10, 30, 10]);
    setBusyId(o.id);
    try {
      await acceptOffer(o.id);
      const name = providers[o.provider_id]?.name ?? "Provider";
      toast.success(`Offer from ${name} accepted`, {
        description: `Job is now in progress · $${o.price}`,
      });
    } catch (e) {
      toast.error("Couldn't accept offer", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (o: OfferRow) => {
    if (busyId) return;
    haptic(8);
    setBusyId(o.id);
    try {
      await declineOffer(o.id);
    } catch (e) {
      toast.error("Couldn't decline offer", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async () => {
    haptic([10, 30, 10]);
    try {
      await completeJob(job.id);
      toast.success("Job marked as completed", {
        description: "You can now rate the provider.",
      });
    } catch (e) {
      toast.error("Couldn't mark as done", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    }
  };

  const acceptedProvider = accepted ? providers[accepted.provider_id] : null;

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md pb-8">
      <div className="glass-strong sticky top-0 z-30 flex items-center gap-3 px-5 py-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-full bg-muted p-2 transition active:scale-90 hover:bg-accent"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{job.title}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {job.category}
          </p>
        </div>
        <StatusPill status={job.status} />
      </div>

      <div className="px-5 pt-5">
        <div className="glass relative overflow-hidden rounded-3xl p-5">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-brand opacity-20 blur-2xl" />
          <h1 className="relative text-xl font-semibold">{job.title}</h1>
          <p className="relative mt-1.5 text-sm text-muted-foreground">{job.description}</p>
          <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs">
            {job.budget != null && (
              <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">
                ${job.budget}
              </span>
            )}
            <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">
              {job.urgency}
            </span>
            {job.status === "OPEN" && (
              <span className="ml-auto flex items-center gap-1.5 text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <Eye className="h-3 w-3" /> {viewers} viewing
              </span>
            )}
          </div>
        </div>

        {accepted && job.status === "IN_PROGRESS" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mt-4 rounded-3xl p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-success-foreground">
              Provider on the way
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={acceptedProvider?.name ?? "Provider"} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{acceptedProvider?.name ?? "Provider"}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {acceptedProvider?.rating?.toFixed(1) ?? "5.0"} · ETA {accepted.eta}
                </div>
              </div>
              <span className="font-bold text-primary">${accepted.price}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                to="/chat/$jobId"
                params={{ jobId: job.id }}
                preload="intent"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold transition active:scale-[0.97] hover:bg-muted tap-highlight-none"
              >
                <MessageCircle className="h-4 w-4" /> Chat
              </Link>
              {isOwner && (
                <button
                  onClick={() => setConfirmComplete(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-[0.97] tap-highlight-none"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark done
                </button>
              )}
            </div>
          </motion.div>
        )}

        {accepted && job.status === "DONE" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass mt-4 rounded-3xl p-5 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
              <CheckCircle2 className="h-6 w-6 text-success-foreground" />
            </div>
            <p className="mt-3 font-semibold">Job completed</p>
            <p className="text-xs text-muted-foreground">
              Completed by {acceptedProvider?.name ?? "Provider"}
            </p>
            {!job.rating_stars ? (
              isOwner && (
                <button
                  onClick={() => setRateOpen(true)}
                  className="mt-4 w-full rounded-2xl bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-[0.97]"
                >
                  Rate provider
                </button>
              )
            ) : (
              <div className="mt-3 flex justify-center gap-1">
                {Array.from({ length: job.rating_stars }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {job.status === "OPEN" && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Live offers ({offers.length})
              </h2>
              {offers.length === 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  Waiting…
                </span>
              )}
            </div>

            {offers.length === 0 && offersLoading && <CardSkeleton count={2} />}
            {offers.length === 0 && !offersLoading && (
              <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
                No offers yet. We'll notify you the moment one comes in.
              </div>
            )}

            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {offers.map((o) => {
                  const p = providers[o.provider_id];
                  const name = p?.name ?? "Provider";
                  const rating = p?.rating?.toFixed(1) ?? "5.0";
                  const isBusy = busyId === o.id;
                  return (
                    <motion.div
                      key={o.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 14 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0 }}
                      transition={{ type: "spring", stiffness: 360, damping: 30 }}
                      className="glass rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-semibold">{name}</p>
                            <span className="text-lg font-bold text-primary tabular-nums">
                              ${o.price}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {rating}
                            </span>
                            · ETA {o.eta}
                          </div>
                          {o.message && <p className="mt-2 text-sm">{o.message}</p>}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleAccept(o)}
                            disabled={isBusy}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-brand py-2.5 text-xs font-semibold text-primary-foreground shadow-glow transition active:scale-[0.97] disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" /> {isBusy ? "Accepting…" : "Accept"}
                          </button>
                          <Link
                            to="/chat/$jobId"
                            params={{ jobId: job.id }}
                            preload="intent"
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-semibold transition active:scale-[0.97] hover:bg-muted"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Chat
                          </Link>
                          <button
                            onClick={() => handleDecline(o)}
                            disabled={isBusy}
                            className="flex items-center justify-center rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground transition active:scale-90 hover:bg-muted disabled:opacity-50"
                            aria-label="Decline"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {accepted && (
        <RatingSheet
          open={rateOpen}
          onClose={() => setRateOpen(false)}
          jobId={job.id}
          providerName={acceptedProvider?.name ?? "Provider"}
        />
      )}

      <ConfirmDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        onConfirm={handleComplete}
        title="Mark job as completed?"
        description="You'll be asked to rate the provider next."
        confirmLabel="Mark done"
      />
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand font-bold text-primary-foreground">
      {(name[0] ?? "?").toUpperCase()}
    </div>
  );
}
