import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Briefcase, Wrench, ArrowRight } from "lucide-react";
import { setRole, type Role } from "@/lib/role";
import { useAuth } from "@/lib/auth";
import { haptic } from "@/lib/store";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — ServiLink" },
      {
        name: "description",
        content:
          "Choose how you'll use ServiLink — post jobs and hire providers, or offer your services to nearby customers.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const { setProvider, user } = useAuth();

  const choose = async (role: Role) => {
    haptic([8, 30, 8]);
    setRole(role);
    // If signed in, sync to backend profile so server-side filters work.
    if (user) {
      try {
        await setProvider(role === "provider");
      } catch {
        // non-fatal; local choice still persists
      }
    }
    navigate({ to: role === "provider" ? "/provider" : "/" });
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+3rem)]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[55%] bg-gradient-brand opacity-15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          <Sparkles className="h-3 w-3" /> Welcome
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">
          How will you use
          <br />
          <span className="bg-gradient-brand bg-clip-text text-transparent">ServiLink?</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          Pick your side. You can switch anytime from your account.
        </p>
      </motion.div>

      <div className="mt-10 space-y-4">
        <RoleCard
          delay={0.05}
          onPress={() => choose("user")}
          icon={<Briefcase className="h-6 w-6" />}
          eyebrow="I need help"
          title="I'm a customer"
          description="Post a job and receive offers from trusted providers in seconds."
        />
        <RoleCard
          delay={0.15}
          onPress={() => choose("provider")}
          icon={<Wrench className="h-6 w-6" />}
          eyebrow="I provide services"
          title="I'm a provider"
          description="Browse open jobs nearby and send offers to win new work."
          variant="dark"
        />
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        Don't worry — you can change this later in Account.
      </p>
    </div>
  );
}

function RoleCard({
  onPress,
  icon,
  eyebrow,
  title,
  description,
  variant = "light",
  delay = 0,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  variant?: "light" | "dark";
  delay?: number;
}) {
  const dark = variant === "dark";
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      className={`group relative w-full overflow-hidden rounded-3xl p-5 text-left tap-highlight-none ${
        dark
          ? "bg-gradient-brand text-primary-foreground shadow-glow"
          : "glass-strong text-foreground"
      }`}
    >
      {dark && (
        <>
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        </>
      )}
      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
            dark
              ? "bg-white/20 text-primary-foreground backdrop-blur"
              : "bg-gradient-brand text-primary-foreground shadow-glow"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              dark ? "opacity-80" : "text-muted-foreground"
            }`}
          >
            {eyebrow}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold leading-tight">{title}</h2>
          <p className={`mt-1 text-sm leading-snug ${dark ? "opacity-90" : "text-muted-foreground"}`}>
            {description}
          </p>
        </div>
        <ArrowRight
          className={`mt-1 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 ${
            dark ? "text-primary-foreground" : "text-primary"
          }`}
        />
      </div>
    </motion.button>
  );
}
