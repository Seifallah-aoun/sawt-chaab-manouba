import { NextRequest, NextResponse } from "next/server";
import { getLiveStreamConfig, updateLiveStreamConfig } from "@/lib/db";

export async function GET() {
  try {
    const config = getLiveStreamConfig();
    const isLive = Boolean(config.isLive ?? config.status === "live");
    const streamUrl = config.streamUrl || config.videoUrl || "";
    const liveTitle = config.liveTitle || config.title || "";

    return NextResponse.json(
      {
        success: true,
        isLive,
        streamUrl,
        liveTitle,
        title: config.title,
        videoUrl: config.videoUrl,
        description: config.description,
        scheduledFor: config.scheduledFor,
        viewersCount: config.viewersCount ?? 0,
        startedAt: config.startedAt,
        status: config.status,
        updatedAt: config.updatedAt,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/live-status:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء قراءة حالة البث المباشر." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const current = getLiveStreamConfig();

    let targetIsLive = current.isLive ?? current.status === "live";

    if (body.action === "toggle") {
      targetIsLive = !targetIsLive;
    } else if (body.action === "go_live" || body.isLive === true) {
      targetIsLive = true;
    } else if (body.action === "end_live" || body.isLive === false) {
      targetIsLive = false;
    }

    const updates: Parameters<typeof updateLiveStreamConfig>[0] = {
      isLive: targetIsLive,
      status: targetIsLive ? "live" : "ended",
    };

    if (body.streamUrl !== undefined) {
      updates.streamUrl = body.streamUrl.trim();
      updates.videoUrl = body.streamUrl.trim();
    } else if (body.videoUrl !== undefined) {
      updates.streamUrl = body.videoUrl.trim();
      updates.videoUrl = body.videoUrl.trim();
    }

    if (body.liveTitle !== undefined) {
      updates.liveTitle = body.liveTitle.trim();
      updates.title = body.liveTitle.trim();
    } else if (body.title !== undefined) {
      updates.liveTitle = body.title.trim();
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description.trim();
    }

    if (body.scheduledFor !== undefined) {
      updates.scheduledFor = body.scheduledFor.trim();
    }

    if (targetIsLive) {
      updates.startedAt = current.startedAt || new Date().toISOString();
      updates.viewersCount = body.viewersCount ?? (current.viewersCount || 0);
    } else {
      updates.viewersCount = 0;
    }

    const updated = updateLiveStreamConfig(updates);

    return NextResponse.json({
      success: true,
      message: targetIsLive
        ? "تم بدء البث المباشر بنجاح وتحويل الصفحة الرئيسية للبث الحي!"
        : "تم إنهاء البث المباشر بنجاح وإظهار بطاقة الترقب الأنيقة للمواطنين.",
      isLive: updated.isLive,
      streamUrl: updated.streamUrl || updated.videoUrl,
      liveTitle: updated.liveTitle || updated.title,
      config: updated,
    });
  } catch (error) {
    console.error("Error in POST /api/live-status:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تعديل حالة البث المباشر." },
      { status: 500 }
    );
  }
}
