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

export function mapRowToComplaint(row: any): Complaint {
  const isVoice = Boolean(row.audio_base64);
  return {
    id: row.ticket_id || row.id,
    createdAt: row.created_at || new Date().toISOString(),
    citizenName: row.citizen_name || "",
    phone: row.phone || "",
    zone: row.zone || "منوبة المدينة",
    category: (row.category as ComplaintCategory) || "أخرى",
    description: row.description || "",
    type: isVoice ? "voice" : "petition",
    audioBase64: row.audio_base64 || undefined,
    status: (row.status as ComplaintStatus) || "جديد",
    priority: (row.priority as ComplaintPriority) || "عادي",
    publicNote: row.admin_public_note || undefined,
    officialLetterText: row.official_letter_draft || undefined,
  };
}

export function mapComplaintToRow(c: Partial<Complaint> & { id: string }): SupabaseRequestRecord {
  return {
    ticket_id: c.id,
    citizen_name: c.citizenName || "",
    phone: c.phone || "",
    zone: c.zone || "منوبة المدينة",
    category: c.category || "أخرى",
    description: c.description || (c.type === "voice" ? "شكوى صوتية مسجلة من المواطن" : ""),
    audio_base64: c.audioBase64 || null,
    priority: c.priority || "عادي",
    status: c.status || "جديد",
    admin_public_note: c.publicNote || null,
    official_letter_draft: c.officialLetterText || null,
    ...(c.createdAt ? { created_at: c.createdAt } : {}),
  };
}

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
      console.error("Supabase getComplaints error:", error);
      return [];
    }

    if (!data) return [];
    return data.map(mapRowToComplaint);
  } catch (err) {
    console.error("Supabase query exception:", err);
    return [];
  }
}

/**
 * Fetch complaint by ID or ticket_id from Supabase
 */
export async function getSupabaseComplaintById(id: string): Promise<Complaint | null> {
  try {
    // Try matching ticket_id first, then id
    let query = supabase.from("requests").select("*").eq("ticket_id", id).maybeSingle();
    let { data, error } = await query;

    if (!data && !error && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      const fallback = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) return null;
    return mapRowToComplaint(data);
  } catch (err) {
    console.error("Supabase getById exception:", err);
    return null;
  }
}

/**
 * Fetch complaints by citizen phone number from Supabase
 */
export async function getSupabaseComplaintsByPhone(phone: string): Promise<Complaint[]> {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("phone", cleanPhone)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapRowToComplaint);
  } catch (err) {
    console.error("Supabase getByPhone exception:", err);
    return [];
  }
}

/**
 * Insert a new complaint into Supabase cloud database
 */
export async function insertSupabaseComplaint(complaint: Complaint): Promise<Complaint | null> {
  try {
    const row = mapComplaintToRow(complaint);
    const { data, error } = await supabase
      .from("requests")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return null;
    }

    return data ? mapRowToComplaint(data) : complaint;
  } catch (err) {
    console.error("Supabase insert exception:", err);
    return null;
  }
}

/**
 * Update a complaint in Supabase
 */
export async function updateSupabaseComplaint(
  id: string,
  updates: Partial<Complaint>
): Promise<Complaint | null> {
  try {
    const patch: Partial<SupabaseRequestRecord> = {};
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.priority !== undefined) patch.priority = updates.priority;
    if (updates.publicNote !== undefined) patch.admin_public_note = updates.publicNote;
    if (updates.officialLetterText !== undefined) patch.official_letter_draft = updates.officialLetterText;
    if (updates.category !== undefined) patch.category = updates.category;
    if (updates.zone !== undefined) patch.zone = updates.zone;
    if (updates.description !== undefined) patch.description = updates.description;

    const { data, error } = await supabase
      .from("requests")
      .update(patch)
      .eq("ticket_id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Supabase update error:", error);
      return null;
    }

    return data ? mapRowToComplaint(data) : null;
  } catch (err) {
    console.error("Supabase update exception:", err);
    return null;
  }
}

/**
 * Delete a complaint in Supabase
 */
export async function deleteSupabaseComplaint(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("ticket_id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Supabase delete exception:", err);
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
      console.error("Supabase count check error:", error);
      return false;
    }

    if (count === 0 && initialComplaints.length > 0) {
      const rows = initialComplaints.map((c) => mapComplaintToRow(c));
      const { error: insertErr } = await supabase.from("requests").insert(rows);
      if (insertErr) {
        console.error("Supabase seed insert error:", insertErr);
        return false;
      }
      return true;
    }

    return false;
  } catch (err) {
    console.error("Supabase seed exception:", err);
    return false;
  }
}
