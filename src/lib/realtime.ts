import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { JobRow, OfferRow, MessageRow, ActivityRow } from "./api";
import {
  fetchMyJobs,
  fetchJob,
  fetchOpenJobs,
  fetchOffersForJob,
  fetchMyOffers,
  fetchMessagesForJob,
  fetchActivity,
} from "./api";

/** Subscribe to my jobs (rows visible per RLS) and keep list in sync. */
export function useMyJobs(userId: string | null) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const data = await fetchMyJobs();
    setJobs(data);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchMyJobs()
      .then((d) => {
        if (!cancelled) {
          setJobs(d);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    const channel = supabase
      .channel(`jobs-user-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          fetchMyJobs().then((d) => !cancelled && setJobs(d));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { jobs, loading, refresh };
}

export function useOpenJobs(enabled: boolean) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    fetchOpenJobs()
      .then((d) => {
        if (!cancelled) {
          setJobs(d);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    const channel = supabase
      .channel("jobs-open")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          fetchOpenJobs().then((d) => !cancelled && setJobs(d));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  return { jobs, loading };
}

export function useJob(jobId: string | undefined) {
  const [job, setJob] = useState<JobRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setLoading(true);
    fetchJob(jobId)
      .then((d) => {
        if (!cancelled) {
          setJob(d ?? null);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          if (!cancelled) setJob(payload.new as JobRow);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { job, loading };
}

export function useOffersForJob(jobId: string | undefined) {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setLoading(true);
    fetchOffersForJob(jobId)
      .then((d) => {
        if (!cancelled) {
          setOffers(d);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    const channel = supabase
      .channel(`offers-${jobId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers", filter: `job_id=eq.${jobId}` },
        () => {
          fetchOffersForJob(jobId).then((d) => !cancelled && setOffers(d));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { offers, loading };
}

export function useMyOffers(userId: string | null) {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  useEffect(() => {
    if (!userId) {
      setOffers([]);
      return;
    }
    let cancelled = false;
    fetchMyOffers().then((d) => !cancelled && setOffers(d));
    const channel = supabase
      .channel(`my-offers-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers" },
        () => {
          fetchMyOffers().then((d) => !cancelled && setOffers(d));
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);
  return offers;
}

export function useMessages(jobId: string | undefined) {
  const [messages, setMessages] = useState<MessageRow[]>([]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    fetchMessagesForJob(jobId).then((d) => !cancelled && setMessages(d));

    const channel = supabase
      .channel(`messages-${jobId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `job_id=eq.${jobId}` },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as MessageRow;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return messages;
}

export function useActivity(userId: string | null) {
  const [items, setItems] = useState<ActivityRow[]>([]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetchActivity().then((d) => !cancelled && setItems(d));

    const channel = supabase
      .channel(`activity-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity", filter: `user_id=eq.${userId}` },
        () => {
          fetchActivity().then((d) => !cancelled && setItems(d));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return items;
}
