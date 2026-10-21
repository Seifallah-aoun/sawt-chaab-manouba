import { NextRequest, NextResponse } from "next/server";
import { 
  getAppointments, 
  createAppointment, 
  deleteAppointment, 
  updateAppointmentStatus,
  getAppointmentSettings,
  updateAppointmentSettings 
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const appointments = getAppointments();
    const settings = getAppointmentSettings();
    return NextResponse.json(
      { success: true, appointments, settings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء استرجاع المواعيد." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a settings update request
    if (body.action === "update_settings") {
      const { days, timeSlots, note } = body;
      const updatedSettings = updateAppointmentSettings({ days, timeSlots, note });
      return NextResponse.json({
        success: true,
        message: "تم حفظ وتحديث إعدادات وأوقات الاستقبال المباشر بنجاح.",
        settings: updatedSettings,
      });
    }

    const { citizenName, phone, zone, date, timeSlot, topic } = body;

    if (!citizenName || citizenName.trim().length < 3) {
      return NextResponse.json(
        { error: "الرجاء إدخال الاسم واللقب بشكل صحيح." },
        { status: 400 }
      );
    }

    const cleanPhone = (phone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 8) {
      return NextResponse.json(
        { error: "الرجاء إدخال رقم هاتف تونسي متكون من 8 أرقام." },
        { status: 400 }
      );
    }

    if (!date || !timeSlot) {
      return NextResponse.json(
        { error: "الرجاء تحديد اليوم والتوقيت المناسب للمقابلة." },
        { status: 400 }
      );
    }

    const newAppointment = createAppointment({
      citizenName,
      phone: cleanPhone,
      zone: zone || "منوبة",
      date,
      timeSlot,
      topic: topic || "مقابلة عامة لمتابعة مشاغل الجهة",
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم تأكيد حجز موعدك بمكتب النائب أسماء درويش بنجاح.",
        appointment: newAppointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الموعد." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "معرف الموعد والحالة مطلوبان." },
        { status: 400 }
      );
    }

    const updated = updateAppointmentStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: "الموعد غير موجود." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث حالة الموعد بنجاح.",
      appointment: updated,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الموعد." },
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
        { error: "الرجاء تحديد معرف الموعد المراد حذفه." },
        { status: 400 }
      );
    }

    const deleted = deleteAppointment(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "الموعد غير موجود أو تم حذفه مسبقاً." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف الموعد (${id}) بنجاح.`,
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الموعد." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { days, timeSlots, note } = body;
    const updatedSettings = updateAppointmentSettings({ days, timeSlots, note });
    return NextResponse.json({
      success: true,
      message: "تم حفظ وتحديث إعدادات وأوقات الاستقبال المباشر بنجاح.",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating appointment settings:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث إعدادات المواعيد." },
      { status: 500 }
    );
  }
}
