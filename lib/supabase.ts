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
 * Delete a complaint in Supabase permanently (checks ticket_id and id)
 */
export async function deleteSupabaseComplaint(id: string): Promise<boolean> {
  try {
    const cleanId = id.trim();
    if (!cleanId) return false;

    // Delete by ticket_id first
    const { error: err1, count: count1 } = await supabase
      .from("requests")
      .delete({ count: "exact" })
      .eq("ticket_id", cleanId);

    // If not deleted by ticket_id, try deleting by UUID id
    if (!err1 && (count1 === 0 || count1 === null)) {
      const { error: err2, count: count2 } = await supabase
        .from("requests")
        .delete({ count: "exact" })
        .eq("id", cleanId);
      
      if (err2) {
        console.error("[supabase] delete by id error:", err2);
        return false;
      }
      return (count2 ?? 0) > 0;
    }

    if (err1) {
      console.error("[supabase] delete by ticket_id error:", err1);
      return false;
    }

    return (count1 ?? 0) > 0;
  } catch (err) {
    console.error("[supabase] delete exception:", err);
    return false;
  }
}

/**
 * Permanently delete ALL complaints from Supabase requests table
 */
export async function deleteAllSupabaseComplaints(): Promise<boolean> {
  try {
    // Delete all records where ticket_id is not empty
    const { error } = await supabase
      .from("requests")
      .delete()
      .neq("ticket_id", "____NEVER_MATCH____");

    if (error) {
      console.error("[supabase] deleteAll complaints error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[supabase] deleteAll complaints exception:", err);
    return false;
  }
}

/**
 * Auto-seed initial complaints - DISABLED
 * Never re-seed deleted citizen requests under any circumstances.
 */
export async function seedSupabaseIfEmpty(): Promise<boolean> {
  return false;
}
