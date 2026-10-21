import { createClient } from "@supabase/supabase-js";
import { Complaint, ComplaintStatus, ComplaintPriority, ComplaintCategory } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://botcqqbgojlrcrkwopqg.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_NyZwwnReTnaUASaXL5uUcg_y4HFxDI1";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseRequestRecord {
  id?: string;
  ticket_id: string;
  created_at?: string;
  citizen_name: string;
  phone: string;
  zone: string;
  category: string;
  description: string;
  audio_base64?: string | null;
  attachment_name?: string | null;
  priority?: string;
  status?: string;
  admin_public_note?: string | null;
  official_letter_draft?: string | null;
}

/**
 * Bidirectional mapper: Supabase snake_case row -> Clean Frontend camelCase Complaint
 */
export function fromSupabaseRow(row: any): Complaint {
  if (!row) return {} as Complaint;
  const isVoice = Boolean(row.audio_base64);
  const ticketId = row.ticket_id || row.id || `TN-${Math.floor(1000 + Math.random() * 9000)}`;
  const adminNote = row.admin_public_note ?? undefined;
  const letterDraft = row.official_letter_draft ?? undefined;

  return {
    id: ticketId, // Always formatted as TN-XXXX for frontend tracking & display
    createdAt: row.created_at || new Date().toISOString(),
    citizenName: row.citizen_name || "",
    phone: row.phone || "",
    zone: row.zone || "منوبة المدينة",
    category: (row.category as ComplaintCategory) || "أخرى",
    description: row.description || (isVoice ? "شكوى صوتية مسجلة من المواطن" : ""),
    type: isVoice ? "voice" : "petition",
    audioBase64: row.audio_base64 || undefined,
    attachmentName: row.attachment_name || undefined,
    priority: (row.priority as ComplaintPriority) || "عادي",
    status: (row.status as ComplaintStatus) || "جديد",
    adminPublicNote: adminNote,
    publicNote: adminNote, // backwards compatibility
    officialLetterDraft: letterDraft,
    officialLetterText: letterDraft, // backwards compatibility
  };
}

/**
 * Bidirectional mapper: Frontend camelCase Complaint -> Supabase snake_case row
 */
export function toSupabaseRow(
  c: Partial<Complaint> & { id?: string; citizenName?: string }
): SupabaseRequestRecord {
  const ticketId = c.id && c.id.startsWith("TN-") ? c.id : (c.id || `TN-${Math.floor(1000 + Math.random() * 9000)}`);
  const adminNote = c.adminPublicNote !== undefined ? c.adminPublicNote : (c.publicNote !== undefined ? c.publicNote : null);
  const letterDraft = c.officialLetterDraft !== undefined ? c.officialLetterDraft : (c.officialLetterText !== undefined ? c.officialLetterText : null);

  return {
    ticket_id: ticketId,
    citizen_name: (c.citizenName || "").trim(),
    phone: (c.phone || "").replace(/\D/g, ""),
    zone: (c.zone || "منوبة المدينة").trim(),
    category: c.category || "أخرى",
    description: (c.description || (c.type === "voice" || c.audioBase64 ? "شكوى صوتية مسجلة من المواطن" : "")).trim(),
    audio_base64: c.audioBase64 || null,
    attachment_name: c.attachmentName || null,
    priority: c.priority || "عادي",
    status: c.status || "جديد",
    admin_public_note: adminNote,
    official_letter_draft: letterDraft,
    created_at: c.createdAt || new Date().toISOString(),
  };
}

// Backwards compatibility aliases
export const mapRowToComplaint = fromSupabaseRow;
export const mapComplaintToRow = toSupabaseRow;

/**
 * Fetch all complaints from Supabase cloud database
 */
export async function getSupabaseComplaints(): Promise<Complaint[]> {
  try {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[supabase] getComplaints error:", error);
      return [];
    }

    if (!data) return [];
    return data.map(fromSupabaseRow);
  } catch (err) {
    console.error("[supabase] getComplaints exception:", err);
    return [];
  }
}

/**
 * Fetch complaint by ID or ticket_id from Supabase
 */
