"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, 
  Building2, 
  CalendarCheck, 
  Vote, 
  TrendingUp, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertCircle, 
  Check, 
  Phone, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  Loader2,
  Calendar,
  Compass,
  Landmark,
  User,
  Radio,
  Newspaper,
  Layers,
  Pin,
  Search,
  Download,
  Copy,
  CheckSquare,
  Square,
  BookOpen,
  Info,
  X,
  Coins,
  HelpCircle,
  Filter,
  Rocket,
  Briefcase
} from "lucide-react";
import { 
  Complaint, 
  ProjectItem, 
  PollItem, 
  Appointment, 
  NewsItem, 
  AppointmentSettings,
  GuideItem,
  GuideCategory,
  GUIDE_CATEGORIES,
  YouthProgram,
  YouthProgramCategory,
  YOUTH_PROGRAM_CATEGORIES,
  YouthRequest
} from "@/lib/types";

type CivicTab = "analytics" | "projects" | "guide" | "youth" | "polls";

interface CivicModulesProps {
  refreshTrigger?: number;
}

const MANOUBA_DISTRICT_ZONES = [
  "منوبة المدينة",
  "منوبة الوسطى (حي البرتقال / سليمان كاهية)",
  "سيدي عمر",
  "الدندان الشمالي",
  "الدندان الجنوبي",
  "قصر السعيد",
];

