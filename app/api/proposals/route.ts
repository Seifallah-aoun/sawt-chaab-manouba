import { NextRequest, NextResponse } from "next/server";
import { INITIAL_PROPOSALS } from "@/lib/proposals-data";
import { getStoreItem, setStoreItem, updateStoreItem } from "@/lib/platform-store";
import { LegislativeProposal, ProposalStatus, ProposalType } from "@/lib/types";

const STORE_KEY = "legislative_proposals";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const type = (searchParams.get("type") || "").trim();
    const yearStr = (searchParams.get("year") || "").trim();
    const mpOnly = searchParams.get("mpOnly") === "true";

    let proposals = await getStoreItem<LegislativeProposal[]>(STORE_KEY, INITIAL_PROPOSALS);

    // If stored proposals have fewer items than comprehensive INITIAL_PROPOSALS, merge missing items
    if (proposals.length < INITIAL_PROPOSALS.length) {
      const existingIds = new Set(proposals.map((p) => p.id));
      const existingNumbers = new Set(proposals.map((p) => p.number));
      const missing = INITIAL_PROPOSALS.filter(
        (p) => !existingIds.has(p.id) && !existingNumbers.has(p.number)
      );
      if (missing.length > 0) {
        proposals = [...proposals, ...missing];
        setStoreItem(STORE_KEY, proposals).catch(() => {});
      }
    }

    // Filter by MP Asma Derouiche direct initiatives
    if (mpOnly) {
      proposals = proposals.filter((p) => p.isMpInitiative === true);
    }

    // Filter by type
    if (type && type !== "الكل") {
      proposals = proposals.filter((p) => p.type === type);
    }

    // Filter by year
    if (yearStr && yearStr !== "الكل") {
      const targetYear = parseInt(yearStr, 10);
      if (!isNaN(targetYear)) {
        proposals = proposals.filter((p) => p.year === targetYear);
      }
    }

    // Filter by search query
    if (query) {
      proposals = proposals.filter((p) => {
        const matchTitle = (p.title || "").toLowerCase().includes(query);
        const matchNumber = (p.number || "").toLowerCase().includes(query);
        const matchCommittee = (p.committee || "").toLowerCase().includes(query);
        const matchSummary = (p.summary || "").toLowerCase().includes(query);
        const matchAuthority = (p.targetAuthority || "").toLowerCase().includes(query);
        return matchTitle || matchNumber || matchCommittee || matchSummary || matchAuthority;
      });
    }

    return NextResponse.json(
      {
        success: true,
        proposals,
        total: proposals.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching legislative proposals:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تحميل مقترحات ومشاريع القوانين." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Reset / Seed to official comprehensive ARP dataset
    if (body.action === "reset_seed") {
      await setStoreItem(STORE_KEY, INITIAL_PROPOSALS);
      return NextResponse.json({
        success: true,
        proposals: INITIAL_PROPOSALS,
        total: INITIAL_PROPOSALS.length,
        message: "تمت استعادة حزمة المبادرات البرلمانية الرسمية الكاملة (2023 - 2026) بنجاح.",
      });
    }

    // 2. Bulk Import (JSON or parsed CSV items)
    if (body.action === "bulk_import") {
      const items = Array.isArray(body.items) ? (body.items as LegislativeProposal[]) : [];
      if (items.length === 0) {
        return NextResponse.json(
          { success: false, error: "قائمة العناصر المراد استيرادها فارغة." },
          { status: 400 }
        );
      }
      const mode = body.mode === "replace" ? "replace" : "append";
      const updatedList = await updateStoreItem<LegislativeProposal[]>(
        STORE_KEY,
        (current) => {
          if (mode === "replace") return items;
          const existingIds = new Set(current.map((x) => x.id));
          const existingNumbers = new Set(current.map((x) => x.number));
          const toAdd = items.filter(
            (x) => !existingIds.has(x.id) && !existingNumbers.has(x.number)
          );
          return [...toAdd, ...current];
        },
        INITIAL_PROPOSALS
      );
      return NextResponse.json({
        success: true,
        total: updatedList.length,
        message: `تم استيراد ${items.length} مبادرة بنجاح.`,
      });
    }

    // 3. Create single proposal
    const title = (body.title || "").trim();
    const number = (body.number || "").trim();
    const committee = (body.committee || "").trim();
    const depositDate = (body.depositDate || "").trim();
    const type = (body.type || "مقترح قانون") as ProposalType;
    const status = (body.status || "قيد الدرس باللجنة") as ProposalStatus;
    const summary = (body.summary || "").trim();
    const arpUrl = (body.arpUrl || "").trim();
    const year = Number(body.year) || new Date().getFullYear();
    const pdfUrl = (body.pdfUrl || "").trim() || undefined;
    const pdfName = (body.pdfName || "").trim() || undefined;
    const targetAuthority = (body.targetAuthority || "").trim() || undefined;
    const signatories = (body.signatories || "").trim() || "النائب أسماء درويش ومجموعة من النواب";

    if (!title || !number || !committee) {
      return NextResponse.json(
        { success: false, error: "الرجاء تعمير الحقول الإلزامية: الرقم، العنوان، واللجنة المعنية." },
        { status: 400 }
      );
    }

    const newProposal: LegislativeProposal = {
      id: `PROP-${Date.now().toString(36).toUpperCase()}`,
      number,
      title,
      type,
      depositDate: depositDate || new Date().toLocaleDateString("ar-TN"),
      year,
      committee,
      status,
      arpUrl: arpUrl || undefined,
      summary,
      pdfUrl,
      pdfName,
      targetAuthority,
      signatories,
      isMpInitiative: Boolean(body.isMpInitiative),
      mpRole: body.mpRole ? String(body.mpRole).trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = await updateStoreItem<LegislativeProposal[]>(
      STORE_KEY,
      (current) => [newProposal, ...current],
      INITIAL_PROPOSALS
    );

    return NextResponse.json({
      success: true,
      proposal: newProposal,
      total: updatedList.length,
    });
  } catch (error) {
    console.error("Error creating legislative proposal:", error);
    return NextResponse.json(
      { success: false, error: "تعذر حفظ المبادرة التشريعية." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = (body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المبادرة مطلوب للتحديث." },
        { status: 400 }
      );
    }

    let updatedProposal: LegislativeProposal | null = null;

    const updatedList = await updateStoreItem<LegislativeProposal[]>(
      STORE_KEY,
      (current) =>
        current.map((item) => {
          if (item.id === id) {
            updatedProposal = {
              ...item,
              ...(body.title !== undefined ? { title: body.title.trim() } : {}),
              ...(body.number !== undefined ? { number: body.number.trim() } : {}),
              ...(body.type !== undefined ? { type: body.type } : {}),
              ...(body.committee !== undefined ? { committee: body.committee.trim() } : {}),
              ...(body.depositDate !== undefined ? { depositDate: body.depositDate.trim() } : {}),
              ...(body.year !== undefined ? { year: Number(body.year) } : {}),
              ...(body.status !== undefined ? { status: body.status } : {}),
              ...(body.summary !== undefined ? { summary: body.summary.trim() } : {}),
              ...(body.arpUrl !== undefined ? { arpUrl: body.arpUrl.trim() } : {}),
              ...(body.pdfUrl !== undefined ? { pdfUrl: body.pdfUrl } : {}),
              ...(body.pdfName !== undefined ? { pdfName: body.pdfName } : {}),
              ...(body.targetAuthority !== undefined ? { targetAuthority: body.targetAuthority.trim() } : {}),
              ...(body.signatories !== undefined ? { signatories: body.signatories.trim() } : {}),
              ...(body.isMpInitiative !== undefined ? { isMpInitiative: Boolean(body.isMpInitiative) } : {}),
              ...(body.mpRole !== undefined ? { mpRole: body.mpRole ? String(body.mpRole).trim() : undefined } : {}),
              updatedAt: new Date().toISOString(),
            };
            return updatedProposal;
          }
          return item;
        }),
      INITIAL_PROPOSALS
    );

    if (!updatedProposal) {
      return NextResponse.json(
        { success: false, error: "لم يتم العثور على المبادرة التشريعية المحددة." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
      total: updatedList.length,
    });
  } catch (error) {
    console.error("Error updating legislative proposal:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تعديل المبادرة التشريعية." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المبادرة التشريعية مطلوب للحذف." },
        { status: 400 }
      );
    }

    const updatedList = await updateStoreItem<LegislativeProposal[]>(
      STORE_KEY,
      (current) => current.filter((item) => item.id !== id),
      INITIAL_PROPOSALS
    );

    return NextResponse.json({
      success: true,
      deletedId: id,
      total: updatedList.length,
    });
  } catch (error) {
    console.error("Error deleting legislative proposal:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء حذف المبادرة التشريعية." },
      { status: 500 }
    );
  }
}
