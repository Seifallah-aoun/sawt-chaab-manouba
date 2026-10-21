import { NextRequest, NextResponse } from "next/server";
import { 
  getCustomAlerts, 
  addCustomAlert, 
  deleteNewsItem, 
  getIngestedNews, 
  getAllDisplayNews, 
  getLastIngestionTime,
  togglePinNewsItem 
} from "@/lib/db";
import { runNewsIngestion } from "@/lib/newsIngest";

export async function GET(request: NextRequest) {
  try {
    const customAlerts = getCustomAlerts();
    let ingestedNews = getIngestedNews();

    // Auto-seed or run ingestion on cold start if empty
    if (!ingestedNews || ingestedNews.length === 0) {
      const ingestResult = await runNewsIngestion();
      ingestedNews = ingestResult.items;
    }

    const allDisplayNews = getAllDisplayNews();

    return NextResponse.json({
      success: true,
      news: allDisplayNews,
      customAlerts,
      ingestedNews,
      lastIngestionTime: getLastIngestionTime(),
      count: allDisplayNews.length,
      isLiveSynced: true,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/news:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء استرجاع الأخبار والتنبيهات." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Action: Pin or Unpin News Item
    if (body.action === "pin" && body.id) {
      const updated = togglePinNewsItem(body.id);
      if (!updated) {
        return NextResponse.json(
          { error: "الخبر غير موجود لتثبيته." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: updated.isPinned
          ? "تم تثبيت الخبر بنجاح في أعلى شريط الأخبار والصفحة الرئيسية."
          : "تم إلغاء تثبيت الخبر بنجاح.",
        item: updated,
      });
    }

    // Action: Trigger Ingestion Engine On Demand
    if (body.action === "ingest") {
      const result = await runNewsIngestion();
      return NextResponse.json({
        success: result.success,
        message: `تم تشغيل محرك الجلب واستقطاب ${result.newItemsCount} خبر جديد.`,
        totalCount: result.totalCount,
        newItemsCount: result.newItemsCount,
        items: result.items,
        lastIngestionTime: getLastIngestionTime(),
      });
    }

    // Default: Add Custom Alert from MP Office
    const { title, category, isUrgent } = body;

    if (!title || typeof title !== "string" || title.trim().length < 5) {
      return NextResponse.json(
        { error: "الرجاء كتابة نص التنبيه أو الخبر بشكل واضح (5 أحرف على الأقل)." },
        { status: 400 }
      );
    }

    const created = addCustomAlert({
      title: title.trim(),
      category: category || "تنبيه ميداني",
      isUrgent: isUrgent ?? true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم نشر التنبيه بنجاح وسيظهر فوراً في الشريط الإخباري والواجهة.",
        alert: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/news:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "الرجاء تحديد معرف الخبر المراد تعديله." },
        { status: 400 }
      );
    }

    const updated = togglePinNewsItem(id);
    if (!updated) {
      return NextResponse.json(
        { error: "الخبر غير موجود." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: updated.isPinned
        ? "تم تثبيت الخبر بنجاح في أعلى شريط الأخبار والصفحة الرئيسية."
        : "تم إلغاء تثبيت الخبر بنجاح.",
      item: updated,
    });
  } catch (error) {
    console.error("Error in PATCH /api/news:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعديل حالة الخبر." },
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
        { error: "الرجاء تحديد معرف الخبر أو التنبيه المراد حذفه." },
        { status: 400 }
      );
    }

    const deleted = deleteNewsItem(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "الخبر أو التنبيه غير موجود أو تم حذفه مسبقاً." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف الخبر/التنبيه (${id}) بنجاح وإزالته من المنصة بالكامل.`,
    });
  } catch (error) {
    console.error("Error in DELETE /api/news:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الخبر." },
      { status: 500 }
    );
  }
}
