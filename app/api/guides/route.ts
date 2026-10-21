import { NextRequest, NextResponse } from "next/server";
import { INITIAL_GUIDES, addGuide, updateGuide, deleteGuide } from "@/lib/db";
import { getStoreItem, setStoreItem } from "@/lib/platform-store";
import { GuideItem, GuideCategory, GUIDE_CATEGORIES } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const category = (searchParams.get("category") || "").trim();

    let guides = await getStoreItem<GuideItem[]>("guides", INITIAL_GUIDES);

    if (category && category !== "الكل") {
      guides = guides.filter((g) => g.category === category);
    }

    if (query) {
      guides = guides.filter((g) => {
        const matchTitle = g.title.toLowerCase().includes(query);
        const matchLocation = g.location.toLowerCase().includes(query);
        const matchKeywords = Array.isArray(g.keywords) && g.keywords.some((kw) => kw.toLowerCase().includes(query));
        const matchDocs = Array.isArray(g.requiredDocuments) && g.requiredDocuments.some((doc) => doc.toLowerCase().includes(query));
        const matchSteps = Array.isArray(g.steps) && g.steps.some((st) => st.toLowerCase().includes(query));
        return matchTitle || matchLocation || matchKeywords || matchDocs || matchSteps;
      });
    }

    return NextResponse.json(
      {
        success: true,
        guides,
        total: guides.length,
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
    console.error("Error fetching administrative guides:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تحميل الدليل الإداري." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = (body.title || "").trim();
    const category = (body.category || "").trim() as GuideCategory;
    const location = (body.location || "").trim();

    if (!title) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال اسم أو عنوان الإجراء الإداري." },
        { status: 400 }
      );
    }

    if (!GUIDE_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `يرجى تحديد صنف صالح للإجراء (${GUIDE_CATEGORIES.join("، ")}).` 
        },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { success: false, error: "يرجى تحديد الإدارة المختصة ومقرها بمنوبة أو الدندان." },
        { status: 400 }
      );
    }

    let requiredDocuments: string[] = [];
    if (Array.isArray(body.requiredDocuments)) {
      requiredDocuments = body.requiredDocuments.map((d: any) => String(d).trim()).filter(Boolean);
    } else if (typeof body.requiredDocuments === "string") {
      requiredDocuments = body.requiredDocuments
        .split("\n")
        .map((s: string) => s.trim().replace(/^[-•*]\s*/, ""))
        .filter(Boolean);
    }

    if (requiredDocuments.length === 0) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال وثيقة واحدة مطلوبة على الأقل في شكل نقاط." },
        { status: 400 }
      );
    }

    let keywords: string[] = [];
    if (Array.isArray(body.keywords)) {
      keywords = body.keywords.map((k: any) => String(k).trim()).filter(Boolean);
    } else if (typeof body.keywords === "string") {
      keywords = body.keywords
        .split(/[,،\n]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    let steps: string[] = [];
    if (Array.isArray(body.steps)) {
      steps = body.steps.map((st: any) => String(st).trim()).filter(Boolean);
    } else if (typeof body.steps === "string" && body.steps.trim()) {
      steps = body.steps
        .split("\n")
        .map((s: string) => s.trim().replace(/^\d+[\.\-)]\s*/, ""))
        .filter(Boolean);
    }

    const downloadableFormUrl = (body.downloadableFormUrl || "").trim() || undefined;
    const processingTime = (body.processingTime || "").trim() || undefined;
    const cost = (body.cost || "").trim() || undefined;

    const newGuide: GuideItem = {
      id: `GD-${Date.now().toString().slice(-4)}`,
      title,
      category,
      keywords,
      requiredDocuments,
      steps: steps.length > 0 ? steps : undefined,
      location,
      processingTime,
      cost,
      downloadableFormUrl,
      departmentContact: body.departmentContact || undefined,
    };

    const currentGuides = await getStoreItem<GuideItem[]>("guides", INITIAL_GUIDES);
    currentGuides.unshift(newGuide);
    await setStoreItem("guides", currentGuides);
    try { addGuide(newGuide); } catch {}

    return NextResponse.json(
      {
        success: true,
        message: "تمت إضافة الإجراء الإداري إلى الدليل بنجاح.",
        guide: newGuide,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating guide:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء حفظ الإجراء الإداري." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = (body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف الإجراء مطلوب للتحيين." },
        { status: 400 }
      );
    }

    const currentGuides = await getStoreItem<GuideItem[]>("guides", INITIAL_GUIDES);
    const existingIdx = currentGuides.findIndex((g) => g.id.toLowerCase() === id.toLowerCase());

    if (existingIdx === -1) {
      return NextResponse.json(
        { success: false, error: "الإجراء الإداري المطلوب غير موجود." },
        { status: 404 }
      );
    }

    const existing = currentGuides[existingIdx];
    const updates: Partial<GuideItem> = {};

    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.category !== undefined && GUIDE_CATEGORIES.includes(body.category)) {
      updates.category = body.category;
    }
    if (body.location !== undefined) updates.location = String(body.location).trim();
    if (body.downloadableFormUrl !== undefined) {
      updates.downloadableFormUrl = String(body.downloadableFormUrl).trim() || undefined;
    }
    if (body.processingTime !== undefined) {
      updates.processingTime = String(body.processingTime).trim() || undefined;
    }
    if (body.cost !== undefined) {
      updates.cost = String(body.cost).trim() || undefined;
    }

    if (body.requiredDocuments !== undefined) {
      if (Array.isArray(body.requiredDocuments)) {
        updates.requiredDocuments = body.requiredDocuments.map((d: any) => String(d).trim()).filter(Boolean);
      } else if (typeof body.requiredDocuments === "string") {
        updates.requiredDocuments = body.requiredDocuments
          .split("\n")
          .map((s: string) => s.trim().replace(/^[-•*]\s*/, ""))
          .filter(Boolean);
      }
    }

    if (body.keywords !== undefined) {
      if (Array.isArray(body.keywords)) {
        updates.keywords = body.keywords.map((k: any) => String(k).trim()).filter(Boolean);
      } else if (typeof body.keywords === "string") {
        updates.keywords = body.keywords
          .split(/[,،\n]+/)
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
    }

    if (body.steps !== undefined) {
      if (Array.isArray(body.steps)) {
        updates.steps = body.steps.map((st: any) => String(st).trim()).filter(Boolean);
      } else if (typeof body.steps === "string") {
        updates.steps = body.steps
          .split("\n")
          .map((s: string) => s.trim().replace(/^\d+[\.\-)]\s*/, ""))
          .filter(Boolean);
      }
    }

    if (body.departmentContact !== undefined) {
      updates.departmentContact = body.departmentContact;
    }

    const updated = { ...existing, ...updates };
    currentGuides[existingIdx] = updated;
    await setStoreItem("guides", currentGuides);
    try { updateGuide(id, updates); } catch {}

    return NextResponse.json({
      success: true,
      message: "تم تحيين الإجراء الإداري بنجاح.",
      guide: updated,
    });
  } catch (error) {
    console.error("Error updating guide:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تحيين الإجراء الإداري." },
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
        id = body?.id;
      } catch {
        // ignore
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف الإجراء مطلوب للحذف." },
        { status: 400 }
      );
    }

    const currentGuides = await getStoreItem<GuideItem[]>("guides", INITIAL_GUIDES);
    const initialLen = currentGuides.length;
    const filtered = currentGuides.filter((g) => g.id.toLowerCase() !== id!.toLowerCase());

    if (filtered.length !== initialLen) {
      await setStoreItem("guides", filtered);
    }
    try { deleteGuide(id); } catch {}

    return NextResponse.json({
      success: true,
      message: "تم حذف الإجراء الإداري من الدليل بنجاح.",
    });
  } catch (error) {
    console.error("Error deleting guide:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء حذف الإجراء الإداري." },
      { status: 500 }
    );
  }
}
