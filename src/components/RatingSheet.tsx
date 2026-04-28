import { useState } from "react";
import { Star } from "lucide-react";
import { Sheet } from "./Sheet";
import { rateJob } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  jobId: string;
  providerName: string;
}

export function RatingSheet({ open, onClose, jobId, providerName }: Props) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  const submit = async () => {
    if (!stars) return;
    try {
      await rateJob(jobId, stars, comment.trim() || undefined);
      toast.success("Rating submitted");
    } catch (e) {
      toast.error("Couldn't submit rating");
    }
    onClose();
    setTimeout(() => {
      setStars(0);
      setComment("");
    }, 300);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Rate the provider">
      <p className="text-sm text-muted-foreground">
        How was your experience with{" "}
        <span className="font-semibold text-foreground">{providerName}</span>?
      </p>

      <div className="my-6 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setStars(n)} className="transition active:scale-90">
            <Star
              className={`h-10 w-10 ${n <= stars ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Add a comment (optional)"
        className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
      />

      <button
        disabled={!stars}
        onClick={submit}
        className="mt-5 w-full rounded-2xl bg-gradient-brand py-4 font-semibold text-primary-foreground shadow-glow transition disabled:opacity-40 disabled:shadow-none"
      >
        Submit rating
      </button>
    </Sheet>
  );
}
