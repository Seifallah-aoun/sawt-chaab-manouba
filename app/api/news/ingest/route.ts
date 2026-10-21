import { NextRequest, NextResponse } from "next/server";
import { runNewsIngestion } from "@/lib/newsIngest";
import { getLastIngestionTime } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const result = await runNewsIngestion();
    return NextResponse.json(
      {
        success: result.success,
        message: "تم تحديث وجلب آخر الأخبار البرلمانية والجهوية آلياً بنجاح.",
        totalCount: result.totalCount,
        newItemsCount: result.newItemsCount,
        lastIngestionTime: getLastIngestionTime(),
        items: result.items,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/news/ingest:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تشغيل محرك جلب الأخبار." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await runNewsIngestion();
    return NextResponse.json(
      {
        success: result.success,
        message: `تم جلب وتحديث الأخبار (${result.newItemsCount} خبر جديد).`,
        totalCount: result.totalCount,
        newItemsCount: result.newItemsCount,
        lastIngestionTime: getLastIngestionTime(),
        items: result.items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/news/ingest:", error);
    return NextResponse.json(
      { error: "فشل استدعاء محرك استقطاب الأخبار." },
      { status: 500 }
    );
  }
}
