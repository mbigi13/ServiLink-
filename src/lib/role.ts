import { useEffect, useState } from "react";

export type Role = "user" | "provider";

const KEY = "servilink-role-v1";
const subscribers = new Set<() => void>();

function readRole(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "user" || v === "provider" ? v : null;
  } catch {
    return null;
  }
}

export function setRole(role: Role) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, role);
  } catch {}
  subscribers.forEach((cb) => cb());
}

export function clearRole() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
  subscribers.forEach((cb) => cb());
}

/** SSR-safe: returns null on the server and during the first client render,
 *  then resolves to the persisted role to avoid hydration mismatches. */
export function useRole(): { role: Role | null; ready: boolean } {
  const [role, setRoleState] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setRoleState(readRole());
    sync();
    setReady(true);
    subscribers.add(sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      subscribers.delete(sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { role, ready };
}
