import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { haptic, selectMessagesForJob, useApp } from "@/lib/store";

export const Route = createFileRoute("/chat/$jobId")({
  head: () => ({ meta: [{ title: "Chat — ServiLink" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const job = useApp((s) => s.jobs.find((j) => j.id === jobId));
  const accepted = useApp((s) =>
    s.offers.find((o) => o.id === job?.acceptedOfferId),
  );
  const messages = useApp(selectMessagesForJob(jobId));
  const sendMessage = useApp((s) => s.sendMessage);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const partnerName =
    accepted?.providerName ??
    useApp.getState().offers.find((o) => o.jobId === jobId)?.providerName ??
    "Provider";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, typing]);

  useEffect(() => {
    if (messages.length === 0) {
      const t = setTimeout(() => {
        sendMessage(jobId, `Hi! I'm ${partnerName}. How can I help?`, false);
      }, 700);
      return () => clearTimeout(t);
    }
    // intentional: only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    haptic(8);
    sendMessage(jobId, t, true);
    setText("");
    setTyping(true);
    setTimeout(
      () => {
        const replies = [
          "Got it 👍",
          "Sure, no problem.",
          "On my way.",
          "Sounds good!",
          "Let me check and get back to you.",
        ];
        sendMessage(jobId, replies[Math.floor(Math.random() * replies.length)], false);
        setTyping(false);
      },
      1100 + Math.random() * 900,
    );
  };

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Link to="/" className="text-sm text-primary">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <div className="glass-strong sticky top-0 z-20 flex items-center gap-3 px-5 py-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button
          onClick={() => navigate({ to: "/job/$jobId", params: { jobId } })}
          className="rounded-full bg-muted p-2 transition active:scale-90 hover:bg-accent"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand font-bold text-primary-foreground">
          {partnerName[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{partnerName}</p>
          <p className="flex items-center gap-1.5 text-[10px] text-success-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Online
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-5 py-5">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.fromMe
                    ? "rounded-br-md bg-gradient-brand text-primary-foreground shadow-glow"
                    : "glass rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="glass flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="glass-strong flex items-center gap-2 rounded-full p-1.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={send}
            disabled={!text.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow transition disabled:opacity-40 disabled:shadow-none"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
