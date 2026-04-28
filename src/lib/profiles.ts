import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileLite {
  id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
}

const cache = new Map<string, ProfileLite>();
const inflight = new Map<string, Promise<void>>();
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((cb) => cb());
}

async function load(ids: string[]) {
  const missing = ids.filter((id) => id && !cache.has(id) && !inflight.has(id));
  if (missing.length === 0) return;
  const p = supabase
    .from("profiles")
    .select("id, name, avatar_url, rating")
    .in("id", missing)
    .then(({ data }) => {
      (data ?? []).forEach((p) => cache.set(p.id, p as ProfileLite));
      missing.forEach((id) => {
        inflight.delete(id);
        if (!cache.has(id)) {
          cache.set(id, { id, name: "User", avatar_url: null, rating: 5.0 });
        }
      });
      notify();
    });
  missing.forEach((id) => inflight.set(id, p as unknown as Promise<void>));
  await p;
}

/** Returns a stable map of id → profile for the requested ids; loads missing on demand. */
export function useProfiles(ids: string[]): Record<string, ProfileLite> {
  const [, force] = useState(0);

  useEffect(() => {
    const cb = () => force((n) => n + 1);
    subscribers.add(cb);
    if (ids.length) load(ids);
    return () => {
      subscribers.delete(cb);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);

  const out: Record<string, ProfileLite> = {};
  ids.forEach((id) => {
    if (id) out[id] = cache.get(id) ?? { id, name: "…", avatar_url: null, rating: 5.0 };
  });
  return out;
}

export function useProfile(id: string | null | undefined): ProfileLite | null {
  const map = useProfiles(id ? [id] : []);
  return id ? map[id] ?? null : null;
}
