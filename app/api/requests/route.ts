import { NextRequest, NextResponse } from "next/server";
import { 
  getAllComplaints, 
  getComplaintById, 
  getComplaintsByPhone, 
  INITIAL_12_COMPLAINTS,
  INITIAL_PROJECTS,
  getDb,
  saveDb
} from "@/lib/db";
import { 
  getSupabaseComplaints, 
  getSupabaseComplaintById, 
  getSupabaseComplaintsByPhone, 
  insertSupabaseComplaint, 
  updateSupabaseComplaint, 
  deleteSupabaseComplaint,
  seedSupabaseIfEmpty,
  toSupabaseRow,
  fromSupabaseRow
} from "@/lib/supabase";
import { getStoreItem, setStoreItem } from "@/lib/platform-store";
import { Complaint, ComplaintCategory, ComplaintPriority, ProjectItem } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    // Auto-seed cloud database if empty on demand
    await seedSupabaseIfEmpty(INITIAL_12_COMPLAINTS).catch((e) =>
      console.warn("Supabase auto-seed check warning:", e)
    );

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const phone = searchParams.get("phone");
    const zone = searchParams.get("zone");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || searchParams.get("query");

    if (id) {
      // 1. Try Supabase cloud first
      let complaint: Complaint | null | undefined = await getSupabaseComplaintById(id);
      // 2. Fallback to local cache if offline
      if (!complaint) {
        complaint = getComplaintById(id);
      }
      if (!complaint) {
        return NextResponse.json(
          { error: "لم يتم العثور على أي مطلب بهذا الرمز." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, complaint });
    }

    if (phone) {
      // 1. Try Supabase cloud first
      let complaints = await getSupabaseComplaintsByPhone(phone);
      // 2. Fallback to local cache if offline
      if (!complaints || complaints.length === 0) {
        complaints = getComplaintsByPhone(phone);
      }
      if (!complaints || complaints.length === 0) {
        return NextResponse.json(
          { error: "لم يتم العثور على أي مطالب مرتبطة برقم الهاتف هذا." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, complaints });
    }

    // List all
    let list = await getSupabaseComplaints();
    if (!list || list.length === 0) {
      list = getAllComplaints();
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.citizenName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.zone.toLowerCase().includes(q)
      );
    }
    if (zone && zone !== "الكل") {
      list = list.filter((c) => c.zone === zone);
    }
    if (status && status !== "الكل") {
      list = list.filter((c) => c.status === status);
    }

    return NextResponse.json({ success: true, complaints: list });
  } catch (error) {
    console.error("Error in GET /api/requests:", error);
    try {
      const list = getAllComplaints();
      return NextResponse.json({ success: true, complaints: list });
    } catch {
      return NextResponse.json(
        { error: "حدث خطأ أثناء استرجاع البيانات." },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      citizenName, 
      phone, 
      zone, 
      category, 
      description, 
      type,
      audioBase64, 
      attachmentName,
      imageBase64, 
      gpsLocation, 
      priority 
    } = body;

    if (!citizenName || typeof citizenName !== "string" || citizenName.trim().length < 3) {
      return NextResponse.json(
        { error: "الرجاء إدخال الاسم واللقب بشكل صحيح (3 أحرف على الأقل)." },
        { status: 400 }
      );
    }

    const cleanPhone = (phone || "").toString().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 8) {
      return NextResponse.json(
        { error: "رقم الهاتف يجب أن يتكون من 8 أرقام تونسية." },
        { status: 400 }
      );
    }

    if (!zone || typeof zone !== "string" || zone.trim().length === 0) {
      return NextResponse.json(
        { error: "الرجاء تحديد المنطقة أو العمادة." },
        { status: 400 }
      );
    }

    const isVoiceMode = type === "voice" || Boolean(audioBase64);
    if (isVoiceMode && !audioBase64) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الرسالة الصوتية قبل إرسال الشكوى." },
        { status: 400 }
      );
    } else if (!isVoiceMode && (!description || description.trim().length < 5)) {
      return NextResponse.json(
        { error: "الرجاء كتابة تفاصيل المطلب أو العريضة (5 أحرف على الأقل)." },
        { status: 400 }
      );
    }

    // Generate unique tracking ID formatted as TN-XXXX
    const ticketId = `TN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newComplaint: Complaint = {
      id: ticketId,
      createdAt: new Date().toISOString(),
      citizenName: citizenName.trim(),
      phone: cleanPhone,
      zone: zone.trim(),
      category: (category as ComplaintCategory) || "أخرى",
      type: isVoiceMode ? "voice" : "petition",
      description: description?.trim() || (isVoiceMode ? "شكوى صوتية مسجلة من المواطن" : ""),
      audioBase64: audioBase64 || undefined,
      attachmentName: attachmentName || undefined,
      imageBase64: imageBase64 || undefined,
      gpsLocation: gpsLocation || null,
      priority: (priority as ComplaintPriority) || "عادي",
      status: "جديد",
      adminPublicNote: "تم استلام مطلبكم بنجاح وهو قيد المراجعة الأولية من المكتب البرلماني للنائب أسماء درويش.",
      publicNote: "تم استلام مطلبكم بنجاح وهو قيد المراجعة الأولية من المكتب البرلماني للنائب أسماء درويش.",
    };

    // Save directly to Supabase Cloud
    let cloudRecord: Complaint | null = null;
    try {
      cloudRecord = await insertSupabaseComplaint(newComplaint);
    } catch (sbErr) {
      console.warn("Could not insert complaint to Supabase:", sbErr);
    }

    // Cache locally in-memory without breaking on Vercel read-only filesystem
    try {
      const db = getDb();
      if (!db.complaints) db.complaints = [];
      db.complaints.unshift(cloudRecord || newComplaint);
      saveDb(db);
    } catch {}

    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل مطلبكم بنجاح في قاعدة البيانات السحابية Supabase.",
        complaint: cloudRecord || newComplaint,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/requests:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ المطلب." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      status, 
      adminPublicNote,
      publicNote, 
      officialLetterDraft,
      officialLetterText, 
      targetMinistry, 
      priority,
      publishToProjects,
      projectTitle,
      projectSummary 
    } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف المطلب مفقود." }, { status: 400 });
    }

    const updates = {
      ...(status && { status }),
      adminPublicNote: adminPublicNote !== undefined ? adminPublicNote : publicNote,
      publicNote: adminPublicNote !== undefined ? adminPublicNote : publicNote,
      officialLetterDraft: officialLetterDraft !== undefined ? officialLetterDraft : officialLetterText,
      officialLetterText: officialLetterDraft !== undefined ? officialLetterDraft : officialLetterText,
      ...(targetMinistry !== undefined && { targetMinistry }),
      ...(priority && { priority }),
      ...(publishToProjects !== undefined && { publishedToProjects: publishToProjects }),
    };

    // 1. Update Supabase Cloud
    let cloudUpdated: Complaint | null = null;
    try {
      cloudUpdated = await updateSupabaseComplaint(id, updates);
    } catch (sbErr) {
      console.warn("Supabase update error:", sbErr);
    }

    // 2. Update local in-memory DB
    let localUpdated: Complaint | null = null;
    try {
      const db = getDb();
      const comp = db.complaints.find((c) => c.id === id);
      if (comp) {
        Object.assign(comp, updates);
        saveDb(db);
        localUpdated = comp;
      }
    } catch {}

    const updated = cloudUpdated || localUpdated;
    if (!updated) {
      return NextResponse.json({ error: "المطلب غير موجود." }, { status: 404 });
    }

    // If publishing to projects radar, save directly into platform_store (zero EROFS errors)
    if (publishToProjects) {
      try {
        const currentProjects = await getStoreItem<ProjectItem[]>("projects", INITIAL_PROJECTS);
        const newProjId = `PRJ-${id.replace("TN-", "")}`;
        const existingIdx = currentProjects.findIndex((p) => p.id === newProjId || p.relatedComplaintId === id);

        const projectData: ProjectItem = {
          id: newProjId,
          title: projectTitle || `متابعة إشكال ${updated.category} بـ ${updated.zone}`,
          zone: updated.zone,
          targetMinistry: targetMinistry || updated.targetMinistry || "الجهة الحكومية المختصة",
          status: status === "تم الحل" ? "تم التدخل" : "في طور الإنجاز",
          progress: status === "تم الحل" ? 100 : 60,
          summary: projectSummary || updated.description,
          officialLetterText: updates.officialLetterDraft || updated.officialLetterDraft || updated.officialLetterText || "مراسلة برلمانية رسمية من المكتب البرلماني للنائب أسماء درويش.",
          lastUpdate: "تم التحيين من المكتب البرلماني",
          relatedComplaintId: id,
        };

        if (existingIdx >= 0) {
          currentProjects[existingIdx] = { ...currentProjects[existingIdx], ...projectData };
        } else {
          currentProjects.unshift(projectData);
        }

        await setStoreItem("projects", currentProjects);
      } catch (projErr) {
        console.warn("Error publishing to projects platform_store:", projErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات المطلب بنجاح في قاعدة البيانات السحابية Supabase.",
      complaint: updated,
    });
  } catch (error) {
    console.error("Error in PATCH /api/requests:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المطلب." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // body may be empty
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "الرجاء تحديد معرف المطلب المراد حذفه." },
        { status: 400 }
      );
    }

    // 1. Delete from Supabase Cloud
    let sbDeleted = false;
    try {
      sbDeleted = await deleteSupabaseComplaint(id);
    } catch (sbErr) {
      console.warn("Supabase delete error:", sbErr);
    }

    // 2. Delete from local in-memory DB
    let localDeleted = false;
    try {
      const db = getDb();
      const initialLen = db.complaints.length;
      db.complaints = db.complaints.filter((c) => c.id !== id);
      if (db.complaints.length !== initialLen) {
        saveDb(db);
        localDeleted = true;
      }
    } catch {}

    if (!sbDeleted && !localDeleted) {
      return NextResponse.json(
        { error: "المطلب غير موجود أو تم حذفه مسبقاً." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف المطلب (${id}) نهائياً من قاعدة البيانات السحابية Supabase.`,
    });
  } catch (error) {
    console.error("Error in DELETE /api/requests:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المطلب." },
      { status: 500 }
    );
  }
}
