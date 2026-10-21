import { NextRequest, NextResponse } from "next/server";
import { getProjects, addProject, deleteProject } from "@/lib/db";
import { ProjectItem } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const projects = getProjects();
    return NextResponse.json(
      { success: true, projects },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء استرجاع قائمة المشاريع." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = (body.projectName || body.title || "").trim();
    const targetMinistry = (body.ministry || body.targetMinistry || "").trim();
    const summary = (body.summary || "").trim();
    const zone = (body.zone || "دائرة منوبة - الدندان").trim();
    const budgetEstimate = (body.budgetEstimate || "").trim();
    const rawProgress = typeof body.progress === "number" ? body.progress : parseInt(body.progress || "0", 10);
    const progress = Math.max(0, Math.min(100, isNaN(rawProgress) ? 0 : rawProgress));
    
    let status: ProjectItem["status"] = body.status || "في طور الإنجاز";
    if (!["في انتظار رد الوزارة", "في طور الإنجاز", "تم التدخل", "تم إنجازه"].includes(status)) {
      status = "في طور الإنجاز";
    }

    if (!title) {
      return NextResponse.json(
        { error: "الرجاء إدخال عنوان المشروع أو موضوع المساءلة." },
        { status: 400 }
      );
    }

    if (!targetMinistry) {
      return NextResponse.json(
        { error: "الرجاء تحديد الوزارة أو الهيكل العمومي المعني." },
        { status: 400 }
      );
    }

    if (!summary) {
      return NextResponse.json(
        { error: "الرجاء إدخال ملخص للمشروع أو نص المتابعة البرلمانية." },
        { status: 400 }
      );
    }

    const officialLetterText = (
      body.officialLetterText ||
      `مراسلة برلمانية ومتابعة حثيثة صادرة عن المكتب البرلماني للنائب أسماء درويش موجهة إلى ${targetMinistry}.`
    ).trim();

    const newProject: ProjectItem = {
      id: `PRJ-${Date.now().toString().slice(-4)}`,
      title,
      zone,
      targetMinistry,
      status,
      progress,
      summary,
      officialLetterText,
      lastUpdate: "تم التحيين من المكتب البرلماني للنائب أسماء درويش",
      budgetEstimate: budgetEstimate || undefined,
    };

    const saved = addProject(newProject);

    return NextResponse.json(
      {
        success: true,
        message: "تمت إضافة المشروع بنجاح إلى رادار المشاريع والمساءلة الوزارية.",
        project: saved,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ المشروع." },
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
        { error: "الرجاء تحديد معرف المشروع المراد حذفه." },
        { status: 400 }
      );
    }

    const deleted = deleteProject(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "المشروع غير موجود أو تم حذفه مسبقاً." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف المشروع (${id}) بنجاح وإزالته من رادار المشاريع.`,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المشروع." },
      { status: 500 }
    );
  }
}
