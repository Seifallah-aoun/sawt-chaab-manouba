import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const login = (body.login || body.email || body.username || "").trim();
    const password = (body.password || "").trim();
    const pin = (body.pin || "").trim();

    // 1. Official Admin Credentials
    // Login: Asmaderouiche@Manouba.tn
    // Password: Manouba-123
    const isOfficialAuth =
      login.toLowerCase() === "asmaderouiche@manouba.tn" &&
      password === "Manouba-123";

    // 2. Legacy / Quick PIN fallback
    const isPinAuth =
      pin === "2026" || password === "2026" || login === "2026";

    if (isOfficialAuth || isPinAuth) {
      return NextResponse.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح.",
        user: {
          email: "Asmaderouiche@Manouba.tn",
          name: "النائب أسماء درويش",
          role: "admin",
          district: "دائرة منوبة - الدندان",
          parliament: "مجلس نواب الشعب بالجمهورية التونسية",
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "بيانات الدخول غير صحيحة. يرجى التثبت من البريد الإلكتروني وكلمة السر.",
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Auth route error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء معالجة تسجيل الدخول." },
      { status: 500 }
    );
  }
}
