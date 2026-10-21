import { NextRequest, NextResponse } from "next/server";
import { 
  getLiveStreamConfig, 
  updateLiveStreamConfig, 
  getLiveChatMessages, 
  addLiveChatMessage, 
  convertChatToComplaint, 
  deleteLiveChatMessage, 
  togglePinLiveChatMessage 
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const config = getLiveStreamConfig();
    const messages = getLiveChatMessages();

    return NextResponse.json({
      success: true,
      config,
      messages,
      count: messages.length,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/live:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء استرجاع بيانات البث والدردشة." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Convert Chat Question to Official Citizen Petition
    if (body.action === "convert_to_complaint") {
      const { messageId } = body;
      if (!messageId) {
        return NextResponse.json(
          { error: "الرجاء تحديد معرف الرسالة المراد تحويلها." },
          { status: 400 }
        );
      }

      const result = convertChatToComplaint(messageId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "فشل تحويل السؤال إلى مطلب رسمي." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `تم تحويل السؤال بنجاح إلى المطلب الرسمي (${result.complaint?.id}) وإدراجه في جدول العرائض.`,
        complaint: result.complaint,
        chatMessage: result.message,
      });
    }

    // 2. Toggle Pin on Chat Message
    if (body.action === "toggle_pin") {
      const { messageId } = body;
      if (!messageId) {
        return NextResponse.json(
          { error: "معرف الرسالة غير موجود." },
          { status: 400 }
        );
      }
      const updated = togglePinLiveChatMessage(messageId);
      if (!updated) {
        return NextResponse.json(
          { error: "الرسالة غير موجودة." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: updated.isPinned ? "تم تثبيت السؤال في البث." : "تم إلغاء التثبيت.",
        chatMessage: updated,
      });
    }

    // 3. Update Live Stream Settings
    if (body.action === "update_config" || body.action === "set_live_status") {
      const { title, liveTitle, description, videoUrl, streamUrl, status, isLive, scheduledFor } = body;
      const updated = updateLiveStreamConfig({
        ...(title !== undefined && { title: title.trim(), liveTitle: title.trim() }),
        ...(liveTitle !== undefined && { liveTitle: liveTitle.trim(), title: liveTitle.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl.trim(), streamUrl: videoUrl.trim() }),
        ...(streamUrl !== undefined && { streamUrl: streamUrl.trim(), videoUrl: streamUrl.trim() }),
        ...(status !== undefined && { status }),
        ...(isLive !== undefined && { isLive: Boolean(isLive) }),
        ...(scheduledFor !== undefined && { scheduledFor: scheduledFor.trim() }),
      });

      return NextResponse.json({
        success: true,
        message: "تم تحديث إعدادات البث المباشر بنجاح.",
        config: updated,
      });
    }

    // 4. Default: Citizen Submits Live Chat Question
    const { citizenName, zone, phone, message } = body;

    if (!citizenName || typeof citizenName !== "string" || citizenName.trim().length < 2) {
      return NextResponse.json(
        { error: "الرجاء إدخال الاسم واللقب." },
        { status: 400 }
      );
    }

    if (!zone || typeof zone !== "string" || zone.trim().length < 2) {
      return NextResponse.json(
        { error: "الرجاء اختيار العمادة أو الحي التابع لمنوبة - الدندان." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 3) {
      return NextResponse.json(
        { error: "الرجاء كتابة السؤال أو المطلب بوضوح (3 أحرف على الأقل)." },
        { status: 400 }
      );
    }

    const createdMsg = addLiveChatMessage({
      citizenName: citizenName.trim(),
      zone: zone.trim(),
      phone: phone ? phone.trim() : undefined,
      message: message.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إرسال سؤالكم بنجاح وسيظهر فوراً في البث المباشر.",
        chatMessage: createdMsg,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/live:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب." },
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
        // empty body
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "الرجاء تحديد معرف الرسالة المراد حذفها." },
        { status: 400 }
      );
    }

    const deleted = deleteLiveChatMessage(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "الرسالة غير موجودة أو تم حذفها مسبقاً." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف الرسالة بنجاح.",
    });
  } catch (error) {
    console.error("Error in DELETE /api/live:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الرسالة." },
      { status: 500 }
    );
  }
}
