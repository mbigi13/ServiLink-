import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
export type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activity"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type JobStatus = JobRow["status"];
export type Urgency = JobRow["urgency"];
export type OfferStatus = OfferRow["status"];

// ----- Jobs -----
export async function fetchMyJobs() {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchJob(id: string) {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchOpenJobs() {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createJob(input: {
  title: string;
  category: string;
  description: string;
  budget?: number;
  urgency: Urgency;
  creator_id: string;
}): Promise<JobRow> {
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      title: input.title,
      category: input.category,
      description: input.description,
      budget: input.budget ?? null,
      urgency: input.urgency,
      creator_id: input.creator_id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeJob(jobId: string) {
  const { error } = await supabase.from("jobs").update({ status: "DONE" }).eq("id", jobId);
  if (error) throw error;
}

export async function rateJob(jobId: string, stars: number, comment?: string) {
  const { error } = await supabase
    .from("jobs")
    .update({ rating_stars: stars, rating_comment: comment ?? null })
    .eq("id", jobId);
  if (error) throw error;
}

// ----- Offers -----
export async function fetchOffersForJob(jobId: string) {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyOffers() {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createOffer(input: {
  job_id: string;
  provider_id: string;
  price: number;
  eta: string;
  message: string;
}) {
  const { data, error } = await supabase.from("offers").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function acceptOffer(offerId: string) {
  const { error } = await supabase.from("offers").update({ status: "ACCEPTED" }).eq("id", offerId);
  if (error) throw error;
}

export async function declineOffer(offerId: string) {
  const { error } = await supabase.from("offers").update({ status: "DECLINED" }).eq("id", offerId);
  if (error) throw error;
}

// ----- Messages -----
export async function fetchMessagesForJob(jobId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(input: {
  job_id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
}) {
  const { data, error } = await supabase.from("messages").insert(input).select().single();
  if (error) throw error;
  return data;
}

// ----- Activity -----
export async function fetchActivity() {
  const { data, error } = await supabase
    .from("activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markAllActivityRead(userId: string) {
  const { error } = await supabase
    .from("activity")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

// ----- Profiles -----
export async function fetchProfiles(ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, rating, is_provider")
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
}

// ----- Categories -----
export const CATEGORIES: { name: string; icon: string }[] = [
  { name: "Plumbing", icon: "🔧" },
  { name: "Electrical", icon: "💡" },
  { name: "Cleaning", icon: "🧽" },
  { name: "Handyman", icon: "🔨" },
  { name: "Moving", icon: "📦" },
  { name: "Gardening", icon: "🌿" },
  { name: "Painting", icon: "🎨" },
  { name: "Tech Help", icon: "💻" },
];
