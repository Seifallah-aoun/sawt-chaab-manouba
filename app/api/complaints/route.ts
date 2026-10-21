import { NextRequest, NextResponse } from "next/server";
import { 
  getAllComplaints, 
  getComplaintById, 
  getComplaintsByPhone, 
  createComplaint,
  updateComplaint,
  deleteComplaint,
  addProject,
  INITIAL_12_COMPLAINTS
} from "@/lib/db";
import { 
  getSupabaseComplaints, 
  getSupabaseComplaintById, 
  getSupabaseComplaintsByPhone, 
  insertSupabaseComplaint, 
  updateSupabaseComplaint, 
  deleteSupabaseComplaint,
  seedSupabaseIfEmpty 
} from "@/lib/supabase";
import { Complaint } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    // Auto-seed Supabase if empty on demand
    await seedSupabaseIfEmpty(INITIAL_12_COMPLAINTS).catch((e) =>
      console.warn("Supabase auto-seed check warning:", e)
    );

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const phone = searchParams.get("phone");

    if (id) {
      // 1. Try Supabase cloud first
      let complaint: Complaint | null | undefined = await getSupabaseComplaintById(id);
      // 2. Fallback to local DB
      if (!complaint) {
        complaint = getComplaintById(id);
      }
      if (!complaint) {
        return NextResponse.json(
          { error: "لم يتم العثور على أي مطلب بهذا الرمز. الرجاء التثبت من الرمز وإعادة المحاولة." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, complaint });
    }

    if (phone) {
      // 1. Try Supabase cloud first
      let complaints = await getSupabaseComplaintsByPhone(phone);
      // 2. Fallback to local DB
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

    let complaints = await getSupabaseComplaints();
    if (!complaints || complaints.length === 0) {
      complaints = getAllComplaints();
    }
    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error("Error in GET /api/complaints:", error);
    try {
      const complaints = getAllComplaints();
      return NextResponse.json({ success: true, complaints });
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
    if (isVoiceMode) {
      if (!audioBase64) {
        return NextResponse.json(
          { error: "الرجاء تسجيل الرسالة الصوتية قبل إرسال الشكوى." },
          { status: 400 }
        );
      }
    } else {
      if (!description || typeof description !== "string" || description.trim().length < 5) {
        return NextResponse.json(
          { error: "الرجاء كتابة تفاصيل المطلب أو العريضة (5 أحرف على الأقل)." },
          { status: 400 }
        );
      }
    }

    // Save locally
    const newComplaint = createComplaint({
      citizenName,
      phone: cleanPhone,
      zone,
      category,
      type: isVoiceMode ? "voice" : "petition",
      description: description?.trim() || (isVoiceMode ? "شكوى صوتية مسجلة من المواطن" : ""),
      audioBase64: audioBase64 || undefined,
      imageBase64: imageBase64 || undefined,
      gpsLocation: gpsLocation || null,
      priority: priority || "عادي",
    });

    // Save to Supabase Cloud
    let cloudRecord = null;
    try {
      cloudRecord = await insertSupabaseComplaint(newComplaint);
    } catch (sbErr) {
      console.warn("Could not insert complaint to Supabase:", sbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل مطلبكم بنجاح في قاعدة البيانات السحابية Supabase.",
        complaint: cloudRecord || newComplaint,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/complaints:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء حفظ المطلب." },
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
      publicNote, 
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
      ...(publicNote !== undefined && { publicNote }),
      ...(officialLetterText !== undefined && { officialLetterText }),
      ...(targetMinistry !== undefined && { targetMinistry }),
      ...(priority && { priority }),
      ...(publishToProjects !== undefined && { publishedToProjects: publishToProjects }),
    };

    // 1. Update Supabase Cloud
    let cloudUpdated = null;
    try {
      cloudUpdated = await updateSupabaseComplaint(id, updates);
    } catch (sbErr) {
      console.warn("Supabase update error:", sbErr);
    }

    // 2. Update local DB
    const localUpdated = updateComplaint(id, updates);

    const updated = cloudUpdated || localUpdated;
    if (!updated) {
      return NextResponse.json({ error: "المطلب غير موجود." }, { status: 404 });
    }

    if (publishToProjects) {
      addProject({
        id: `PRJ-${id.replace("TN-", "")}`,
        title: projectTitle || `متابعة إشكال ${updated.category} بـ ${updated.zone}`,
        zone: updated.zone,
        targetMinistry: targetMinistry || updated.targetMinistry || "الجهة الحكومية المختصة",
        status: status === "تم الحل" ? "تم التدخل" : "في طور الإنجاز",
        progress: status === "تم الحل" ? 100 : 60,
        summary: projectSummary || updated.description,
        officialLetterText: officialLetterText || updated.officialLetterText || "مراسلة برلمانية رسمية من المكتب البرلماني للنائب أسماء درويش.",
        lastUpdate: "تم التحيين من المكتب البرلماني",
        relatedComplaintId: id,
      });
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات المطلب بنجاح في قاعدة البيانات السحابية Supabase.",
      complaint: updated,
    });
  } catch (error) {
    console.error("Error in PATCH /api/complaints:", error);
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

    // 2. Delete from local DB
    const localDeleted = deleteComplaint(id);

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
    console.error("Error in DELETE /api/complaints:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المطلب." },
      { status: 500 }
    );
  }
}
