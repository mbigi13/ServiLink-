import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { useEffect } from "react";
import { useUI } from "@/lib/store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useRole } from "@/lib/role";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Inline script: applies dark class & theme-color BEFORE first paint to avoid flash.
const noFlashScript = `(function(){try{var s=localStorage.getItem('servilink-v1');if(s){var d=JSON.parse(s);if(d&&d.state&&d.state.darkMode){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#1a1530');}}}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { name: "theme-color", content: "#f7f5fb" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      { title: "ServiLink — Get jobs done, fast" },
      {
        name: "description",
        content:
          "Post a job, receive offers from trusted providers, and pick the best one — all in one beautiful mobile experience.",
      },
      { name: "author", content: "ServiLink" },
      { property: "og:title", content: "ServiLink — Get jobs done, fast" },
      {
        property: "og:description",
        content: "Real-time service marketplace. Post a job, get offers in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
    scripts: [{ children: noFlashScript }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const setHydrated = useUI((s) => s.setHydrated);
  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  return (
    <AuthProvider>
      <RoleGate>
        <AnimatedOutlet />
      </RoleGate>
      <Toaster
        position="top-center"
        richColors
        closeButton={false}
        toastOptions={{
          className:
            "!bg-card/85 !backdrop-blur-xl !border !border-border !rounded-2xl !shadow-soft !text-foreground",
        }}
      />
    </AuthProvider>
  );
}

/**
 * Gates the app:
 * 1. Not logged in → /login (unless already there)
 * 2. Logged in, no role, not on /welcome → /welcome
 * 3. Logged in, has role, on /welcome or /login → home
 */
function RoleGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, ready } = useRole();
  const { user, loading: authLoading } = useAuth();

  const publicPaths = ["/login"];
  const isPublic = publicPaths.includes(pathname);

  useEffect(() => {
    if (authLoading || !ready) return;

    // Not logged in → send to login
    if (!user && !isPublic) {
      navigate({ to: "/login", replace: true });
      return;
    }

    // Logged in, no role, not on welcome → pick role
    if (user && !role && pathname !== "/welcome" && !isPublic) {
      navigate({ to: "/welcome", replace: true });
      return;
    }

    // Logged in, has role, on login or welcome → home
    if (user && role && (pathname === "/welcome" || pathname === "/login")) {
      navigate({ to: role === "provider" ? "/provider" : "/", replace: true });
      return;
    }
  }, [authLoading, ready, user, role, pathname]);

  return <>{children}</>;
}

function AnimatedOutlet() {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();

  // Group routes so transitions aren't jarring between tabs vs detail screens
  const key = pathname;

  if (reduced) return <Outlet />;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="will-change-transform"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
