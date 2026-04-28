import type { JobStatus } from "@/lib/api";

const styles: Record<JobStatus, string> = {
  OPEN: "bg-warning/20 text-warning-foreground",
  IN_PROGRESS: "bg-primary/15 text-primary",
  DONE: "bg-success/20 text-success-foreground",
};

const labels: Record<JobStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  DONE: "Completed",
};

export function StatusPill({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {labels[status]}
    </span>
  );
}
