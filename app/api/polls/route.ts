import { NextRequest, NextResponse } from "next/server";
import { getPolls, voteInPoll, addPoll, deletePoll } from "@/lib/db";

export async function GET() {
  try {
    const polls = getPolls();
    return NextResponse.json({ success: true, polls });
  } catch (error) {
    console.error("Error fetching polls:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء استرجاع الاستشارات." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if creating a new legislative poll
    if (body.title) {
      const { title, zone, description, options, endDate } = body;
      if (title.trim().length < 5) {
        return NextResponse.json(
          { error: "الرجاء إدخال عنوان استشارة واضح (5 أحرف على الأقل)." },
          { status: 400 }
        );
      }

      // Default Yes/No legislative voting options if custom options are not provided
      const defaultOptions = [
        { id: "yes", label: "نعم / أوافق (مع)", votes: 0 },
        { id: "no", label: "لا / أرفض (ضد)", votes: 0 },
      ];

      const finalOptions = Array.isArray(options) && options.length >= 2
        ? options.map((opt: { id?: string; label: string; votes?: number }, idx: number) => ({
            id: opt.id || `opt-${idx + 1}`,
            label: opt.label,
            votes: opt.votes || 0,
          }))
        : defaultOptions;

      const newPoll = addPoll({
        title: title.trim(),
        zone: zone || "دائرة منوبة - الدندان",
        description: description || `استشارة تشريعية موجهة لمتساكني ${zone || "دائرة منوبة - الدندان"} لإبداء الرأي.`,
        options: finalOptions,
        endDate: endDate || "31 ديسمبر 2026",
      });

      return NextResponse.json({
        success: true,
        message: "تم إنشاء الاستشارة التشريعية ونشرها للتصويت بنجاح.",
        poll: newPoll,
      }, { status: 201 });
    }

    // Otherwise, vote in existing poll
    const { pollId, optionId } = body;
    if (!pollId || !optionId) {
      return NextResponse.json(
        { error: "الرجاء تحديد الاستشارة والخيار المطلوب للتصويت." },
        { status: 400 }
      );
    }

    const updatedPoll = voteInPoll(pollId, optionId);
    if (!updatedPoll) {
      return NextResponse.json(
        { error: "الاستشارة أو الخيار غير موجود." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم تسجيل صوتك بنجاح، شكراً لمشاركتك المواطنية!",
      poll: updatedPoll,
    });
  } catch (error) {
    console.error("Error submitting poll action:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الاستشارة." },
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
        { error: "الرجاء تحديد معرف الاستشارة المراد حذفها." },
        { status: 400 }
      );
    }

    const deleted = deletePoll(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "الاستشارة غير موجودة أو تم حذفها مسبقاً." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف الاستشارة (${id}) بنجاح.`,
    });
  } catch (error) {
    console.error("Error deleting poll:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الاستشارة." },
      { status: 500 }
    );
  }
}
