import { NextRequest, NextResponse } from "next/server";
import {
  getYouthPrograms,
  addYouthProgram,
  deleteYouthProgram,
  getYouthRequests,
  addYouthRequest,
  updateYouthRequestStatus,
  deleteYouthRequest,
} from "@/lib/db";
import { YouthProgramCategory, YOUTH_PROGRAM_CATEGORIES, YouthRequestStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type"); // "programs" | "requests" | "all"

    let programs = getYouthPrograms();
    if (category && category !== "الكل") {
      programs = programs.filter((p) => p.category === category);
    }

    const requests = getYouthRequests();

    if (type === "programs") {
      return NextResponse.json(
        { success: true, programs, total: programs.length },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    if (type === "requests") {
      return NextResponse.json(
        { success: true, requests, total: requests.length },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        programs,
        requests,
        totalPrograms: programs.length,
        totalRequests: requests.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching youth data:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تحميل بيانات فضاء الشباب." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || (body.title ? "program" : "request");

    // Action 1: Add a Youth Program / Opportunity
    if (action === "program") {
      const title = (body.title || "").trim();
      const category = (body.category || "").trim() as YouthProgramCategory;
      const institution = (body.institution || "").trim();
      const targetAudience = (body.targetAudience || "").trim();
      const address = (body.address || "").trim();
      const description = (body.description || "").trim();

      if (!title || !institution || !address) {
        return NextResponse.json(
          { success: false, error: "يرجى إدخال عنوان البرنامج، الهيكل المشرف، والمقر بمنوبة." },
          { status: 400 }
        );
      }

      if (!YOUTH_PROGRAM_CATEGORIES.includes(category)) {
        return NextResponse.json(
          {
            success: false,
            error: `يرجى تحديد صنف صالح (${YOUTH_PROGRAM_CATEGORIES.join("، ")}).`,
          },
          { status: 400 }
        );
      }

      // Process eligibilityCriteria
      let eligibilityCriteria: string[] = [];
      if (Array.isArray(body.eligibilityCriteria)) {
        eligibilityCriteria = body.eligibilityCriteria.map((c: any) => String(c).trim()).filter(Boolean);
      } else if (typeof body.eligibilityCriteria === "string") {
        eligibilityCriteria = body.eligibilityCriteria
          .split("\n")
          .map((s: string) => s.trim().replace(/^[-•*]\s*/, ""))
          .filter(Boolean);
      }

      // Process requiredDocuments
      let requiredDocuments: string[] = [];
      if (Array.isArray(body.requiredDocuments)) {
        requiredDocuments = body.requiredDocuments.map((d: any) => String(d).trim()).filter(Boolean);
      } else if (typeof body.requiredDocuments === "string") {
        requiredDocuments = body.requiredDocuments
          .split("\n")
          .map((s: string) => s.trim().replace(/^[-•*]\s*/, ""))
          .filter(Boolean);
      }

      const newProgram = addYouthProgram({
        title,
        category,
        institution,
        targetAudience: targetAudience || "خريجو الجامعات ورواد الأعمال الشبان",
        fundingCap: (body.fundingCap || "").trim() || undefined,
        eligibilityCriteria,
        requiredDocuments,
        address,
        contactPhone: (body.contactPhone || "").trim() || undefined,
        officialUrl: (body.officialUrl || "").trim() || undefined,
        description: description || title,
      });

      return NextResponse.json(
        {
          success: true,
          message: "تمت إضافة البرنامج التمويلي / التكويني بنجاح.",
          program: newProgram,
        },
        { status: 201 }
      );
    }

    // Action 2: Add a Youth Request for Follow-up / Support
    const fullName = (body.fullName || "").trim();
    const phone = (body.phone || "").replace(/\D/g, "");
    const zone = (body.zone || "منوبة المدينة").trim();
    const projectType = (body.projectType || "").trim();
    const targetInstitution = (body.targetInstitution || "البنك التونسي للتضامن (BTS)").trim();
    const issueDescription = (body.issueDescription || "").trim();

    if (!fullName || fullName.length < 3) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال الاسم واللقب بشكل صحيح." },
        { status: 400 }
      );
    }

    if (phone.length !== 8) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال رقم هاتف تونسي صالح (8 أرقام)." },
        { status: 400 }
      );
    }

    if (!projectType) {
      return NextResponse.json(
        { success: false, error: "يرجى تحديد طبيعة أو فكرة المشروع." },
        { status: 400 }
      );
    }

    if (!issueDescription || issueDescription.length < 10) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة شرح وافٍ للإشكال أو التعطيل التمويلي/الإداري." },
        { status: 400 }
      );
    }

    const newRequest = addYouthRequest({
      fullName,
      phone,
      zone,
      projectType,
      targetInstitution,
      issueDescription,
      notes: body.notes,
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم استلام وتسجيل طلب المرافقة والتدخل بنجاح.",
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating youth program or request:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء حفظ البيانات." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = (body.id || "").trim();
    const status = (body.status || "").trim() as YouthRequestStatus;
    const notes = body.notes;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف الطلب مطلوب للتحيين." },
        { status: 400 }
      );
    }

    const validStatuses: YouthRequestStatus[] = [
      "جديد",
      "بصدد المتابعة مع الإدارة/البنك",
      "تمت التسوية",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "حالة الطلب غير صالحة." },
        { status: 400 }
      );
    }

    const updated = updateYouthRequestStatus(id, status, notes);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "لم يتم العثور على الطلب المطلوب." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم تحيين حالة الطلب بنجاح.",
      request: updated,
    });
  } catch (error) {
    console.error("Error updating youth request status:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تحيين حالة الطلب." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    let type = searchParams.get("type") || "program"; // "program" | "request"

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
        if (body?.type) type = body.type;
      } catch {
        // ignore body parse failure
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف العنصر مطلوب للحذف." },
        { status: 400 }
      );
    }

    let deleted = false;
    if (type === "request") {
      deleted = deleteYouthRequest(id);
    } else {
      deleted = deleteYouthProgram(id);
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "لم يتم العثور على العنصر أو تعذر حذفه." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: type === "request" ? "تم حذف طلب المرافقة بنجاح." : "تم حذف البرنامج بنجاح.",
    });
  } catch (error) {
    console.error("Error deleting youth item:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء عملية الحذف." },
      { status: 500 }
    );
  }
}
