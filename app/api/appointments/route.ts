import { NextRequest, NextResponse } from "next/server";
import { 
  INITIAL_APPOINTMENTS, 
  DEFAULT_APPOINTMENT_SETTINGS,
  createAppointment, 
  deleteAppointment, 
  updateAppointmentStatus,
  updateAppointmentSettings 
} from "@/lib/db";
import { getStoreItem, setStoreItem } from "@/lib/platform-store";
import { Appointment, AppointmentSettings } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const appointments = await getStoreItem<Appointment[]>("appointments", INITIAL_APPOINTMENTS);
    const settings = await getStoreItem<AppointmentSettings>("appointmentSettings", DEFAULT_APPOINTMENT_SETTINGS);

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
      const currentSettings = await getStoreItem<AppointmentSettings>("appointmentSettings", DEFAULT_APPOINTMENT_SETTINGS);
      const updatedSettings: AppointmentSettings = {
        days: Array.isArray(days) ? days : currentSettings.days,
        timeSlots: Array.isArray(timeSlots) ? timeSlots : currentSettings.timeSlots,
        note: typeof note === "string" ? note : currentSettings.note,
      };

      await setStoreItem("appointmentSettings", updatedSettings);
      try { updateAppointmentSettings(updatedSettings); } catch {}

      return NextResponse.json({
        success: true,
        message: "تم حفظ وتحديث إعدادات وأوقات الاستقبال المباشر بنجاح في قاعدة البيانات السحابية.",
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

    const newId = `RDV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAppointment: Appointment = {
      id: newId,
      createdAt: new Date().toISOString(),
      citizenName: citizenName.trim(),
      phone: cleanPhone,
      zone: zone || "منوبة المدينة",
      date,
      timeSlot,
      topic: topic || "مقابلة عامة لمتابعة مشاغل الجهة",
      status: "مؤكد",
      notes: "المكتب البرلماني للنائب أسماء درويش - شارع الحبيب بورقيبة، منوبة",
    };

    const currentAppointments = await getStoreItem<Appointment[]>("appointments", INITIAL_APPOINTMENTS);
    currentAppointments.unshift(newAppointment);
    await setStoreItem("appointments", currentAppointments);

    try { createAppointment(newAppointment); } catch {}

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

    const currentAppointments = await getStoreItem<Appointment[]>("appointments", INITIAL_APPOINTMENTS);
    const target = currentAppointments.find((a) => a.id.toUpperCase() === id.toUpperCase());

    if (!target) {
      return NextResponse.json(
        { error: "الموعد غير موجود." },
        { status: 404 }
      );
    }

    target.status = status;
    await setStoreItem("appointments", currentAppointments);
    try { updateAppointmentStatus(id, status); } catch {}

    return NextResponse.json({
      success: true,
      message: "تم تحديث حالة الموعد بنجاح.",
      appointment: target,
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

    const currentAppointments = await getStoreItem<Appointment[]>("appointments", INITIAL_APPOINTMENTS);
    const initialLen = currentAppointments.length;
    const filtered = currentAppointments.filter((a) => a.id.toUpperCase() !== id!.toUpperCase());

    if (filtered.length !== initialLen) {
      await setStoreItem("appointments", filtered);
    }
    try { deleteAppointment(id); } catch {}

    return NextResponse.json({
      success: true,
      message: `تم حذف الموعد (${id}) بنجاح من قاعدة البيانات.`,
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الموعد." },
      { status: 500 }
    );
  }
}
