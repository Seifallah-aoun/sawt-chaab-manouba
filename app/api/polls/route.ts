import { NextRequest, NextResponse } from "next/server";
import { INITIAL_POLLS, addPoll, deletePoll, voteInPoll } from "@/lib/db";
import { getStoreItem, setStoreItem } from "@/lib/platform-store";
import { PollItem } from "@/lib/types";

export async function GET() {
  try {
    const polls = await getStoreItem<PollItem[]>("polls", INITIAL_POLLS);
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

      const newPoll: PollItem = {
        id: `POL-${Date.now().toString().slice(-4)}`,
        title: title.trim(),
        zone: zone || "دائرة منوبة - الدندان",
        description: description || `استشارة تشريعية موجهة لمتساكني ${zone || "دائرة منوبة - الدندان"} لإبداء الرأي.`,
        options: finalOptions,
        totalVotes: 0,
        endDate: endDate || "31 ديسمبر 2026",
      };

      const currentPolls = await getStoreItem<PollItem[]>("polls", INITIAL_POLLS);
      currentPolls.unshift(newPoll);
      await setStoreItem("polls", currentPolls);
      try { addPoll(newPoll); } catch {}

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

    const currentPolls = await getStoreItem<PollItem[]>("polls", INITIAL_POLLS);
    const targetPoll = currentPolls.find((p) => p.id === pollId);
    if (!targetPoll) {
      return NextResponse.json(
        { error: "الاستشارة غير موجودة." },
        { status: 404 }
      );
    }

    const targetOpt = targetPoll.options.find((o) => o.id === optionId);
    if (!targetOpt) {
      return NextResponse.json(
        { error: "الخيار غير موجود." },
        { status: 404 }
      );
    }

    targetOpt.votes += 1;
    targetPoll.totalVotes = targetPoll.options.reduce((acc, opt) => acc + opt.votes, 0);

    await setStoreItem("polls", currentPolls);
    try { voteInPoll(pollId, optionId); } catch {}

    return NextResponse.json({
      success: true,
      message: "تم تسجيل صوتك بنجاح، شكراً لمشاركتك المواطنية!",
      poll: targetPoll,
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

    const currentPolls = await getStoreItem<PollItem[]>("polls", INITIAL_POLLS);
    const initialLen = currentPolls.length;
    const filtered = currentPolls.filter((p) => p.id.toUpperCase() !== id!.toUpperCase());

    if (filtered.length !== initialLen) {
      await setStoreItem("polls", filtered);
    }
    try { deletePoll(id); } catch {}

    return NextResponse.json({
      success: true,
      message: `تم حذف الاستشارة (${id}) بنجاح من قاعدة البيانات.`,
    });
  } catch (error) {
    console.error("Error deleting poll:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الاستشارة." },
      { status: 500 }
    );
  }
}