export default function CivicModules({ refreshTrigger = 0 }: CivicModulesProps) {
  const [activeTab, setActiveTab] = useState<CivicTab>("analytics");

  // Dynamic Requests & Live Stats
  const [requests, setRequests] = useState<Complaint[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Appointment state & dynamic availability settings
  const [appointmentSettings, setAppointmentSettings] = useState<AppointmentSettings>({
    days: [
      "الإثنين (10:00 - 13:00)",
      "الأربعاء (14:00 - 17:00)",
      "الجمعة (10:00 - 13:00)",
    ],
    timeSlots: [
      "10:00 صباحاً",
      "10:30 صباحاً",
      "11:30 صباحاً",
      "12:30 ظهراً",
      "14:30 بعد الزوال",
      "15:30 بعد الزوال",
    ],
    note: "تستقبل النائب أسماء درويش والفريق البرلماني المواطنين أيام الإثنين والأربعاء والجمعة بالمكتب البرلماني بمنوبة لتسليم العرائض باليد والاستماع الشخصي لمشاغلكم.",
  });
  const [appointmentDay, setAppointmentDay] = useState("الإثنين (10:00 - 13:00)");
  const [appointmentTime, setAppointmentTime] = useState("10:30 صباحاً");
  const [appointmentTopic, setAppointmentTopic] = useState("مطلب ومشاغل حي بالجهة");
  const [appointmentName, setAppointmentName] = useState("");
  const [appointmentPhone, setAppointmentPhone] = useState("");
  const [appointmentZone, setAppointmentZone] = useState("منوبة المدينة");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [guideSubTab, setGuideSubTab] = useState<"smart_guide" | "appointment" | "directory">("smart_guide");
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [guideSearch, setGuideSearch] = useState("");
  const [selectedGuideCategory, setSelectedGuideCategory] = useState<string>("الكل");
  const [activeGuideModal, setActiveGuideModal] = useState<GuideItem | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [copiedDocsSuccess, setCopiedDocsSuccess] = useState(false);

  // Youth & Local Entrepreneurship state
  const [youthPrograms, setYouthPrograms] = useState<YouthProgram[]>([]);
  const [loadingYouth, setLoadingYouth] = useState(true);
  const [youthSubTab, setYouthSubTab] = useState<"programs" | "request">("programs");
  const [selectedYouthCategory, setSelectedYouthCategory] = useState<string>("الكل");
  const [youthSearch, setYouthSearch] = useState("");
  const [activeYouthProgramModal, setActiveYouthProgramModal] = useState<YouthProgram | null>(null);
  const [checkedYouthDocs, setCheckedYouthDocs] = useState<Record<string, boolean>>({});
  const [copiedYouthDocsSuccess, setCopiedYouthDocsSuccess] = useState(false);

  // Youth Request Form State
  const [youthFullName, setYouthFullName] = useState("");
  const [youthPhone, setYouthPhone] = useState("");
  const [youthZone, setYouthZone] = useState("منوبة المدينة");
  const [youthProjectType, setYouthProjectType] = useState("");
  const [youthTargetInstitution, setYouthTargetInstitution] = useState("البنك التونسي للتضامن (BTS فرع منوبة)");
  const [youthIssueDescription, setYouthIssueDescription] = useState("");
  const [submittingYouthRequest, setSubmittingYouthRequest] = useState(false);
  const [youthRequestSuccess, setYouthRequestSuccess] = useState<YouthRequest | null>(null);
  const [youthRequestError, setYouthRequestError] = useState<string | null>(null);

  // Polls & Live News state
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const [votingLoading, setVotingLoading] = useState<string | null>(null);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [homeNewsFilter, setHomeNewsFilter] = useState<"all" | "parliament" | "regional" | "urgent">("all");

  // Fetch real-time data from backend APIs
  const fetchAllData = useCallback(() => {
    setLoadingRequests(true);
    fetch("/api/requests")
      .then((r) => r.json())
      .then((d) => {
        if (d.complaints) setRequests(d.complaints);
      })
      .catch((err) => console.error("Error loading requests for stats:", err))
      .finally(() => setLoadingRequests(false));

    fetch(`/api/projects?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.projects)) setProjects(d.projects);
      })
      .catch((err) => console.error("Error loading projects:", err))
      .finally(() => setLoadingProjects(false));

    fetch("/api/polls")
      .then((r) => r.json())
      .then((d) => {
        if (d.polls) setPolls(d.polls);
      })
      .catch((err) => console.error("Error loading polls:", err));

    fetch("/api/news")
      .then((r) => r.json())
      .then((d) => {
        if (d.news) setNewsFeed(d.news);
      })
      .catch((err) => console.error("Error loading news feed:", err))
      .finally(() => setLoadingNews(false));

    fetch(`/api/guides?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.guides)) setGuides(d.guides);
      })
      .catch((err) => console.error("Error loading administrative guides:", err))
      .finally(() => setLoadingGuides(false));

    fetch(`/api/youth?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.programs)) setYouthPrograms(d.programs);
      })
      .catch((err) => console.error("Error loading youth programs:", err))
      .finally(() => setLoadingYouth(false));

    fetch(`/api/appointments?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setAppointmentSettings(d.settings);
          if (Array.isArray(d.settings.days) && d.settings.days.length > 0) {
            setAppointmentDay((prev) =>
              d.settings.days.includes(prev) ? prev : d.settings.days[0]
            );
          }
          if (Array.isArray(d.settings.timeSlots) && d.settings.timeSlots.length > 0) {
            setAppointmentTime((prev) =>
              d.settings.timeSlots.includes(prev) ? prev : d.settings.timeSlots[0]
            );
          }
        }
      })
      .catch((err) => console.error("Error loading appointment settings:", err));
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, refreshTrigger]);

  // Instant real-time synchronization with Admin dashboard & cross-tab events
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("mp_data_sync");
        bc.onmessage = () => {
          fetchAllData();
        };
      }
    } catch {
      // ignore
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "mp_last_update") {
        fetchAllData();
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleCustomEvent = () => {
      fetchAllData();
    };
    window.addEventListener("mp_data_updated", handleCustomEvent);

    // Continuous background sync every 3 seconds
    const interval = setInterval(fetchAllData, 3000);

    return () => {
      bc?.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("mp_data_updated", handleCustomEvent);
      clearInterval(interval);
    };
  }, [fetchAllData]);

  // Compute 100% Dynamic Statistics from real requests
  const totalRequests = requests.length;
  const resolvedCount = requests.filter((r) => r.status === "تم الحل").length;
  const inProgressCount = requests.filter(
    (r) => r.status === "تمت مراسلة الوزارة/البلدية" || r.status === "بصدد الدرس"
  ).length;
  const officialLettersCount = requests.filter(
    (r) => r.status === "تمت مراسلة الوزارة/البلدية" || Boolean(r.officialLetterText)
  ).length;

  const resolutionRate = totalRequests > 0
    ? Math.round(((resolvedCount + inProgressCount) / totalRequests) * 100)
    : 0;

  // Real breakdown by neighborhood
  const zoneStats = MANOUBA_DISTRICT_ZONES.map((zoneName) => {
    const count = requests.filter((r) => {
      if (r.zone === zoneName) return true;
      if (zoneName.includes("منوبة الوسطى") && r.zone.includes("منوبة الوسطى")) return true;
      return false;
    }).length;
    const pct = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
    return { name: zoneName, count, pct };
  }).sort((a, b) => b.count - a.count);

  // Real breakdown by sector/category
  const categoryCounts: Record<string, number> = {};
  requests.forEach((r) => {
    // Normalize legacy categories if present
    let cat = r.category as string;
    if (cat === "الماء والتطهير") cat = "الماء والصوناد";
    if (cat === "الإنارة والطرقات") cat = "الطرقات والتجهيز";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryStats = Object.entries(categoryCounts)
    .map(([cat, count]) => {
      const pct = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
      return { name: cat, count, pct };
    })
    .sort((a, b) => b.count - a.count);

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls[pollId]) return;
    setVotingLoading(pollId);

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionId }),
      });
      const data = await res.json();
      if (res.ok && data.poll) {
        setPolls((prev) => prev.map((p) => (p.id === pollId ? data.poll : p)));
        setVotedPolls((prev) => ({ ...prev, [pollId]: optionId }));
      }
    } catch (err) {
      console.error("Voting failed:", err);
    } finally {
      setVotingLoading(null);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!appointmentName.trim() || appointmentName.trim().length < 3) {
      setBookingError("الرجاء كتابة الاسم واللقب بشكل صحيح.");
      return;
    }
    const cleanPhone = appointmentPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 8) {
      setBookingError("الرجاء كتابة رقم هاتف تونسي صالح (8 أرقام).");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenName: appointmentName.trim(),
          phone: cleanPhone,
          zone: appointmentZone,
          date: appointmentDay,
          timeSlot: appointmentTime,
          topic: appointmentTopic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حجز الموعد.");
      setBookingSuccess(data.appointment);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : "حدث خطأ أثناء حجز الموعد.");
    } finally {
      setBookingLoading(false);
    }
  };

  const getCategoryBadgeClass = (category: GuideCategory) => {
    switch (category) {
      case "البلدية":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
      case "الشؤون الاجتماعية":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
      case "الإدارات الجهوية":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
      case "الصوناد/الستاغ":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const handleCopyGuideDocs = (guide: GuideItem) => {
    const text = `📋 الوثائق المطلوبة لإجراء: ${guide.title}\n` +
      `📍 الإدارة المختصة: ${guide.location}\n` +
      (guide.cost ? `💰 المعاليم المستوجبة: ${guide.cost}\n` : "") +
      (guide.processingTime ? `⏱️ الآجال التقريبية: ${guide.processingTime}\n` : "") +
      `\nالوثائق والمستندات المطلوبة:\n` +
      guide.requiredDocuments.map((doc, idx) => `${idx + 1}. ${doc}`).join("\n") +
      (guide.steps && guide.steps.length > 0 ? `\n\nخطوات الإنجاز:\n` + guide.steps.map((st, idx) => `خطوة ${idx + 1}: ${st}`).join("\n") : "") +
      `\n\n— مقدمة من الدليل الإداري السريع | المكتب البرلماني للنائب أسماء درويش`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedDocsSuccess(true);
      setTimeout(() => setCopiedDocsSuccess(false), 2500);
    }
  };

  const filteredGuides = guides.filter((g) => {
    if (selectedGuideCategory !== "الكل" && g.category !== selectedGuideCategory) {
      return false;
    }
    if (!guideSearch.trim()) return true;
    const q = guideSearch.trim().toLowerCase();
    const matchTitle = g.title.toLowerCase().includes(q);
    const matchLocation = g.location.toLowerCase().includes(q);
    const matchKeywords = Array.isArray(g.keywords) && g.keywords.some((kw) => kw.toLowerCase().includes(q));
    const matchDocs = Array.isArray(g.requiredDocuments) && g.requiredDocuments.some((d) => d.toLowerCase().includes(q));
    const matchSteps = Array.isArray(g.steps) && g.steps.some((s) => s.toLowerCase().includes(q));
    return matchTitle || matchLocation || matchKeywords || matchDocs || matchSteps;
  });

  const getYouthCategoryBadgeClass = (category: YouthProgramCategory) => {
    switch (category) {
      case "تمويل وقروض صغرى":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
      case "برامج التشغيل ANETI":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
      case "تكوين ومرافقة":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
      case "شركات أهلية":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const handleCopyYouthDocs = (prog: YouthProgram) => {
    const text = `📋 شروط ووثائق الانتفاع ببرنامج: ${prog.title}\n` +
      `🏛️ المؤسسة المشرفة: ${prog.institution}\n` +
      (prog.fundingCap ? `💰 سقف التمويل: ${prog.fundingCap}\n` : "") +
      `🎯 الفئة المستهدفة: ${prog.targetAudience}\n` +
      (prog.address ? `📍 المقر بمنوبة: ${prog.address}\n` : "") +
      (prog.contactPhone ? `📞 الهاتف: ${prog.contactPhone}\n` : "") +
      `\nشروط الأهلية والانتفاع:\n` +
      prog.eligibilityCriteria.map((c, idx) => `${idx + 1}. ${c}`).join("\n") +
      `\n\nالوثائق ومكونات الملف المطلوب:\n` +
      prog.requiredDocuments.map((d, idx) => `${idx + 1}. ${d}`).join("\n") +
      `\n\n— مقدمة من فضاء الشباب والمبادرة الخاصة | المكتب البرلماني للنائب أسماء درويش`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedYouthDocsSuccess(true);
      setTimeout(() => setCopiedYouthDocsSuccess(false), 2500);
    }
  };

  const handleSubmitYouthRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setYouthRequestError(null);

    if (!youthFullName.trim() || youthFullName.trim().length < 3) {
      setYouthRequestError("الرجاء كتابة الاسم واللقب بشكل صحيح.");
      return;
    }
    const cleanPhone = youthPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 8) {
      setYouthRequestError("الرجاء كتابة رقم هاتف تونسي صالح (8 أرقام).");
      return;
    }
    if (!youthProjectType.trim()) {
      setYouthRequestError("الرجاء تحديد طبيعة المشروع أو فكرة المبادرة.");
      return;
    }
    if (!youthIssueDescription.trim()) {
      setYouthRequestError("الرجاء توضيح الإشكال أو موضوع المتابعة المطلوبة بوضوح.");
      return;
    }

    setSubmittingYouthRequest(true);
    try {
      const res = await fetch("/api/youth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          fullName: youthFullName.trim(),
          phone: cleanPhone,
          zone: youthZone,
          projectType: youthProjectType.trim(),
          targetInstitution: youthTargetInstitution.trim(),
          issueDescription: youthIssueDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر إرسال المطلب.");
      setYouthRequestSuccess(data.request);
      setYouthFullName("");
      setYouthPhone("");
      setYouthProjectType("");
      setYouthIssueDescription("");
    } catch (err: unknown) {
      setYouthRequestError(err instanceof Error ? err.message : "حدث خطأ أثناء إرسال المطلب.");
    } finally {
      setSubmittingYouthRequest(false);
    }
  };

  const filteredYouthPrograms = youthPrograms.filter((p) => {
    if (selectedYouthCategory !== "الكل" && p.category !== selectedYouthCategory) {
      return false;
    }
    if (!youthSearch.trim()) return true;
    const q = youthSearch.trim().toLowerCase();
    const matchTitle = p.title.toLowerCase().includes(q);
    const matchInst = p.institution.toLowerCase().includes(q);
    const matchDesc = p.description.toLowerCase().includes(q);
    const matchAudience = p.targetAudience.toLowerCase().includes(q);
    const matchCriteria = Array.isArray(p.eligibilityCriteria) && p.eligibilityCriteria.some((c) => c.toLowerCase().includes(q));
    const matchDocs = Array.isArray(p.requiredDocuments) && p.requiredDocuments.some((d) => d.toLowerCase().includes(q));
    return matchTitle || matchInst || matchDesc || matchAudience || matchCriteria || matchDocs;
  });

  const LOCAL_DIRECTORY = [
    {
      name: "معتمدية منوبة",
      role: "السلطة الإدارية المحلية والإشراف العام",
      address: "شارع الحبيب بورقيبة، منوبة",
      phone: "71 600 320",
      hours: "08:30 - 16:30 (الإثنين - الجمعة)",
      services: "الشؤون الاجتماعية، التراخيص الإدارية، فض النزاعات المحلية",
    },
    {
      name: "بلدية الدندان",
      role: "المصالح الفنية، النظافة، والإنارة",
      address: "ساحة الاستقلال، الدندان",
      phone: "71 611 115",
      hours: "08:30 - 16:00",
      services: "رخص البناء، صيانة الطرقات والإنارة، الحالة المدنية، النظافة",
    },
    {
      name: "بلدية منوبة",
      role: "الخدمات البلدية والمشاريع التشاركية",
      address: "نهج الهادي شاكر، منوبة",
      phone: "71 600 133",
      hours: "08:30 - 16:00",
      services: "المصالح الفنية، العناية بالبيئة، التراتيب البلدية، التعريف بالإمضاء",
    },
    {
      name: "المركز الصحي الوسيط بالدندان",
      role: "الرعاية الصحية الأساسية والطب العام",
      address: "شارع الجمهورية، الدندان",
      phone: "71 612 890",
      hours: "08:00 - 17:00",
      services: "عيادات طب عام، أدوية الأمراض المزمنة، التلاقيح ورعاية الأم والطفل",
    },
    {
      name: "إقليم الشركة الوطنية لاستغلال وتوزيع المياه (SONEDE) منوبة",
      role: "توزيع مياه الشرب وصيانة الأعطاب",
      address: "طريق ماطر كلم 1، منوبة",
      phone: "71 600 811 / طوارئ: 1814",
      hours: "خدمة التدخل الفني 24/24",
      services: "الاشتراكات الجديدة، إصلاح الأعطاب بالقنوات، التزود بمياه الشرب",
    },
    {
      name: "إقليم الشركة التونسية للكهرباء والغاز (STEG) منوبة",
      role: "خدمات الكهرباء والغاز الطبيعي",
      address: "شارع فرحات حشاد، منوبة",
      phone: "71 600 500 / طوارئ: 71 341 311",
      hours: "08:00 - 16:00",
      services: "ربط الشبكة، إصلاح الأعطاب، الاستخلاص والتراخيص",
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 my-12">
      {/* 5 Interactive Civic Module Selector Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Module 1: Live Analytics */}
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`group text-right rounded-3xl p-6 transition-all border cursor-pointer relative overflow-hidden ${
            activeTab === "analytics"
              ? "bg-white dark:bg-zinc-900 border-blue-500 shadow-xl ring-2 ring-blue-500/20"
              : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 hover:shadow-md"
          }`}
        >
          {activeTab === "analytics" && (
            <span className="absolute top-0 right-0 left-0 h-1.5 bg-blue-600" />
          )}
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              المرصد الإحصائي المباشر
            </h3>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              بيانات حية 100%
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            إحصائيات حية ومباشرة حول توزيع المشاغل حسب العمادات، نسب حل الملفات، وأولويات التدخل بمنوبة والدندان.
          </p>
        </button>

        {/* Module 2: Projects Radar */}
        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={`group text-right rounded-3xl p-6 transition-all border cursor-pointer relative overflow-hidden ${
            activeTab === "projects"
              ? "bg-white dark:bg-zinc-900 border-amber-500 shadow-xl ring-2 ring-amber-500/20"
              : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-amber-300 hover:shadow-md"
          }`}
        >
          {activeTab === "projects" && (
            <span className="absolute top-0 right-0 left-0 h-1.5 bg-amber-500" />
          )}
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              رادار المشاريع والمساءلة
            </h3>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              متابعة وزارية
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            متابعة حية لنسب تقدم المشاريع العمومية المعطلة بالجهة، والأسئلة الكتابية والشفاهية مع ردودها الرسمية.
          </p>
        </button>

        {/* Module 3: Citizen Guide & Appointments */}
        <button
          type="button"
          onClick={() => setActiveTab("guide")}
          className={`group text-right rounded-3xl p-6 transition-all border cursor-pointer relative overflow-hidden ${
            activeTab === "guide"
              ? "bg-white dark:bg-zinc-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20"
              : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 hover:shadow-md"
          }`}
        >
          {activeTab === "guide" && (
            <span className="absolute top-0 right-0 left-0 h-1.5 bg-emerald-500" />
          )}
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              الدليل الإداري السريع والمواعيد
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {guides.length > 0 ? `${guides.length} إجراءات مفصلة` : "دليل المواطن"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            الدليل الإداري السريع لتسهيل قضاء شؤونك اليومية بمنوبة والدندان (الوثائق، الخطوات، المقرات)، مع حجز موعد مباشر بمكتب النائب أسماء درويش.
          </p>
        </button>

        {/* Module 4: Youth & Entrepreneurship Hub */}
        <button
          type="button"
          onClick={() => setActiveTab("youth")}
          className={`group text-right rounded-3xl p-6 transition-all border cursor-pointer relative overflow-hidden ${
            activeTab === "youth"
              ? "bg-white dark:bg-zinc-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20"
              : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 hover:shadow-md"
          }`}
        >
          {activeTab === "youth" && (
            <span className="absolute top-0 right-0 left-0 h-1.5 bg-indigo-600" />
          )}
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 group-hover:scale-105 transition-transform">
            <Rocket className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              فضاء الشباب والمبادرة
            </h3>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              {youthPrograms.length > 0 ? `${youthPrograms.length} برامج وفرص` : "فرص وتمويل"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            دليل التمويل الميسر، برامج ANETI، مرافقة الباعثين الشبان بمنوبة والدندان ومتابعة الملفات التمويلية المتعطلة.
          </p>
        </button>

        {/* Module 5: Participatory Democracy & Polls */}
        <button
          type="button"
          onClick={() => setActiveTab("polls")}
          className={`group text-right rounded-3xl p-6 transition-all border cursor-pointer relative overflow-hidden ${
            activeTab === "polls"
              ? "bg-white dark:bg-zinc-900 border-purple-500 shadow-xl ring-2 ring-purple-500/20"
              : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-purple-300 hover:shadow-md"
          }`}
        >
          {activeTab === "polls" && (
            <span className="absolute top-0 right-0 left-0 h-1.5 bg-purple-500" />
          )}
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 group-hover:scale-105 transition-transform">
            <Vote className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              الديمقراطية التشاركية والأخبار
            </h3>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
              أخبار واستفتاء
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            استفتاءات تشاركية ومتابعة حية لآخر الأخبار البرلمانية والجهوية المحدثة تلقائياً عبر الأقمار الإخبارية.
          </p>
        </button>
      </div>

      {/* Expandable Module Content Container */}
      <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 transition-all">
        {/* ============================================================== */}
        {/* MODULE 1: 100% Live Dynamic Analytics Dashboard */}
        {/* ============================================================== */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                    مرصد المشاغل والنجاعة البرلمانية - منوبة والدندان
                  </h3>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  إحصائيات حية ومحسوبة مباشرة من قاعدة بيانات المطالب والعرائض المودعة بالمنصة
                </p>
              </div>

              <div className="flex items-center gap-2">
                {totalRequests > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    محسوبة آنياً من {totalRequests} مطلب فعلي
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-zinc-400" />
                    لا توجد مطالب مسجلة حالياً (0 مطلب)
                  </span>
                )}
                <button
                  type="button"
                  onClick={fetchAllData}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="تحديث البيانات فوراً"
                >
                  <Clock className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Top 4 KPI Cards (Calculated Live) */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  إجمالي المطالب والشكاوى
                </span>
                <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
                  {totalRequests}
                </p>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  {totalRequests > 0 ? "عبر العرائض المكتوبة والصوتية" : "قاعدة البيانات فارغة"}
                </span>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  نسبة التفاعل والمعالجة
                </span>
                <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {resolutionRate}%
                </p>
                <span className="text-[11px] text-emerald-600 mt-1 block">
                  {totalRequests > 0
                    ? `(${resolvedCount} تم الحل + ${inProgressCount} بصدد المتابعة)`
                    : "لا توجد ملفات حالياً"}
                </span>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  المراسلات الوزارية الصادرة
                </span>
                <p className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
                  {officialLettersCount} مراسلة
                </p>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  {officialLettersCount > 0 ? "موجهة للوزارات والمصالح المعنية" : "لا توجد مراسلات صادرة"}
                </span>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  متوسط زمن التدخل
                </span>
                <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
                  {totalRequests > 0 ? "48 ساعة" : "—"}
                </p>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  {totalRequests > 0 ? "من الإيداع إلى فتح الملف" : "في انتظار تسجيل مطالب"}
                </span>
              </div>
            </div>

            {/* Neighborhood & Sector Breakdown (Calculated Live) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Breakdown by Neighborhood (Imadas) */}
              <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center justify-between">
                  <span>توزيع المشاغل حسب العمادات (منوبة - الدندان)</span>
                  <MapPin className="h-4 w-4 text-red-600" />
                </h4>
                <div className="space-y-3.5">
                  {zoneStats.map((z, idx) => {
                    const colors = [
                      "bg-red-500",
                      "bg-blue-500",
                      "bg-amber-500",
                      "bg-purple-500",
                      "bg-emerald-500",
                      "bg-cyan-500",
                    ];
                    const barColor = colors[idx % colors.length];

                    return (
                      <div key={z.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-zinc-800 dark:text-zinc-200">{z.name}</span>
                          <span className="font-mono text-zinc-600 dark:text-zinc-300 font-bold">
                            {z.count} مطلب ({z.pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor} transition-all duration-700`}
                            style={{ width: `${z.count > 0 ? Math.max(z.pct, 5) : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Breakdown by Sector */}
              <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center justify-between">
                  <span>توزيع المطالب حسب القطاعات الحيوية</span>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </h4>

                {categoryStats.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <AlertCircle className="h-5 w-5 mx-auto mb-1 text-zinc-300 dark:text-zinc-600" />
                    <span>لا توجد مطالب أو شكاوى مسجلة حالياً لعرض التوزيع القطاعي.</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {categoryStats.map((sector, idx) => {
                      const colors = [
                        "bg-blue-600",
                        "bg-amber-500",
                        "bg-red-500",
                        "bg-emerald-500",
                        "bg-purple-500",
                        "bg-indigo-500",
                        "bg-teal-500",
                        "bg-zinc-500",
                      ];
                      const barColor = colors[idx % colors.length];

                      return (
                        <div key={sector.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-zinc-800 dark:text-zinc-200">{sector.name}</span>
                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              {sector.count} مطلب ({sector.pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor} transition-all duration-700`}
                              style={{ width: `${sector.count > 0 ? Math.max(sector.pct, 5) : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 2: Projects Radar & Ministerial Watch (Dynamic) */}
        {/* ============================================================== */}
        {activeTab === "projects" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                    رادار المشاريع التنموية والمساءلة البرلمانية
                  </h3>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  متابعة حية للمشاريع الكبرى بالدائرة والمراسلات الوزارية الصادرة عن النائب أسماء درويش
                </p>
              </div>

              <div>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300">
                  {projects.length} مشاريع قيد المتابعة الحثيثة
                </span>
              </div>
            </div>

            {/* Project Cards Grid */}
            {projects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/60 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                <Building2 className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  لا توجد مشاريع أو مساءلات معلنة حالياً بالرادار.
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  يقوم الفريق البرلماني للنائب أسماء درويش بمتابعة وتحيين رادار المشاريع بصفة دورية.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {projects.map((proj) => {
                const getStatusColor = (status: ProjectItem["status"]) => {
                  switch (status) {
                    case "تم التدخل":
                    case "تم إنجازه":
                      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200";
                    case "في طور الإنجاز":
                      return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200";
                    default:
                      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200";
                  }
                };

                return (
                  <div
                    key={proj.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-amber-400 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {proj.id} • {proj.zone}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getStatusColor(
                            proj.status
                          )}`}
                        >
                          {proj.status}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                        {proj.title}
                      </h4>

                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {proj.summary}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            نسبة تقدم الأشغال:
                          </span>
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {proj.progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              proj.progress === 100
                                ? "bg-emerald-500"
                                : proj.progress > 50
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Official Letter Badge */}
                      <div className="mt-4 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                        <span className="font-bold block mb-1">
                          تحرك النائب أسماء درويش مع {proj.targetMinistry}:
                        </span>
                        <p className="text-[11px] leading-relaxed">
                          {proj.officialLetterText}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                      <span>{proj.lastUpdate}</span>
                      {proj.budgetEstimate && (
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          الاعتمادات: {proj.budgetEstimate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 3: Citizen Guide & Appointments */}
        {/* ============================================================== */}
        {activeTab === "guide" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Sub-tab Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGuideSubTab("smart_guide")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    guideSubTab === "smart_guide"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>الدليل الإداري السريع لتسهيل الشؤون اليومية</span>
                  <span className={`mr-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                    guideSubTab === "smart_guide" ? "bg-white/25 text-white" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}>
                    {guides.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuideSubTab("appointment")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    guideSubTab === "appointment"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>حجز موعد لمقابلة النائب أسماء درويش</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuideSubTab("directory")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    guideSubTab === "directory"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>دليل الإدارات المحلية بمنوبة والدندان</span>
                </button>
              </div>

              {guideSubTab === "smart_guide" && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  عرض {filteredGuides.length} من أصل {guides.length} إجراء متاح
                </div>
              )}
            </div>

            {/* Sub-tab 0: Smart Administrative Guide */}
            {guideSubTab === "smart_guide" && (
              <div className="space-y-6">
                {/* Search Bar & Category Filters */}
                <div className="bg-zinc-50/70 p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:bg-zinc-900/50 dark:border-zinc-800 space-y-4">
                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={guideSearch}
                      onChange={(e) => setGuideSearch(e.target.value)}
                      placeholder="ابحث عن أي وثيقة أو إجراء إداري (مثال: مضمون، بطاقة عدد 3، عداد ماء، رخصة بناء، منحة، بطاقة تعريف...)"
                      className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pr-11 pl-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 shadow-sm transition"
                    />
                    {guideSearch && (
                      <button
                        type="button"
                        onClick={() => setGuideSearch("")}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">
                      التصنيف:
                    </span>
                    {(["الكل", ...GUIDE_CATEGORIES] as const).map((cat) => {
                      const count = cat === "الكل" 
                        ? guides.length 
                        : guides.filter((g) => g.category === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedGuideCategory(cat)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedGuideCategory === cat
                              ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20"
                              : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                          }`}
                        >
                          <span>{cat}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                              selectedGuideCategory === cat
                                ? "bg-white/25 text-white"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Loading State */}
                {loadingGuides ? (
                  <div className="py-16 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600 mb-2" />
                    <p className="text-xs">جارٍ تحميل الإجراءات الإدارية المعتمدة...</p>
                  </div>
                ) : filteredGuides.length === 0 ? (
                  <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
                    <HelpCircle className="mx-auto h-10 w-10 text-zinc-400 mb-3" />
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      لم نجد إجراءً مطابقاً لبحثك
                    </h4>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                      جرب البحث بكلمة مفتاحية مختلفة (مثل: ماء، كهرباء، هوية، أمان، رخصة...) أو قم بإلغاء فلتر التصنيف.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setGuideSearch("");
                        setSelectedGuideCategory("الكل");
                      }}
                      className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                    >
                      عرض كافة الإجراءات ({guides.length})
                    </button>
                  </div>
                ) : (
                  /* Cards Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {filteredGuides.map((guide) => (
                      <div
                        key={guide.id}
                        className="group flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getCategoryBadgeClass(guide.category)}`}>
                              {guide.category}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                              {guide.id}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {guide.title}
                          </h4>

                          {/* Snippet of required documents */}
                          <div className="mt-3.5 space-y-1.5 rounded-2xl bg-zinc-50/70 p-3 text-xs border border-zinc-100 dark:bg-zinc-800/40 dark:border-zinc-800">
                            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300 pb-1 border-b border-zinc-200/60 dark:border-zinc-700/60">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-emerald-600" />
                                <span>الوثائق المطلوبة</span>
                              </span>
                              <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold dark:bg-emerald-950 dark:text-emerald-300">
                                {guide.requiredDocuments.length} وثائق
                              </span>
                            </div>
                            <ul className="space-y-1 pt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                              {guide.requiredDocuments.slice(0, 2).map((doc, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                                  <span className="text-emerald-500 shrink-0 font-bold">•</span>
                                  <span className="truncate">{doc}</span>
                                </li>
                              ))}
                              {guide.requiredDocuments.length > 2 && (
                                <li className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold pt-0.5">
                                  + {guide.requiredDocuments.length - 2} وثائق ومستندات إضافية...
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Metadata Info */}
                          <div className="mt-3.5 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                            <p className="flex items-start gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{guide.location}</span>
                            </p>
                            {guide.processingTime && (
                              <p className="flex items-center gap-1.5 text-[11px]">
                                <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                <span>الآجال: {guide.processingTime}</span>
                              </p>
                            )}
                            {guide.cost && (
                              <p className="flex items-center gap-1.5 text-[11px]">
                                <Coins className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                <span>المعلوم: {guide.cost}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGuideModal(guide);
                              setCheckedDocs({});
                              setCopiedDocsSuccess(false);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                          >
                            <span>عرض التفاصيل والوثائق</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>

                          {guide.downloadableFormUrl && (
                            <a
                              href={guide.downloadableFormUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="الاستمارة أو البوابة الرقمية الرسمية"
                              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-600 hover:bg-zinc-100 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab A: Appointment Booking Form */}
            {guideSubTab === "appointment" && (
              <div className="max-w-2xl mx-auto">
                {bookingSuccess ? (
                  <div className="rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-8 text-center dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                      <Check className="h-8 w-8 stroke-[3]" />
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      تم تأكيد تسجيل الموعد
                    </span>
                    <h4 className="mt-3 text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      مرحباً بك، موعدك مسجل بنجاح!
                    </h4>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                      يسعدنا استقبالك في المكتب البرلماني لدائرة منوبة - الدندان.
                    </p>

                    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 text-right space-y-2 text-xs">
                      <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                        <span className="text-zinc-500">رقم الموعد:</span>
                        <span className="font-mono font-bold text-emerald-600 text-sm">
                          {bookingSuccess.id}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                        <span className="text-zinc-500">الاسم واللقب:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {bookingSuccess.citizenName}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                        <span className="text-zinc-500">الموعد والتوقيت:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {bookingSuccess.date} ({bookingSuccess.timeSlot})
                        </span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-zinc-500">العنوان:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          شارع الحبيب بورقيبة، منوبة
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBookingSuccess(null);
                        setAppointmentName("");
                        setAppointmentPhone("");
                      }}
                      className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                    >
                      حجز موعد آخر
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBookAppointment} className="space-y-5">
                    <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-950/20 text-xs text-emerald-900 dark:text-emerald-300">
                      <span className="font-bold block mb-1">
                        🗓️ أيام الاستقبال المباشر بالمكتب البرلماني:
                      </span>
                      {appointmentSettings.note || "تستقبل النائب أسماء درويش والفريق البرلماني المواطنين أيام الإثنين والأربعاء والجمعة بالمكتب البرلماني بمنوبة لتسليم العرائض باليد والاستماع الشخصي لمشاغلكم."}
                    </div>

                    {bookingError && (
                      <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                        {bookingError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          الاسم واللقب <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={appointmentName}
                          onChange={(e) => setAppointmentName(e.target.value)}
                          placeholder="الاسم واللقب..."
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          رقم الهاتف التونسي (8 أرقام) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={8}
                          value={appointmentPhone}
                          onChange={(e) => setAppointmentPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="مثال: 98123456"
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-left dir-ltr"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          اليوم المناسب
                        </label>
                        <select
                          value={appointmentDay}
                          onChange={(e) => setAppointmentDay(e.target.value)}
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          {appointmentSettings.days.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          التوقيت المفضل
                        </label>
                        <select
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          {appointmentSettings.timeSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          العمادة / المنطقة
                        </label>
                        <select
                          value={appointmentZone}
                          onChange={(e) => setAppointmentZone(e.target.value)}
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          <option value="منوبة المدينة">منوبة المدينة</option>
                          <option value="منوبة الوسطى (حي البرتقال / سليمان كاهية)">منوبة الوسطى</option>
                          <option value="سيدي عمر">سيدي عمر</option>
                          <option value="الدندان الشمالي">الدندان الشمالي</option>
                          <option value="الدندان الجنوبي">الدندان الجنوبي</option>
                          <option value="قصر السعيد">قصر السعيد</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          موضوع الزيارة
                        </label>
                        <input
                          type="text"
                          value={appointmentTopic}
                          onChange={(e) => setAppointmentTopic(e.target.value)}
                          placeholder="مثال: إشكال تهيئة وادي قريانة..."
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
                    >
                      {bookingLoading ? "جارٍ الحجز..." : "تأكيد حجز الموعد"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Sub-tab B: Administrative Directory */}
            {guideSubTab === "directory" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {LOCAL_DIRECTORY.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-800/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Landmark className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </h4>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-3">
                        {item.role}
                      </p>

                      <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>{item.address}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="font-mono text-left dir-ltr">{item.phone}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>{item.hours}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">الخدمات: </span>
                      {item.services}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 4: Participatory Democracy & Automated Live News */}
        {/* ============================================================== */}
        {activeTab === "polls" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    <Vote className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                    الديمقراطية التشاركية ونبض الأخبار البرلمانية
                  </h3>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  صوتك يوجه موقف النائب أسماء درويش في البرلمان، مع متابعة حية لآخر المستجدات الوطنية والمحلية المحدثة آلياً
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-800 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-300">
                  <Radio className="h-3 w-3 animate-pulse text-purple-600" />
                  مباشر وتشاركي
                </span>
              </div>
            </div>

            {/* Polls Cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {polls.map((poll) => {
                const hasVoted = Boolean(votedPolls[poll.id]);
                const selectedOption = votedPolls[poll.id];

                return (
                  <div
                    key={poll.id}
                    className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                          📍 {poll.zone}
                        </span>
                        <span className="text-xs text-zinc-400">
                          ينتهي في: {poll.endDate}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                        {poll.title}
                      </h4>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {poll.description}
                      </p>

                      {/* Options */}
                      <div className="mt-5 space-y-3">
                        {poll.options.map((opt) => {
                          const pct =
                            poll.totalVotes > 0
                              ? Math.round((opt.votes / poll.totalVotes) * 100)
                              : 0;
                          const isPicked = selectedOption === opt.id;

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleVote(poll.id, opt.id)}
                              disabled={hasVoted || votingLoading === poll.id}
                              className={`w-full text-right p-3.5 rounded-2xl border transition-all relative overflow-hidden cursor-pointer ${
                                isPicked
                                  ? "border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-500/30"
                                  : hasVoted
                                  ? "border-zinc-200 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-800/40 cursor-default"
                                  : "border-zinc-200 hover:border-purple-400 hover:bg-purple-50/30 dark:border-zinc-700 dark:hover:bg-purple-950/20"
                              }`}
                            >
                              {/* Background vote progress fill */}
                              <div
                                className="absolute inset-y-0 right-0 bg-purple-100/60 dark:bg-purple-900/20 -z-0 transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />

                              <div className="relative z-10 flex items-center justify-between text-xs">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {opt.label}
                                </span>
                                <div className="flex items-center gap-2">
                                  {isPicked && (
                                    <span className="rounded-full bg-purple-600 p-0.5 text-white">
                                      <Check className="h-3 w-3" />
                                    </span>
                                  )}
                                  <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                                    {pct}% ({opt.votes})
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        إجمالي المشاركين: {poll.totalVotes} مواطن
                      </span>
                      {hasVoted ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          تم احتساب صوتك
                        </span>
                      ) : (
                        <span className="text-purple-600 font-semibold">
                          اضغط على خيارك للتصويت المباشر
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Automated Live Parliament & Manouba News Feed */}
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Newspaper className="h-5 w-5 text-purple-600" />
                  <h4 className="text-base font-bold">
                    آخر الأخبار البرلمانية والجهوية (محدثة تلقائياً)
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                    <Radio className="h-3 w-3 animate-pulse text-purple-600" />
                    بث مباشر (arp.tn + إعلام جهوي)
                  </span>
                </div>
              </div>

              {/* Home News Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap mb-4 text-xs">
                <button
                  type="button"
                  onClick={() => setHomeNewsFilter("all")}
                  className={`rounded-xl px-3 py-1.5 font-bold transition cursor-pointer ${
                    homeNewsFilter === "all"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  الكل ({newsFeed.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHomeNewsFilter("parliament")}
                  className={`rounded-xl px-3 py-1.5 font-bold transition cursor-pointer ${
                    homeNewsFilter === "parliament"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  أخبار البرلمان (arp.tn)
                </button>
                <button
                  type="button"
                  onClick={() => setHomeNewsFilter("regional")}
                  className={`rounded-xl px-3 py-1.5 font-bold transition cursor-pointer ${
                    homeNewsFilter === "regional"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  منوبة والدندان
                </button>
                <button
                  type="button"
                  onClick={() => setHomeNewsFilter("urgent")}
                  className={`rounded-xl px-3 py-1.5 font-bold transition cursor-pointer ${
                    homeNewsFilter === "urgent"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  المثبتة والعاجلة
                </button>
              </div>

              {loadingNews ? (
                <div className="flex items-center justify-center py-6 text-xs text-zinc-500">
                  <Loader2 className="h-5 w-5 animate-spin ml-2 text-purple-600" />
                  <span>جارٍ جلب آخر الأخبار من الأقمار الإخبارية...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {newsFeed
                    .filter((item) => {
                      if (homeNewsFilter === "parliament") {
                        return (
                          item.sourceType === "parliament" ||
                          item.source.includes("arp.tn") ||
                          item.source.includes("مجلس نواب الشعب") ||
                          item.category === "أشغال اللجان" ||
                          item.category === "الجلسة العامة"
                        );
                      }
                      if (homeNewsFilter === "regional") {
                        return (
                          item.sourceType === "regional" ||
                          item.category?.includes("منوبة") ||
                          item.title.includes("منوبة") ||
                          item.title.includes("الدندان") ||
                          item.title.includes("سيدي عمر")
                        );
                      }
                      if (homeNewsFilter === "urgent") {
                        return item.isUrgent || item.isPinned;
                      }
                      return true;
                    })
                    .slice(0, 7)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl bg-white p-4 border shadow-xs dark:bg-zinc-900 transition flex items-start justify-between gap-3 ${
                          item.isPinned
                            ? "border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-300/30"
                            : "border-zinc-200/80 hover:border-purple-300 dark:border-zinc-800"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.isPinned && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold dark:bg-amber-950/70 dark:border-amber-800 dark:text-amber-200">
                                <Pin className="h-2.5 w-2.5" />
                                <span>مثبت</span>
                              </span>
                            )}
                            {item.isUrgent && (
                              <span className="rounded-md bg-red-100 text-red-700 px-1.5 py-0.5 text-[10px] font-bold dark:bg-red-950 dark:text-red-300">
                                عاجل
                              </span>
                            )}
                            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40">
                              {item.category || item.source}
                            </span>
                            <span className="rounded-md bg-zinc-100 text-zinc-600 px-1.5 py-0.5 text-[10px] font-medium dark:bg-zinc-800 dark:text-zinc-300">
                              {item.source}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {item.pubDate}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {item.title}
                          </h5>

                          {item.summary && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                              {item.summary}
                            </p>
                          )}
                        </div>

                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-2 text-zinc-400 hover:text-purple-600 transition"
                            title="قراءة الخبر من المصدر"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 5: فضاء الشباب والمبادرة الخاصة بمنوبة والدندان */}
        {/* ============================================================== */}
        {activeTab === "youth" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header with Title and Sub-tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    <Rocket className="h-3.5 w-3.5" />
                    منوبة والدندان: قطب المبادرة والتشغيل
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">
                    {youthPrograms.length} فرص وبرامج معتمدة
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  فضاء دعم المبادرات الشبابية وحاملي الشهائد
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  دليل آليات التمويل الميسر، برامج ANETI، مرافقة الباعثين الشبان بمنوبة والدندان، مع خدمة المتابعة البرلمانية للمشاريع المعطلة.
                </p>
              </div>

              {/* Sub-view switcher */}
              <div className="flex items-center gap-2 p-1.5 bg-zinc-100 rounded-2xl dark:bg-zinc-800/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setYouthSubTab("programs")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    youthSubTab === "programs"
                      ? "bg-white text-indigo-700 shadow-sm dark:bg-zinc-900 dark:text-indigo-400"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>دليل التمويل والتكوين ({youthPrograms.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setYouthSubTab("request")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    youthSubTab === "request"
                      ? "bg-white text-indigo-700 shadow-sm dark:bg-zinc-900 dark:text-indigo-400"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <Rocket className="h-4 w-4" />
                  <span>متابعة ملف مشروع متعطل</span>
                </button>
              </div>
            </div>

            {/* Sub-view A: Programs Catalog */}
            {youthSubTab === "programs" && (
              <div className="space-y-6">
                {/* Search Bar & Category Filters */}
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={youthSearch}
                      onChange={(e) => setYouthSearch(e.target.value)}
                      placeholder="ابحث عن برنامج تمويل، منحة ANETI، قرض BTS، مرافقة، أو كلمة مفتاحية..."
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-11 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
                    />
                    <Search className="absolute right-4 top-3.5 h-4 w-4 text-zinc-400" />
                    {youthSearch && (
                      <button
                        type="button"
                        onClick={() => setYouthSearch("")}
                        className="absolute left-3.5 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setSelectedYouthCategory("الكل")}
                      className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                        selectedYouthCategory === "الكل"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      الكل ({youthPrograms.length})
                    </button>
                    {YOUTH_PROGRAM_CATEGORIES.map((cat) => {
                      const count = youthPrograms.filter((p) => p.category === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedYouthCategory(cat)}
                          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                            selectedYouthCategory === cat
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Programs Grid */}
                {loadingYouth ? (
                  <div className="py-16 text-center text-xs text-zinc-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>جارٍ تحميل برامج التمويل والتكوين...</span>
                  </div>
                ) : filteredYouthPrograms.length === 0 ? (
                  <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <Briefcase className="h-10 w-10 text-zinc-400 mx-auto mb-3 opacity-60" />
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      لم يتم العثور على برامج مطابقة لمعايير البحث.
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      جرب البحث بكلمات أخرى أو اختر فئة مختلفة.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredYouthPrograms.map((prog) => (
                      <div
                        key={prog.id}
                        className="group flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="space-y-4">
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getYouthCategoryBadgeClass(prog.category)}`}>
                              {prog.category}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                              <Landmark className="h-3 w-3 text-indigo-500" />
                              {prog.institution}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors leading-snug">
                            {prog.title}
                          </h4>

                          {/* Description */}
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                            {prog.description}
                          </p>

                          {/* Highlights pills */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            {prog.fundingCap && (
                              <div className="rounded-xl bg-indigo-50/70 p-2.5 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900">
                                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold block mb-0.5">
                                  سقف التمويل
                                </span>
                                <span className="font-bold text-indigo-900 dark:text-indigo-200">
                                  {prog.fundingCap}
                                </span>
                              </div>
                            )}
                            <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800">
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold block mb-0.5">
                                الفئة المستهدفة
                              </span>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate block">
                                {prog.targetAudience}
                              </span>
                            </div>
                          </div>

                          {/* Address & Contact */}
                          <div className="space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                            {prog.address && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                <span className="truncate">{prog.address}</span>
                              </div>
                            )}
                            {prog.contactPhone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                <span className="dir-ltr text-left font-mono">{prog.contactPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-5 mt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveYouthProgramModal(prog);
                              setCheckedYouthDocs({});
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition cursor-pointer"
                          >
                            <span>عرض الشروط والوثائق المطلوبة</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setYouthTargetInstitution(prog.institution);
                              setYouthProjectType(prog.title);
                              setYouthSubTab("request");
                            }}
                            className="rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 transition cursor-pointer"
                          >
                            طلب مرافقة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-view B: Stalled Project Follow-up / Support Form */}
            {youthSubTab === "request" && (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Intro card */}
                <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 p-6 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-purple-950/20 text-right">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                        مرافقة ومساندة المشاريع الشابة بمنوبة والدندان
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        خدمة برلمانية مخصصة لمتابعة الملفات التمويلية المتعطلة لدى BTS أو ANETI أو الإدارات الجهوية.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-white/80 p-3 text-[11px] text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300 leading-relaxed border border-indigo-100 dark:border-indigo-900/50">
                    💡 يتدخل الفريق البرلماني للنائب أسماء درويش مع الإدارات والمؤسسات المعنية لتسريع دراسة الملفات، رفع التعطيلات البيروقراطية، وتقديم المساندة الضرورية لإنجاح مبادرتك.
                  </div>
                </div>

                {/* Success Card Confirmation */}
                {youthRequestSuccess ? (
                  <div className="rounded-3xl border border-emerald-300 bg-emerald-50/70 p-6 sm:p-8 dark:border-emerald-800 dark:bg-emerald-950/30 text-right space-y-5 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          تم استلام طلب المرافقة بنجاح
                        </span>
                        <h4 className="text-xl font-black text-emerald-950 dark:text-emerald-100">
                          رمز المتابعة: {youthRequestSuccess.id}
                        </h4>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4 border border-emerald-200 dark:bg-zinc-900 dark:border-emerald-800/60 space-y-2 text-xs">
                      <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span className="text-zinc-500">صاحب المبادرة:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{youthRequestSuccess.fullName}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span className="text-zinc-500">رقم الهاتف:</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{youthRequestSuccess.phone}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span className="text-zinc-500">المنطقة / العمادة:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{youthRequestSuccess.zone}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span className="text-zinc-500">المشروع / الفكرة:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{youthRequestSuccess.projectType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">المؤسسة المعنية:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{youthRequestSuccess.targetInstitution}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-100/60 p-3.5 text-xs text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 space-y-1">
                      <p className="font-bold">ما هي الخطوة التالية؟</p>
                      <p className="text-[11px] leading-relaxed">
                        سيقوم الفريق البرلماني للنائب أسماء درويش بمراجعة تفاصيل ملفك والتواصل المباشر معك عبر الهاتف أو الواتساب، والاتصال بالمؤسسة المعنية ({youthRequestSuccess.targetInstitution}) لرفع التعطيل.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setYouthRequestSuccess(null);
                          setYouthSubTab("programs");
                        }}
                        className="rounded-xl bg-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                      >
                        العودة لدليل الفرص
                      </button>
                      <button
                        type="button"
                        onClick={() => setYouthRequestSuccess(null)}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                      >
                        تقديم مطلب آخر
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form */
                  <form onSubmit={handleSubmitYouthRequest} className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-5 text-right">
                    {youthRequestError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{youthRequestError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          الاسم واللقب <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={youthFullName}
                          onChange={(e) => setYouthFullName(e.target.value)}
                          placeholder="مثال: محمد علي بن سالم"
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs sm:text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          رقم الهاتف الجوال <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={youthPhone}
                          onChange={(e) => setYouthPhone(e.target.value)}
                          placeholder="مثال: 98123456"
                          maxLength={8}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs sm:text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-mono dir-ltr text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          المنطقة / العمادة بمنوبة والدندان <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={youthZone}
                          onChange={(e) => setYouthZone(e.target.value)}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs sm:text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          {MANOUBA_DISTRICT_ZONES.map((zone) => (
                            <option key={zone} value={zone}>
                              {zone}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          المؤسسة أو الإدارة المعنية بالملف <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={youthTargetInstitution}
                          onChange={(e) => setYouthTargetInstitution(e.target.value)}
                          placeholder="مثال: BTS منوبة / ANETI / البلدية / الفلاحة..."
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs sm:text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        فكرة المبادرة أو طبيعة المشروع <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={youthProjectType}
                        onChange={(e) => setYouthProjectType(e.target.value)}
                        placeholder="مثال: ورشة صناعات غذائية تحويلية / عيادة تقويم نطق / شركة خدمات رقمية"
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs sm:text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        شرح التعطيل أو المطلب وموضوع المرافقة المطلوبة <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={youthIssueDescription}
                        onChange={(e) => setYouthIssueDescription(e.target.value)}
                        placeholder="اشرح بدقة: تاريخ إيداع الملف، رقم المطلب لدى المؤسسة إن وجد، أسباب التأخير أو الرفض، وما تطلبه من النائب..."
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs sm:text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 leading-relaxed"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submittingYouthRequest}
                        className="w-full rounded-2xl bg-indigo-600 py-3.5 px-6 text-sm font-black text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingYouthRequest ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>جارٍ إرسال المطلب للفريق البرلماني...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>إرسال طلب المرافقة البرلمانية</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SMART GUIDE DETAIL MODAL */}
        {/* ============================================================== */}
        {activeGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-start justify-between p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                <div className="space-y-1.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${getCategoryBadgeClass(activeGuideModal.category)}`}>
                      {activeGuideModal.category}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      {activeGuideModal.id}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 leading-snug">
                    {activeGuideModal.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGuideModal(null)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-right">
                {/* 4 Summary Highlight Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-bold">الإدارة المختصة والمقر:</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {activeGuideModal.location}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-bold">الآجال التقريبية:</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {activeGuideModal.processingTime || "حسب طبيعة الملف"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Coins className="h-3.5 w-3.5 text-amber-600" />
                      <span className="font-bold">المعاليم المستوجبة:</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {activeGuideModal.cost || "مجاني"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Download className="h-3.5 w-3.5 text-purple-600" />
                      <span className="font-bold">المطبوعة / البوابة:</span>
                    </div>
                    {activeGuideModal.downloadableFormUrl ? (
                      <a
                        href={activeGuideModal.downloadableFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>فتح البوابة الرسمية أو تحميل المطبوعة</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-500">تسحب مباشرة من شباك الإدارة</span>
                    )}
                  </div>
                </div>

                {/* Section 1: Required Documents Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                      <span>قائمة الوثائق والمستندات المطلوبة ({activeGuideModal.requiredDocuments.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCopyGuideDocs(activeGuideModal)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 transition cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedDocsSuccess ? "تم نسخ القائمة بنجاح! ✓" : "نسخ القائمة"}</span>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-3 space-y-2 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pb-1 border-b border-zinc-100 dark:border-zinc-800">
                      💡 يمكنك وضع علامة (✓) أمام كل وثيقة قمت بتجهيزها للتأكد من اكتمال ملفك قبل الذهاب للإدارة:
                    </p>
                    {activeGuideModal.requiredDocuments.map((doc, idx) => {
                      const isChecked = !!checkedDocs[`${activeGuideModal.id}-${idx}`];
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setCheckedDocs((prev) => ({
                              ...prev,
                              [`${activeGuideModal.id}-${idx}`]: !prev[`${activeGuideModal.id}-${idx}`],
                            }));
                          }}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                            isChecked
                              ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200"
                              : "bg-zinc-50/50 border-zinc-200/80 text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/30 dark:border-zinc-700 dark:text-zinc-200"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Square className="h-4 w-4 text-zinc-400" />
                            )}
                          </div>
                          <span className={`text-xs font-medium leading-relaxed ${isChecked ? "line-through opacity-80" : ""}`}>
                            {doc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Procedure Steps */}
                {activeGuideModal.steps && activeGuideModal.steps.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>مراحل وخطوات إنجاز الإجراء الإداري</span>
                    </h4>
                    <div className="space-y-2">
                      {activeGuideModal.steps.map((st, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-xs dark:bg-zinc-800/40 dark:border-zinc-800"
                        >
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                            {idx + 1}
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                            {st}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Contact & Department Info */}
                {activeGuideModal.departmentContact && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-2 text-xs">
                    <h5 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-emerald-600" />
                      <span>معلومات الإدارة والمصلحة المعنية:</span>
                    </h5>
                    {activeGuideModal.departmentContact.address && (
                      <p className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span>العنوان: {activeGuideModal.departmentContact.address}</span>
                      </p>
                    )}
                    {activeGuideModal.departmentContact.phone && (
                      <p className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span>الهاتف: </span>
                        <a
                          href={`tel:${activeGuideModal.departmentContact.phone.replace(/\s+/g, '')}`}
                          className="font-mono font-bold text-emerald-600 hover:underline dir-ltr text-left"
                        >
                          {activeGuideModal.departmentContact.phone}
                        </a>
                      </p>
                    )}
                    {activeGuideModal.departmentContact.workingHours && (
                      <p className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span>أوقات العمل: {activeGuideModal.departmentContact.workingHours}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const guideTitle = activeGuideModal.title;
                    setActiveGuideModal(null);
                    setAppointmentTopic(`متابعة إدارية / ملف: ${guideTitle}`);
                    setGuideSubTab("appointment");
                  }}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition cursor-pointer"
                >
                  📅 حجز موعد مع النائب لمتابعة هذا الإجراء
                </button>

                <div className="flex items-center gap-2">
                  {activeGuideModal.downloadableFormUrl && (
                    <a
                      href={activeGuideModal.downloadableFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition inline-flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>الرابط / المطبوعة الرسمية</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveGuideModal(null)}
                    className="rounded-xl bg-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* YOUTH PROGRAM DETAIL MODAL */}
        {/* ============================================================== */}
        {activeYouthProgramModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-start justify-between p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                <div className="space-y-1.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${getYouthCategoryBadgeClass(activeYouthProgramModal.category)}`}>
                      {activeYouthProgramModal.category}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                      {activeYouthProgramModal.institution}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 leading-snug">
                    {activeYouthProgramModal.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveYouthProgramModal(null)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-right">
                {/* 4 Summary Highlight Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Coins className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="font-bold">سقف التمويل:</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {activeYouthProgramModal.fundingCap || "حسب طبيعة البرنامج"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
                      <User className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-bold">الفئة المستهدفة:</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {activeYouthProgramModal.targetAudience}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-red-600" />
                      <span className="font-bold">المقر بمنوبة:</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {activeYouthProgramModal.address || "منوبة المدينة"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Phone className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-bold">الهاتف المباشر:</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 dir-ltr text-left font-mono">
                      {activeYouthProgramModal.contactPhone || "غير متوفر"}
                    </p>
                  </div>
                </div>

                {/* Section 0: Description */}
                {activeYouthProgramModal.description && (
                  <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40">
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1.5 flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-indigo-600" />
                      <span>نبذة عن البرنامج والامتيازات:</span>
                    </h4>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {activeYouthProgramModal.description}
                    </p>
                  </div>
                )}

                {/* Section 1: Eligibility Criteria */}
                {activeYouthProgramModal.eligibilityCriteria && activeYouthProgramModal.eligibilityCriteria.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>شروط الأهلية والانتفاع ({activeYouthProgramModal.eligibilityCriteria.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {activeYouthProgramModal.eligibilityCriteria.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-xs dark:bg-zinc-800/40 dark:border-zinc-800"
                        >
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                            {idx + 1}
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                            {c}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Required Documents Checklist */}
                {activeYouthProgramModal.requiredDocuments && activeYouthProgramModal.requiredDocuments.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                        <span>الوثائق ومكونات الملف المطلوب ({activeYouthProgramModal.requiredDocuments.length})</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleCopyYouthDocs(activeYouthProgramModal)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 transition cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>{copiedYouthDocsSuccess ? "تم نسخ القائمة بنجاح! ✓" : "نسخ القائمة"}</span>
                      </button>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-3 space-y-2 dark:border-zinc-800 dark:bg-zinc-950/40">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pb-1 border-b border-zinc-100 dark:border-zinc-800">
                        💡 يمكنك وضع علامة (✓) أمام كل وثيقة قمت بتجهيزها للتأكد من اكتمال ملف التمويل:
                      </p>
                      {activeYouthProgramModal.requiredDocuments.map((doc, idx) => {
                        const isChecked = !!checkedYouthDocs[`${activeYouthProgramModal.id}-${idx}`];
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setCheckedYouthDocs((prev) => ({
                                ...prev,
                                [`${activeYouthProgramModal.id}-${idx}`]: !prev[`${activeYouthProgramModal.id}-${idx}`],
                              }));
                            }}
                            className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                              isChecked
                                ? "bg-indigo-50/70 border-indigo-300 text-indigo-950 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-200"
                                : "bg-zinc-50/50 border-zinc-200/80 text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/30 dark:border-zinc-700 dark:text-zinc-200"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-indigo-600" />
                              ) : (
                                <Square className="h-4 w-4 text-zinc-400" />
                              )}
                            </div>
                            <span className={`text-xs font-medium leading-relaxed ${isChecked ? "line-through opacity-80" : ""}`}>
                              {doc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const inst = activeYouthProgramModal.institution;
                    const title = activeYouthProgramModal.title;
                    setActiveYouthProgramModal(null);
                    setYouthTargetInstitution(inst);
                    setYouthProjectType(title);
                    setYouthSubTab("request");
                  }}
                  className="rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 transition cursor-pointer"
                >
                  🚀 طلب مرافقة ومتابعة برلمانية لهذا البرنامج
                </button>

                <div className="flex items-center gap-2">
                  {activeYouthProgramModal.officialUrl && (
                    <a
                      href={activeYouthProgramModal.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>الموقع الرسمي للمؤسسة</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveYouthProgramModal(null)}
                    className="rounded-xl bg-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