export async function getSupabaseComplaintById(id: string): Promise<Complaint | null> {
  try {
    const cleanId = id.trim();
    // 1. Try matching ticket_id first
    let query = supabase.from("requests").select("*").eq("ticket_id", cleanId).maybeSingle();
    let { data, error } = await query;

    // 2. If not found and looks like a UUID, fallback to id column
    if (!data && !error && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
      const fallback = await supabase.from("requests").select("*").eq("id", cleanId).maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) return null;
    return fromSupabaseRow(data);
  } catch (err) {
    console.error("[supabase] getById exception:", err);
    return null;
  }
}

/**
 * Fetch complaints by citizen phone number from Supabase
 */
export async function getSupabaseComplaintsByPhone(phone: string): Promise<Complaint[]> {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) return [];

    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("phone", cleanPhone)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(fromSupabaseRow);
  } catch (err) {
    console.error("[supabase] getByPhone exception:", err);
    return [];
  }
}

/**
 * Insert a new complaint into Supabase cloud database
 */
export async function insertSupabaseComplaint(complaint: Complaint): Promise<Complaint | null> {
  try {
    const row = toSupabaseRow(complaint);
    const { data, error } = await supabase
      .from("requests")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[supabase] insert error:", error);
      return null;
    }

    return data ? fromSupabaseRow(data) : complaint;
  } catch (err) {
    console.error("[supabase] insert exception:", err);
    return null;
  }
}

/**
 * Update a complaint in Supabase
 */
export async function updateSupabaseComplaint(
  id: string,
  updates: Partial<Complaint> & {
    adminPublicNote?: string;
    officialLetterDraft?: string;
    publicNote?: string;
    officialLetterText?: string;
  }
): Promise<Complaint | null> {
  try {
    const cleanId = id.trim();
    const patch: Partial<SupabaseRequestRecord> = {};

    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.priority !== undefined) patch.priority = updates.priority;
    if (updates.adminPublicNote !== undefined) patch.admin_public_note = updates.adminPublicNote;
    else if (updates.publicNote !== undefined) patch.admin_public_note = updates.publicNote;
    
    if (updates.officialLetterDraft !== undefined) patch.official_letter_draft = updates.officialLetterDraft;
    else if (updates.officialLetterText !== undefined) patch.official_letter_draft = updates.officialLetterText;

    if (updates.category !== undefined) patch.category = updates.category;
    if (updates.zone !== undefined) patch.zone = updates.zone;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.citizenName !== undefined) patch.citizen_name = updates.citizenName;
    if (updates.phone !== undefined) patch.phone = updates.phone.replace(/\D/g, "");

    // Match ticket_id first
    let { data, error } = await supabase
      .from("requests")
      .update(patch)
      .eq("ticket_id", cleanId)
      .select()
      .maybeSingle();

    // If not found and cleanId is a UUID, try id column
    if (!data && !error && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
      const fallback = await supabase
        .from("requests")
        .update(patch)
        .eq("id", cleanId)
        .select()
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[supabase] update error:", error);
      return null;
    }

    return data ? fromSupabaseRow(data) : null;
  } catch (err) {
    console.error("[supabase] update exception:", err);
    return null;
  }
}

/**
 * Delete a complaint in Supabase
 */
export async function deleteSupabaseComplaint(id: string): Promise<boolean> {
  try {
    const cleanId = id.trim();
    let { error, count } = await supabase
      .from("requests")
      .delete({ count: "exact" })
      .eq("ticket_id", cleanId);

    if (!error && (count === 0 || count === null) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
      const res = await supabase.from("requests").delete({ count: "exact" }).eq("id", cleanId);
      error = res.error;
    }

    if (error) {
      console.error("[supabase] delete error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[supabase] delete exception:", err);
    return false;
  }
}

/**
 * Auto-seed initial complaints to Supabase if the table is empty
 */
export async function seedSupabaseIfEmpty(initialComplaints: Complaint[]): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("[supabase] count check error:", error);
      return false;
    }

    if (count === 0 && initialComplaints.length > 0) {
      const rows = initialComplaints.map((c) => toSupabaseRow(c));
      const { error: insertErr } = await supabase.from("requests").insert(rows);
      if (insertErr) {
        console.error("[supabase] seed insert error:", insertErr);
        return false;
      }
      return true;
    }

    return false;
  } catch (err) {
    console.error("[supabase] seed exception:", err);
    return false;
  }
}
