import { memo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Search, Briefcase, Bell, User, LayoutDashboard, ListChecks } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useActivity } from "@/lib/realtime";
import { haptic } from "@/lib/store";
import { useRole } from "@/lib/role";

const customerTabs = [
  { to: "/", label: "Browse", icon: Search },
  { to: "/jobs", label: "My Jobs", icon: Briefcase },
  { to: "/activity", label: "Activity", icon: Bell },
  { to: "/account", label: "Account", icon: User },
] as const;

const providerTabs = [
  { to: "/provider", label: "Jobs", icon: LayoutDashboard },
  { to: "/jobs", label: "Work", icon: ListChecks },
  { to: "/activity", label: "Activity", icon: Bell },
  { to: "/account", label: "Account", icon: User },
] as const;

function BottomNavInner() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { role } = useRole();
  const items = useActivity(user?.id ?? null);
  const unread = items.reduce((n, a) => (a.read ? n : n + 1), 0);

  const tabs = role === "provider" ? providerTabs : customerTabs;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      role="navigation"
    >
      <div className="glass-strong flex w-full max-w-md items-center justify-around rounded-3xl px-2 py-2 tap-highlight-none">
        {tabs.map((t) => {
          const active =
            t.to === "/" ? pathname === "/" : pathname === t.to || pathname.startsWith(`${t.to}/`);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              preload="intent"
              onClick={() => haptic(8)}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.div
                  layoutId="navPill"
                  className="absolute inset-1 rounded-2xl bg-gradient-brand shadow-glow"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span
                className={`relative z-10 flex flex-col items-center gap-0.5 ${active ? "text-primary-foreground" : ""}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
                {t.label}
                {t.label === "Activity" && unread > 0 && !active && (
                  <span className="absolute -right-3 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const BottomNav = memo(BottomNavInner);
