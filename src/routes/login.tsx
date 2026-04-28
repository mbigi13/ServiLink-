import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — ServiLink" }] }),
  component: LoginPage,
});

type Mode = "signin" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithFacebook } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "facebook" | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const res = await signInWithEmail(email.trim(), password);
        if (res.error) {
          toast.error("Sign in failed", { description: res.error });
        } else {
          toast.success("Welcome back!");
          navigate({ to: "/welcome", replace: true });
        }
      } else {
        const res = await signUpWithEmail(email.trim(), password, name.trim());
        if (res.error) {
          toast.error("Sign up failed", { description: res.error });
        } else {
          toast.success("Account created!", { description: "Check your email to confirm." });
          navigate({ to: "/welcome", replace: true });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setSocialLoading("google");
    try {
      await signInWithGoogle();
    } catch {
      toast.error("Google sign-in failed. Try again.");
      setSocialLoading(null);
    }
  };

  const handleFacebook = async () => {
    setSocialLoading("facebook");
    try {
      await signInWithFacebook();
    } catch {
      toast.error("Facebook sign-in failed. Try again.");
      setSocialLoading(null);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+2rem)]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50%] bg-gradient-brand opacity-10 blur-3xl" />

      {/* Logo / Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-brand shadow-glow">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">ServiLink</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get jobs done, fast.</p>
      </motion.div>

      {/* Mode toggle */}
      <div className="glass-strong mb-6 flex rounded-2xl p-1">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              mode === m
                ? "bg-gradient-brand text-primary-foreground shadow-glow"
                : "text-muted-foreground"
            }`}
          >
            {m === "signin" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === "signin" ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {/* Name field (signup only) */}
          {mode === "signup" && (
            <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-3.5">
              <User className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-3.5">
            <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          {/* Password */}
          <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-3.5">
            <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              onClick={() => setShowPass((v) => !v)}
              className="text-muted-foreground"
              type="button"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={loading}
        whileTap={{ scale: 0.97 }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            {mode === "signin" ? "Sign In" : "Create Account"}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </motion.button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Social buttons */}
      <div className="space-y-3">
        {/* Google */}
        <motion.button
          onClick={handleGoogle}
          disabled={!!socialLoading}
          whileTap={{ scale: 0.97 }}
          className="glass-strong flex w-full items-center justify-center gap-3 rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-60"
        >
          {socialLoading === "google" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </motion.button>

        {/* Facebook */}
        <motion.button
          onClick={handleFacebook}
          disabled={!!socialLoading}
          whileTap={{ scale: 0.97 }}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1877F2] py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {socialLoading === "facebook" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <FacebookIcon />
          )}
          Continue with Facebook
        </motion.button>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <span className="font-semibold text-primary">Terms of Service</span> and{" "}
        <span className="font-semibold text-primary">Privacy Policy</span>.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
