import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Zap, Clock, CalendarClock } from "lucide-react";
import { Sheet } from "./Sheet";
import { CATEGORIES, createJob, type JobRow, type Urgency } from "@/lib/api";
import { haptic } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onPosted?: (job: JobRow) => void;
  prefillCategory?: string;
}

const URGENCIES: { label: Urgency; icon: typeof Zap; hint: string }[] = [
  { label: "Now", icon: Zap, hint: "ASAP" },
  { label: "Today", icon: Clock, hint: "Within hours" },
  { label: "Flexible", icon: CalendarClock, hint: "Anytime" },
];

export function PostJobSheet({ open, onClose, onPosted, prefillCategory }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  // When the sheet is opened with a prefilled category, jump straight to step 0
  // with the category already chosen, so the user can describe the job.
  useEffect(() => {
    if (open && prefillCategory) {
      setCategory(prefillCategory);
    }
  }, [open, prefillCategory]);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("Today");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(0);
    setTitle("");
    setCategory("");
    setDescription("");
    setBudget("");
    setUrgency("Today");
  };

  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const next = () => {
    haptic(8);
    setStep((s) => s + 1);
  };
  const back = () => {
    haptic(8);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
    if (!user) return;
    haptic([10, 30, 10]);
    setSubmitting(true);
    try {
      const job = await createJob({
        title: title.trim(),
        category,
        description: description.trim(),
        budget: budget ? Number(budget) : undefined,
        urgency,
        creator_id: user.id,
      });
      // Trigger simulated offers fallback (server-side edge function)
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulate-offers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ job_id: job.id, base_budget: job.budget }),
        },
      ).catch(() => {});
      close();
      onPosted?.(job);
    } catch (e) {
      toast.error("Couldn't post job", { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = [
    () => title.trim().length > 2,
    () => !!category,
    () => description.trim().length > 5,
    () => true,
    () => true,
    () => !!urgency,
    () => true,
  ][step]();

  const total = 7;

  return (
    <Sheet open={open} onClose={close}>
      <div className="mb-4 flex items-center gap-3">
        {step > 0 ? (
          <button
            onClick={back}
            className="rounded-full bg-muted p-2 text-foreground transition active:scale-90 hover:bg-accent"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-brand"
              animate={{ width: `${((step + 1) / total) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {step + 1}/{total}
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[300px]"
        >
          {step === 0 && (
            <Step title="What do you need?" subtitle="Give your job a clear title.">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fix leaking sink"
                className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </Step>
          )}

          {step === 1 && (
            <Step title="Pick a category" subtitle="Helps the right pros find you.">
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map((c: { name: string; icon: string }) => {
                  const active = category === c.name;
                  return (
                    <motion.button
                      key={c.name}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        haptic(8);
                        setCategory(c.name);
                      }}
                      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-xs font-medium transition tap-highlight-none ${
                        active
                          ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span className="text-2xl">{c.icon}</span>
                      {c.name}
                    </motion.button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="Add details" subtitle="The more context, the better the offers.">
              <textarea
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe the job…"
                className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-4 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </Step>
          )}

          {step === 3 && (
            <Step title="Add a photo" subtitle="Optional — helps providers understand.">
              <label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground transition hover:border-primary/40">
                <div className="text-3xl">📷</div>
                <p className="text-sm">Tap to upload</p>
                <input type="file" accept="image/*" className="hidden" />
              </label>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                You can skip this step.
              </p>
            </Step>
          )}

          {step === 4 && (
            <Step title="Set a budget" subtitle="Optional — leave blank for open offers.">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-2xl border border-border bg-card py-4 pl-9 pr-4 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </div>
            </Step>
          )}

          {step === 5 && (
            <Step title="How urgent?" subtitle="When do you need this done?">
              <div className="flex flex-col gap-3">
                {URGENCIES.map((u) => {
                  const active = urgency === u.label;
                  const Icon = u.icon;
                  return (
                    <motion.button
                      key={u.label}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        haptic(8);
                        setUrgency(u.label);
                      }}
                      className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition tap-highlight-none ${
                        active
                          ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-white/20" : "bg-accent"}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{u.label}</div>
                        <div
                          className={`text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                        >
                          {u.hint}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 6 && (
            <Step title="Review" subtitle="Looks good?">
              <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <Row label="Title" value={title} />
                <Row label="Category" value={category} />
                <Row label="When" value={urgency} />
                {budget && <Row label="Budget" value={`$${budget}`} />}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm">{description}</p>
                </div>
              </div>
            </Step>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-0 -mx-5 mt-6 px-5 pb-2 pt-2">
        {step < total - 1 ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!canNext}
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 font-semibold text-primary-foreground shadow-glow transition disabled:opacity-40 disabled:shadow-none tap-highlight-none"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 font-semibold text-primary-foreground shadow-glow transition tap-highlight-none disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> {submitting ? "Posting…" : "Post Job"}
          </motion.button>
        )}
      </div>
    </Sheet>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
