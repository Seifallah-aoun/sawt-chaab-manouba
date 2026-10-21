import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LIVE_STREAM, getLiveStreamConfig, updateLiveStreamConfig } from "@/lib/db";
import { getStoreItem, setStoreItem } from "@/lib/platform-store";
import { LiveStreamConfig } from "@/lib/types";

export async function GET() {
  try {
    const config = await getStoreItem<LiveStreamConfig>("liveStream", DEFAULT_LIVE_STREAM);
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
    const current = await getStoreItem<LiveStreamConfig>("liveStream", DEFAULT_LIVE_STREAM);

    let targetIsLive = current.isLive ?? current.status === "live";

    if (body.action === "toggle") {
      targetIsLive = !targetIsLive;
    } else if (body.action === "go_live" || body.isLive === true) {
      targetIsLive = true;
    } else if (body.action === "end_live" || body.isLive === false) {
      targetIsLive = false;
    }

    const updatedConfig: LiveStreamConfig = {
      ...current,
      isLive: targetIsLive,
      status: targetIsLive ? "live" : "ended",
      updatedAt: new Date().toISOString(),
    };

    if (body.streamUrl !== undefined) {
      updatedConfig.streamUrl = body.streamUrl.trim();
      updatedConfig.videoUrl = body.streamUrl.trim();
    } else if (body.videoUrl !== undefined) {
      updatedConfig.streamUrl = body.videoUrl.trim();
      updatedConfig.videoUrl = body.videoUrl.trim();
    }

    if (body.liveTitle !== undefined) {
      updatedConfig.liveTitle = body.liveTitle.trim();
      updatedConfig.title = body.liveTitle.trim();
    } else if (body.title !== undefined) {
      updatedConfig.liveTitle = body.title.trim();
      updatedConfig.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updatedConfig.description = body.description.trim();
    }

    if (body.scheduledFor !== undefined) {
      updatedConfig.scheduledFor = body.scheduledFor.trim();
    }

    if (targetIsLive) {
      updatedConfig.startedAt = current.startedAt || new Date().toISOString();
      updatedConfig.viewersCount = body.viewersCount ?? (current.viewersCount || 0);
    } else {
      updatedConfig.viewersCount = 0;
    }

    await setStoreItem("liveStream", updatedConfig);
    try { updateLiveStreamConfig(updatedConfig); } catch {}

    return NextResponse.json({
      success: true,
      message: targetIsLive
        ? "تم بدء البث المباشر بنجاح وتحويل الصفحة الرئيسية للبث الحي!"
        : "تم إنهاء البث المباشر بنجاح وإظهار بطاقة الترقب الأنيقة للمواطنين.",
      isLive: updatedConfig.isLive,
      streamUrl: updatedConfig.streamUrl || updatedConfig.videoUrl,
      liveTitle: updatedConfig.liveTitle,
      config: updatedConfig,
    });
  } catch (error) {
    console.error("Error updating live stream status:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تعديل حالة البث." },
      { status: 500 }
    );
  }
}
