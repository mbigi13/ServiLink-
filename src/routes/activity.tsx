import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Activity } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity — ServiLink" }] }),
  component: ActivityPage,
});

const icons = {
  offer: Sparkles,
  message: MessageSquare,
  status: Activity,
};

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function ActivityPage() {
  const items = useApp((s) => s.activity);
  const markRead = useApp((s) => s.markActivityRead);

  useEffect(() => {
    const t = setTimeout(markRead, 800);
    return () => clearTimeout(t);
  }, [markRead]);

  return (
    <MobileShell>
      <header className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">All updates in real time.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          You're all caught up.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((a, i) => {
            const Icon = icons[a.kind];
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to="/job/$jobId"
                  params={{ jobId: a.jobId }}
                  className="glass flex items-start gap-3 rounded-2xl p-4 transition active:scale-[0.98]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{a.title}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(a.createdAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{a.body}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </MobileShell>
  );
}
