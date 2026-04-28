import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIState {
  hydrated: boolean;
  darkMode: boolean;
  setHydrated: (v: boolean) => void;
  setDark: (v: boolean) => void;
  toggleDark: () => void;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      darkMode: false,
      setHydrated: (v) => set({ hydrated: v }),
      setDark: (v) => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", v);
          document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute("content", v ? "#1a1530" : "#f7f5fb");
        }
        set({ darkMode: v });
      },
      toggleDark: () => get().setDark(!get().darkMode),
    }),
    {
      name: "servilink-ui-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      partialize: (s) => ({ darkMode: s.darkMode }),
      onRehydrateStorage: () => (state) => {
        if (typeof document !== "undefined" && state?.darkMode) {
          document.documentElement.classList.add("dark");
        }
        state?.setHydrated(true);
      },
    },
  ),
);

/** Lightweight haptic feedback (no-op where unsupported) */
export function haptic(pattern: number | number[] = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

/* ------------------------------------------------------------------ */
/* Legacy compatibility shims                                          */
/* The app is mid-migration from a local Zustand store to the          */
/* Supabase-backed `lib/api` + `lib/realtime` hooks. The Job Room      */
/* route has been fully migrated. Other routes still import these      */
/* legacy types/selectors — they degrade to empty data here so the     */
/* build stays green until each screen is migrated individually.       */
/* ------------------------------------------------------------------ */

export interface Offer {
  id: string;
  jobId: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  price: number;
  eta: string;
  message: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget?: number | null;
  urgency: "Now" | "Today" | "Flexible";
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  acceptedOfferId?: string | null;
  rating?: { stars: number; comment?: string } | null;
  createdAt: number;
}

export interface ActivityItem {
  id: string;
  kind: "offer" | "message" | "status";
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  jobId?: string | null;
}

interface LegacyAppState {
  userName: string;
  isProvider: boolean;
  darkMode: boolean;
  jobs: Job[];
  offers: Offer[];
  messages: { id: string; jobId: string; text: string; fromMe: boolean; createdAt: number }[];
  activity: ActivityItem[];
  acceptOffer: (jobId: string, offerId: string) => void;
  declineOffer: (offerId: string) => void;
  completeJob: (jobId: string) => void;
  sendMessage: (jobId: string, text: string, fromMe: boolean) => void;
  setProvider: (on: boolean) => void;
  toggleProvider: () => void;
  toggleDark: () => void;
  markAllRead: () => void;
  markActivityRead: (id: string) => void;
  addOffer: (offer: Partial<Offer>) => void;
  resetDemo: () => void;
}

const noop = () => {};
const legacyState: LegacyAppState = {
  userName: "You",
  isProvider: false,
  darkMode: false,
  jobs: [],
  offers: [],
  messages: [],
  activity: [],
  acceptOffer: noop,
  declineOffer: noop,
  completeJob: noop,
  sendMessage: noop,
  setProvider: noop,
  toggleProvider: noop,
  toggleDark: noop,
  markAllRead: noop,
  markActivityRead: noop,
  addOffer: noop,
  resetDemo: noop,
};

type Selector<T> = (s: LegacyAppState) => T;

export function useApp<T>(selector: Selector<T>): T {
  return selector(legacyState);
}
useApp.getState = () => legacyState;

export const selectActiveJobs: Selector<Job[]> = () => [];
export const selectOpenJobs: Selector<Job[]> = () => [];
export const selectOffersForJob = (_jobId: string): Selector<Offer[]> => () => [];
export const selectMessagesForJob =
  (_jobId: string): Selector<LegacyAppState["messages"]> =>
  () => [];

