"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Search, 
  FileText, 
  Mic, 
  Calendar, 
  Building2, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  RotateCcw,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Complaint } from "@/lib/types";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  quickActions?: { label: string; action: string }[];
  ticketDetails?: Complaint;
}

const INITIAL_GREETING: Message = {
  id: "msg-welcome",
  sender: "bot",
  text: `مرحباً بك في المنصة النيابية الرسمية للنائب أسماء درويش (دائرة منوبة - الدندان)! 🇹🇳\n\nأنا **مساعدك الذكي**، موجود لإرشادك والإجابة الفورية عن استفساراتك اليومية:
• 🔍 **تتبع مآل مطلبك أو عريضتك** عبر إدخال رمز التذكرة (مثل \`TN-XXXX\`) أو رقم الهاتف.
• 📑 **دليل الوثائق والإجراءات الإدارية** (بطاقة عدد 3، الحالة المدنية، الصوناد والستاغ، رخص البناء).
• 🎙️ **طريقة تسجيل العرائض والشكاوى الصوتية** وإيصالها مباشرة للنائب.
• 💼 **برامج مرافقة وتمويل الشباب والشركات الأهلية** (BTS / ANETI).
• 📅 **مواعيد الاستقبال الشخصي بالمكتب البرلماني** بمنوبة.

كيف يمكنني مساعدتك الآن؟`,
  time: "الآن",
  quickActions: [
    { label: "🔍 تتبع مطلب (TN-XXXX)", action: "كيف أتتبع مطلبي؟" },
    { label: "📑 بطاقة السوابق عدد 3", action: "ماهي وثائق بطاقة عدد 3؟" },
    { label: "🎙️ تقديم شكوى صوتية", action: "كيف أسجل شكوى صوتية؟" },
    { label: "📅 مواعيد مقابلة النائب", action: "أين ومتى تستقبل النائب المواطنين؟" },
    { label: "🚀 قروض مشاريع الشباب BTS", action: "معلومات عن قروض البنك التونسي للتضامن BTS" },
    { label: "💧 انقطاع الماء الصالح للشرب", action: "مشكل انقطاع ماء الصوناد" },
  ],
};

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages]);

  // Handle Quick Actions
  const handleQuickAction = (text: string) => {
    handleSendMessage(text);
  };

  // Reset Conversation
  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_GREETING,
        id: `msg-welcome-${Date.now()}`,
        time: new Date().toLocaleTimeString("ar-TN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Main message processing engine
  const handleSendMessage = async (userText?: string) => {
    const textToSend = (userText || inputValue).trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString("ar-TN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!userText) setInputValue("");
    setIsTyping(true);

    // Analyze intent and respond
    const reply = await generateBotResponse(textToSend);
    setIsTyping(false);
    setMessages((prev) => [...prev, reply]);
  };

  // Knowledge base and NLP matching function
  const generateBotResponse = async (input: string): Promise<Message> => {
    const q = input.trim().toLowerCase();
    const now = new Date().toLocaleTimeString("ar-TN", { hour: "2-digit", minute: "2-digit" });

    // 1. Detect Ticket ID pattern (TN-XXXX or digits)
    const ticketMatch = input.match(/\b(TN-\d{4,6}|\d{8})\b/i);
    if (ticketMatch) {
      const code = ticketMatch[1].toUpperCase();
      try {
        const isPhone = /^\d{8}$/.test(code);
        const url = isPhone 
          ? `/api/requests?phone=${encodeURIComponent(code)}&t=${Date.now()}` 
          : `/api/requests?id=${encodeURIComponent(code)}&t=${Date.now()}`;
        
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        if (res.ok && (data.complaint || (data.complaints && data.complaints.length > 0))) {
          const item = data.complaint || data.complaints[0];
          return {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: `✅ **تم العثور على المطلب البرلماني (${item.id})**:\n\n• **صاحب المطلب**: ${item.citizenName}\n• **العمادة/المنطقة**: ${item.zone}\n• **الحالة الإدارية**: **${item.status}**\n• **ملاحظة المكتب البرلماني**: ${item.adminPublicNote || item.publicNote || "قيد الدرس والمتابعة مع المصالح المختصة."}\n• **تاريخ التسجيل**: ${new Date(item.createdAt).toLocaleDateString("ar-TN")}`,
            time: now,
            ticketDetails: item,
            quickActions: [
              { label: "🔎 فتح قسم التتبع الكامل", action: "أريد تتبع المطلب في الواجهة" },
              { label: "❓ لدي استفسار آخر", action: "أريد مساعدة أخرى" },
            ]
          };
        } else {
          return {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: `⚠️ لم يتم العثور على أي مطلب مسجل بالرمز (\`${code}\`) في قاعدة البيانات السحابية.\n\nالرجاء التأكد من صحة الرمز (مثال: \`TN-1024\`) أو يمكنك البحث برقم الهاتف الذي سجلت به. كما يمكنك تقديم عريضة جديدة فوراً عبر المنصة.`,
            time: now,
            quickActions: [
              { label: "✍️ تقديم مطلب جديد", action: "كيف أقدم عريضة جديدة؟" },
              { label: "🔍 الذهاب لمحرك التتبع", action: "أريد تتبع المطلب في الواجهة" },
            ],
          };
        }
      } catch (err) {
        // network issue fallback
      }
    }

    // 2. Administrative Guides
    if (q.includes("بطاقة عدد 3") || q.includes("b3") || q.includes("سوابق عدلية")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `📋 **دليل استخراج بطاقة السوابق العدلية (عدد 3)**:

📌 **الوثائق المطلوبة**:
1. نسخة من بطاقة التعريف الوطنية.
2. مضمون ولادة باللغة العربية لم تمض عليه 3 أشهر.
3. طابع جبائي بقيمة 3 دنانير (أو وصل دفع إلكتروني عبر موقع وزارة الداخلية).

📍 **المقر الإداري بمنوبة والدندان**:
• **منطقة الأمن الوطني بمنوبة** (شارع الحبيب بورقيبة) لمنوبة المدينة وسيدي عمر.
• **مركز الأمن الوطني بالدندان** (نهج الجمهورية) لأهالي الدندان الشمالي والجنوبي.
• يمكن أيضاً طلبها عن بعد عبر البوابة الرسمية لوزارة الداخلية واستلامها بالبريد السريع.`,
        time: now,
        quickActions: [
          { label: "📑 دليل رخصة البناء", action: "ماهي وثائق رخصة البناء؟" },
          { label: "💧 خدمات الصوناد", action: "الربط بشبكة الصوناد" },
        ],
      };
    }

    if (q.includes("صوناد") || q.includes("sonede") || q.includes("ماء") || q.includes("انقطاع الماء")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `💧 **خدمات وتدخلات مياه الشرب (إقليم SONEDE منوبة)**:

📌 **التبليغ عن الأعطاب والانقطاعات**:
• تتابع النائب أسماء درويش بانتظام وضعية التزويد بمياه الشرب بسيدي عمر، الدندان، وقصر السعيد، وتوجه مراسلات استعجالية عند تكرر الانقطاعات.
• **رقم طوارئ إقليم SONEDE منوبة**: 71 600 500 / الرقم الأخضر الوطني: 80 100 319.
• **العنوان**: شارع الحبيب بورقيبة، منوبة.

إذا كنت تعاني من انقطاع مطول، يمكنك تسجيل **عريضة استعجالية** عبر المنصة لتقوم النائب بمراسلة إدارة الإقليم ووزارة الفلاحة فوراً.`,
        time: now,
        quickActions: [
          { label: "✍️ تقديم عريضة للصوناد", action: "كيف أقدم عريضة للصوناد؟" },
          { label: "⚡ خدمات الستاغ والكهرباء", action: "خدمات شركة الستاغ بمنوبة" },
        ],
      };
    }

    if (q.includes("ستاغ") || q.includes("steg") || q.includes("كهرباء") || q.includes("غاز")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `⚡ **الشركة التونسية للكهرباء والغاز (إقليم STEG منوبة)**:

📌 **العنوان والاتصال**:
• **المقر**: شارع فرحات حشاد، منوبة.
• **الهاتف**: 71 600 500 | **طوارئ الكهرباء**: 71 341 311.

📌 **المطالب الشائعة**:
• نقل عداد أو تقوية العداد (Changement de puissance).
• التبليغ عن انقطاعات الكهرباء وتذبذب الجهد بحي البرتقال والدندان.
• مطالب الإنارة العمومية تودع مباشرة بالدائرة البلدية المختصة (بلدية منوبة أو بلدية الدندان).`,
        time: now,
        quickActions: [
          { label: "✍️ عريضة حول الكهرباء", action: "تقديم عريضة للستاغ" },
          { label: "📅 حجز موعد بالمكتب", action: "حجز موعد بالمكتب البرلماني" },
        ],
      };
    }

    if (q.includes("رخصة بناء") || q.includes("شهادة حوز") || q.includes("بلدية")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `🏛️ **إجراءات بلدية منوبة والدندان (رخص البناء والتهيئة)**:

📌 **ملف رخصة البناء**:
1. شهادة ملكية أو حكم استحقاقي أو شهادة حوز قانونية.
2. تصميم معماري مصادق عليه من مهندس معماري مسجل بجدول العمادة.
3. دراسة فنية ومثال هيكلي مصادق عليه.
4. وصل خلاص معاليم البناء والأداءات البلدية.

📍 **المصالح الفنية البلدية**:
• **بلدية منوبة**: قصر البلدية، شارع الحبيب بورقيبة.
• **بلدية الدندان**: مقر البلدية، نهج 18 جانفي، الدندان.`,
        time: now,
        quickActions: [
          { label: "📑 دليل بطاقة عدد 3", action: "ماهي وثائق بطاقة عدد 3؟" },
          { label: "📅 موعد مع النائب", action: "حجز موعد بالمكتب البرلماني" },
        ],
      };
    }

    // 3. Submitting Complaints & Petitions
    if (q.includes("صوتية") || q.includes("تسجيل") || q.includes("صوت") || q.includes("فويس")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `🎙️ **كيفية تسجيل شكوى صوتية مباشرة للنائب أسماء درويش**:

1. انقر على زر **"تسجيل شكوى صوتية"** في أعلى الصفحة الرئيسية أو الواجهة التفاعلية.
2. سجّل رسالتك الصوتية بلهجتك الطبيعية وتحدث بوضوح عن مشكلتك والحي المعني.
3. أدخل اسمك ورقم هاتفك والمنطقة (منوبة المدينة، سيدي عمر، الدندان، قصر السعيد...).
4. بعد الإرسال، ستحصل فوراً على **رمز تتبع برلماني (TN-XXXX)** لمتابعة ملفك والردود الرسمية.`,
        time: now,
        quickActions: [
          { label: "🎙️ فتح نافذة الشكوى الصوتية الآن", action: "افتح نافذة الشكوى الصوتية" },
          { label: "✍️ تقديم عريضة مكتوبة", action: "كيف أقدم عريضة مكتوبة؟" },
        ],
      };
    }

    if (q.includes("عريضة") || q.includes("مطلب") || q.includes("تقديم") || q.includes("شكوى")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `✍️ **تقديم عريضة أو مطلب برلماني**:

يمكن لأي مواطن من معتمدية منوبة - الدندان تقديم عريضة إلكترونية تتضمن:
• **وصف الإشكال**: (طرقات، ماء، صحة، نقل، شؤون اجتماعية، تنوير عمومي...).
• **إرفاق وثائق أو صور**: يمكنك تحميل صور من موقع الإشكال لتعزيز الملف.
• **المتابعة النيابية**: يقوم الفريق البرلماني بصياغة مراسلة رسمية للوزارة أو المصلحة المعنية مع إشعارك بكافة المستجدات.`,
        time: now,
        quickActions: [
          { label: "✍️ فتح استمارة العريضة الآن", action: "افتح استمارة العريضة" },
          { label: "🔍 تتبع مطلب سابق", action: "أريد تتبع مطلبي" },
        ],
      };
    }

    // 4. Appointments & Office Info
    if (q.includes("موعد") || q.includes("مقابلة") || q.includes("مكتب") || q.includes("عنوان") || q.includes("وقت") || q.includes("استقبال")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `📅 **فضاء الاستقبال الشخصي بالمكتب البرلماني للنائب أسماء درويش**:

📌 **أيام الاستقبال الدوري للمواطنين**:
• **الإثنين**: 10:00 صباحاً إلى 13:00 ظهراً
• **الأربعاء**: 14:00 بعد الزوال إلى 17:00 مساءً
• **الجمعة**: 10:00 صباحاً إلى 13:00 ظهراً

📍 **المقر**: المكتب البرلماني، منوبة المركز (قرب محطة المترو الخفيف ومقر المعتمدية).
🎯 **الهدف**: الاستماع المباشر لمشاغلكم، استلام العرائض باليد، ومتابعة الملفات المعطلة.

يمكنك حجز موعد مؤكد ومسبق من قسم "الدليل الإداري والمواعيد" على الصفحة الرئيسية.`,
        time: now,
        quickActions: [
          { label: "📅 الانتقال لقسم المواعيد", action: "أريد حجز موعد" },
          { label: "🎙️ تسجيل شكوى صوتية سريعة", action: "كيف أسجل شكوى صوتية؟" },
        ],
      };
    }

    // 5. Youth & Entrepreneurship (BTS / ANETI)
    if (q.includes("bts") || q.includes("شباب") || q.includes("تمويل") || q.includes("مشروع") || q.includes("تشغيل") || q.includes("aneti")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `🚀 **فضاء دعم مبادرات الشباب والتشغيل بمنوبة والدندان**:

📌 **أبرز برامج التمويل والمرافقة المتاحة**:
1. **البنك التونسي للتضامن (BTS - فرع منوبة)**: قروض ميسرة بدون ضمانات عينية تصل إلى 150 ألف دينار لحاملي الشهائد العليا وشهائد الكفاءة المهنية.
2. **مكتب التشغيل والعمل المستقل بمنوبة (ANETI)**: عقود الإعداد للحياة المهنية (CIVP)، منحة عقد الكرامة، وبرنامج مرافقة باعثي المؤسسات (CEFE).
3. **مركز الأعمال ووكالة APII منوبة**: المساعدة في إعداد دراسة الجدوى وتأسيس المشاريع التجديدية.
4. **الشركات الأهلية بولاية منوبة**: إحاطة قانونية وتمويل تفضيلي للمبادرات التنموية الجماعية.

إذا كان لديك ملف تمويل متعطل لدى BTS أو مشروع شاب يحتاج دعماً نيابياً، يمكنك تقديم طلب تدخل عبر فضاء الشباب بالمنصة!`,
        time: now,
        quickActions: [
          { label: "💼 الانتقال لفضاء الشباب", action: "أريد الاطلاع على برامج الشباب" },
          { label: "📅 حجز موعد لمناقشة فكرة مشروع", action: "أين ومتى تستقبل النائب المواطنين؟" },
        ],
      };
    }

    // Action Triggers based on conversational cues
    if (q.includes("افتح استمارة العريضة") || q.includes("عريضة جديدة")) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-petition-modal"));
      }
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `✨ تم فتح نافذة تقديم العريضة على الشاشة الآن! يمكنك ملء البيانات وإرفاق الوثائق وسيتولى الفريق البرلماني المتابعة الفورية.`,
        time: now,
      };
    }

    if (q.includes("افتح نافذة الشكوى الصوتية") || q.includes("شكوى صوتية")) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-voice-modal"));
      }
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `🎙️ تم فتح مسجل الشكوى الصوتية على الشاشة الآن! اضغط على زر التسجيل وتحدث بكل أريحية.`,
        time: now,
      };
    }

    if (q.includes("تتبع") || q.includes("تتبع المطلب")) {
      if (typeof window !== "undefined") {
        const el = document.getElementById("tracking-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `🔍 تم نقلك إلى قسم التتبع المباشر! يمكنك كتابة رمز المطلب (TN-XXXX) أو رقم هاتفك لمعرفة أحدث المستجدات وملاحظات النائب.`,
        time: now,
      };
    }

    if (q.includes("حجز موعد") || q.includes("المواعيد")) {
      if (typeof window !== "undefined") {
        const el = document.getElementById("active-civic-content");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `📅 تم توجيهك إلى فضاء الدليل والمواعيد! اختر اليوم والتوقيت المناسب وأدخل رقم هاتفك لتأكيد موعد استقبالك بمكتب النائب.`,
        time: now,
      };
    }

    // Default intelligent fallback
    return {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: `شكراً لتواصلك! 😊 أنا هنا لمساعدتك في كل ما يتعلق بالعمل النيابي والخدمات الإدارية بدائرة منوبة - الدندان.

يمكنك اختصار الوقت باختيار أحد المواضيع السريعة أدناه أو كتابة رمز مطلبك (مثل \`TN-1024\`):`,
      time: now,
      quickActions: [
        { label: "🔍 تتبع مآل مطلب (TN-XXXX)", action: "كيف أتتبع مطلبي؟" },
        { label: "🎙️ تسجيل شكوى صوتية", action: "كيف أسجل شكوى صوتية؟" },
        { label: "📑 دليل الوثائق الإدارية", action: "ماهي وثائق بطاقة عدد 3؟" },
        { label: "📅 مواعيد الاستقبال بالمكتب", action: "أين ومتى تستقبل النائب المواطنين؟" },
        { label: "🚀 تمويل المشاريع BTS", action: "معلومات عن قروض البنك التونسي للتضامن BTS" },
      ],
    };
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6 flex flex-col items-end select-none">
      {/* ============================================================== */}
      {/* 1. Expandable Interactive Chat Window */}
      {/* ============================================================== */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[410px] h-[540px] max-h-[82vh] rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xl shadow-zinc-900/20 flex flex-col overflow-hidden animate-fadeIn transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-red-600 to-rose-700 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-xs">
                <Bot className="h-5 w-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-red-600" />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-white truncate">
                    المساعد الذكي لمنوبة والدندان
                  </span>
                  <span className="text-xs">🇹🇳</span>
                </div>
                <span className="text-[11px] text-red-100 font-medium truncate">
                  المكتب البرلماني للنائب أسماء درويش
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                title="إعادة بدء المحادثة"
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="إغلاق المحادثة"
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-right scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-0.5">
                  {msg.sender === "bot" ? (
                    <div className="h-7 w-7 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center justify-center font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className="max-w-[84%] flex flex-col space-y-1.5">
                  <div
                    className={`rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-red-600 text-white rounded-br-xs shadow-xs font-medium"
                        : "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 rounded-bl-xs border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs"
                    }`}
                  >
                    {msg.text}

                    {/* Ticket Mini Card if detected */}
                    {msg.ticketDetails && (
                      <div className="mt-2.5 pt-2.5 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-red-600 dark:text-red-400">
                          {msg.ticketDetails.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                          {msg.ticketDetails.status}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 px-1">
                    {msg.time}
                  </span>

                  {/* Quick Action Chips if available */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.quickActions.map((qa, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuickAction(qa.action)}
                          className="rounded-full border border-red-200 bg-white/90 hover:bg-red-50 hover:border-red-300 text-red-700 dark:border-red-900/60 dark:bg-zinc-800/80 dark:text-red-300 dark:hover:bg-red-950/40 px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {qa.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-[11px] py-1">
                <div className="h-6 w-6 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600">
                  <Bot className="h-3 w-3 animate-spin" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="mr-1">المساعد يكتب الآن...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="اكتب استفسارك، موضوعك أو رمز المطلب (TN-XXXX)..."
                className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                title="إرسال"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 transition cursor-pointer shadow-sm active:scale-95"
              >
                <Send className="h-4 w-4 rotate-180" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. Floating Circular Chatbot Trigger Button */}
      {/* ============================================================== */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "إغلاق المساعد الذكي" : "تحدث مع المساعد الذكي لدائرة منوبة والدندان"}
        aria-label="المساعد الذكي"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 via-red-600 to-rose-600 text-white shadow-xl shadow-red-600/35 hover:shadow-red-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/20"
      >
        {/* Pulsing beacon glow when closed */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white text-[9px] font-bold text-white items-center justify-center">
              🇹🇳
            </span>
          </span>
        )}

        {isOpen ? (
          <X className="h-6 w-6 text-white rotate-0 group-hover:rotate-90 transition-transform" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            <Sparkles className="absolute -top-1.5 -left-1.5 h-3 w-3 text-amber-300 animate-pulse" />
          </div>
        )}

        {/* Floating Tooltip Label (hover on desktop when closed) */}
        {!isOpen && (
          <span className="hidden sm:inline-block pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-900/90 dark:bg-white/90 px-3 py-1.5 text-xs font-bold text-white dark:text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            المساعد الذكي لمنوبة والدندان 🇹🇳
          </span>
        )}
      </button>
    </div>
  );
}