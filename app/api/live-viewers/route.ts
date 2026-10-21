import { NextRequest, NextResponse } from "next/server";
import { getLiveStreamConfig, updateLiveStreamConfig } from "@/lib/db";

// In-memory active viewers registry: viewerId -> lastSeenTimestamp
const activeViewers = new Map<string, number>();

// Session timeout: 12 seconds of inactivity means viewer disconnected
const VIEWER_TIMEOUT_MS = 12000;

function cleanupExpiredViewers(): number {
  const now = Date.now();
  for (const [id, lastSeen] of activeViewers.entries()) {
    if (now - lastSeen > VIEWER_TIMEOUT_MS) {
      activeViewers.delete(id);
    }
  }
  return activeViewers.size;
}

export async function GET(request: NextRequest) {
  try {
    const config = getLiveStreamConfig();
    const isLive = Boolean(config.isLive ?? config.status === "live");

    if (!isLive) {
      activeViewers.clear();
      if (config.viewersCount !== 0) {
        updateLiveStreamConfig({ viewersCount: 0 });
      }
      return NextResponse.json(
        { success: true, count: 0, isLive: false },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const { searchParams } = new URL(request.url);
    const viewerId = searchParams.get("viewerId");

    if (viewerId && viewerId.trim().length > 0) {
      activeViewers.set(viewerId.trim(), Date.now());
    }

    const activeCount = cleanupExpiredViewers();

    if (config.viewersCount !== activeCount) {
      updateLiveStreamConfig({ viewersCount: activeCount });
    }

    return NextResponse.json(
      {
        success: true,
        count: activeCount,
        isLive: true,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/live-viewers:", error);
    return NextResponse.json({ success: false, count: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = getLiveStreamConfig();
    const isLive = Boolean(config.isLive ?? config.status === "live");

    const body = await request.json().catch(() => ({}));
    const viewerId = body.viewerId?.toString().trim();
    const action = body.action || "ping"; // "ping" | "leave"

    if (!isLive) {
      activeViewers.clear();
      if (config.viewersCount !== 0) {
        updateLiveStreamConfig({ viewersCount: 0 });
      }
      return NextResponse.json(
        { success: true, count: 0, isLive: false },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    if (viewerId) {
      if (action === "leave") {
        activeViewers.delete(viewerId);
      } else {
        activeViewers.set(viewerId, Date.now());
      }
    }

    const activeCount = cleanupExpiredViewers();

    if (config.viewersCount !== activeCount) {
      updateLiveStreamConfig({ viewersCount: activeCount });
    }

    return NextResponse.json({
      success: true,
      count: activeCount,
      isLive: true,
    });
  } catch (error) {
    console.error("Error in POST /api/live-viewers:", error);
    return NextResponse.json({ success: false, count: 0 }, { status: 500 });
  }
}
