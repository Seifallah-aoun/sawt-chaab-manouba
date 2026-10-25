"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Send, 
  Award, 
  AlertCircle, 
  Loader2, 
  Building2, 
  FileText, 
  Volume2, 
  MapPin, 
  ChevronRight,
  ExternalLink,
  Calendar,
  User,
  Mic,
  Download
} from "lucide-react";
import { Complaint, ComplaintStatus } from "@/lib/types";

interface ComplaintTrackerProps {
  initialSearchQuery?: string;
}

const STEPS: { status: ComplaintStatus; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    status: "جديد",
    label: "1. تم استلام المطلب",
    desc: "توثيق المطلب بسجل دائرة منوبة - الدندان",
    icon: CheckCircle2,
  },
  {
    status: "بصدد الدرس",
    label: "2. بصدد الدرس والتدقيق",
    desc: "دراسة المعطيات وتحديد التدخل مع الهياكل الجهوية والمحلية",
    icon: Clock,
  },
  {
    status: "تمت مراسلة الوزارة/البلدية",
    label: "3. تمت مراسلة الجهة المعنية",
    desc: "توجيه سؤال كتابي أو مراسلة رسمية للوزارة أو بلدية منوبة/الدندان",
    icon: Send,
  },
  {
    status: "تم الحل",
    label: "4. تم الحل / الرد النهائي",
    desc: "ورود الرد الرسمي وإنجاز التدخل الميداني بالعمادة",
    icon: Award,
  },
];

const STATUS_ORDER: Record<ComplaintStatus, number> = {
  جديد: 1,
  "بصدد الدرس": 2,
  "تمت مراسلة الوزارة/البلدية": 3,
  "تم الحل": 4,
};

export default function ComplaintTracker({ initialSearchQuery = "" }: ComplaintTrackerProps) {
  const [query, setQuery] = useState(initialSearchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [multipleResults, setMultipleResults] = useState<Complaint[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialSearchQuery) {
      setQuery(initialSearchQuery);
      performSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Real-time synchronization when admin replies or status changes
  useEffect(() => {
    const handleUpdate = () => {
      if (selectedComplaint?.id) {
        performSearch(selectedComplaint.id, true);
      } else if (query && query.trim().length >= 4) {
        performSearch(query.trim(), true);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "mp_last_update") {
        handleUpdate();
      }
    };

    window.addEventListener("mp_data_updated", handleUpdate);
    window.addEventListener("storage", handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("mp_data_sync");
        bc.onmessage = () => handleUpdate();
      }
    } catch {}

    return () => {
      window.removeEventListener("mp_data_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      bc?.close();
    };
  }, [selectedComplaint?.id, query]);

  const performSearch = async (searchTarget: string, silent = false) => {
    const term = searchTarget.trim();
    if (!term) {
      if (!silent) setError("الرجاء إدخال رمز المتابعة أو رقم الهاتف.");
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setError(null);
      setSelectedComplaint(null);
      setMultipleResults([]);
    }

    try {
      const isPhone = /^\d{8}$/.test(term.replace(/\s+/g, ""));
      const param = isPhone ? `phone=${encodeURIComponent(term.replace(/\s+/g, ""))}` : `id=${encodeURIComponent(term)}`;

      const res = await fetch(`/api/complaints?${param}&t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "لم يتم العثور على أي مطلب بهذا الرمز أو رقم الهاتف.");
      }

      if (data.complaint) {
        setSelectedComplaint(data.complaint);
      } else if (data.complaints && data.complaints.length > 0) {
        if (data.complaints.length === 1) {
          setSelectedComplaint(data.complaints[0]);
        } else {
          setMultipleResults(data.complaints);
        }
      } else {
        throw new Error("لم يتم العثور على أي مطلب مسجل.");
      }
    } catch (err: unknown) {
      if (!silent) {
        const msg = err instanceof Error ? err.message : "تعذر استرجاع حالة المطلب.";
        setError(msg);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const currentStepNumber = selectedComplaint ? STATUS_ORDER[selectedComplaint.status] || 1 : 1;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("ar-TN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <section id="tracking-section" className="py-12 sm:py-16 scroll-mt-20">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 mb-3 border border-blue-200 dark:border-blue-900">
            <Search className="h-3.5 w-3.5" />
            نظام المتابعة الحية والشفافية البرلمانية
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            تتبع مآل مطلبك أو شكواك
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            أدخل رمز التتبع الخاص بمطلبك (مثال: TN-1024) أو رقم هاتفك التونسي للاطلاع المباشر على الحالة والردود الرسمية بدائرة منوبة - الدندان
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="mx-auto max-w-2xl">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl bg-white p-2 shadow-lg border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
          >
            <div className="relative flex-1 w-full">
              <input
                ref={inputRef}
                id="tracking-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="أدخل رمز المتابعة (TN-XXXX) أو رقم الهاتف (8 أرقام)..."
                className="w-full rounded-xl bg-transparent py-3 pr-4 pl-10 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 transition disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جارٍ البحث...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>بحث ومتابعة</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Badges (Manouba - Den Den) */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">أمثلة تجريبية بدائرة منوبة:</span>
            <button
              type="button"
              onClick={() => {
                setQuery("TN-1024");
                performSearch("TN-1024");
              }}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700 hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition cursor-pointer"
            >
              TN-1024 (سيدي عمر - ماء SONEDE)
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("TN-2048");
                performSearch("TN-2048");
              }}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700 hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition cursor-pointer"
            >
              TN-2048 (الدندان الشمالي - شكوى صوتية صحة)
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("TN-3072");
                performSearch("TN-3072");
              }}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700 hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition cursor-pointer"
            >
              TN-3072 (قصر السعيد - تعبيد وإنارة)
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("TN-4150");
                performSearch("TN-4150");
              }}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700 hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition cursor-pointer"
            >
              TN-4150 (منوبة المدينة - نقل)
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-auto mt-6 max-w-2xl flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <p>{error}</p>
          </div>
        )}

        {/* Multiple Results for phone lookup */}
        {multipleResults.length > 0 && (
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              تم العثور على {multipleResults.length} مطالب مرتبطة برقم هاتفك:
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {multipleResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedComplaint(item)}
                  className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-red-400 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      {item.id}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {item.status}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 flex items-center gap-1.5">
                    {item.type === "voice" || item.audioBase64 ? (
                      <Mic className="h-3.5 w-3.5 text-red-600" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                    )}
                    <span>{item.category} - {item.zone}</span>
                  </h5>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-red-600 font-bold">
                    <span>عرض التفاصيل ومخطط المراحل</span>
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Complaint Detail View */}
        {selectedComplaint && (
          <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">
                    {selectedComplaint.id}
                  </span>
                  
                  {selectedComplaint.type === "voice" || selectedComplaint.audioBase64 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
                      <Mic className="h-3 w-3" />
                      شكوى صوتية
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300">
                      <FileText className="h-3 w-3" />
                      عريضة كتابية
                    </span>
                  )}

                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {selectedComplaint.category}
                  </span>

                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    أولوية {selectedComplaint.priority}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    المواطن: {selectedComplaint.citizenName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-red-600" />
                    العمادة: {selectedComplaint.zone} (دائرة منوبة - الدندان)
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    تاريخ الإيداع: {formatDate(selectedComplaint.createdAt)}
                  </span>
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm">
                  الحالة: {selectedComplaint.status}
                </span>
              </div>
            </div>

            {/* Visual 4-Step Stepper */}
            <div className="pt-8 pb-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-6">
                مراحل معالجة المطلب لدى مكتب النائب أسماء درويش
              </h4>

              <div className="relative">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 relative z-10">
                  {STEPS.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = stepNum <= currentStepNumber;
                    const isCurrent = stepNum === currentStepNumber;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.status} className="flex sm:flex-col items-start sm:items-center text-right sm:text-center gap-3 sm:gap-2">
                        {/* Step Circle Indicator */}
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all ${
                            isCompleted
                              ? "bg-red-600 text-white shadow-md shadow-red-500/30 font-bold"
                              : "border-2 border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                          } ${isCurrent ? "ring-4 ring-red-500/20 scale-105" : ""}`}
                        >
                          <StepIcon className="h-6 w-6" />
                        </div>

                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isCompleted
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-400 dark:text-zinc-500"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MP Public Note / Official Response (إفادة ورد مكتب النائب أسماء درويش) */}
            {(selectedComplaint.publicNote || selectedComplaint.adminPublicNote || selectedComplaint.adminResponsePdf) && (
              <div className="mt-8 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/70 p-5 dark:border-emerald-500/30 dark:bg-emerald-950/20 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-emerald-200/70 dark:border-emerald-900/50">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-bold">
                      إفادة وردّ مكتب النائب أسماء درويش:
                    </span>
                  </div>
                  {selectedComplaint.adminResponseDate && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      تاريخ التحيين: {formatDate(selectedComplaint.adminResponseDate)}
                    </span>
                  )}
                </div>
                {(selectedComplaint.adminPublicNote || selectedComplaint.publicNote) && (
                  <p className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed font-medium">
                    {selectedComplaint.adminPublicNote || selectedComplaint.publicNote}
                  </p>
                )}
                {selectedComplaint.adminResponsePdf && (
                  <div className="mt-4 pt-3 border-t border-emerald-200/70 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 dark:bg-zinc-900/90 p-3.5 rounded-xl border border-emerald-300/40">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 font-bold text-xs uppercase">
                        PDF
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {selectedComplaint.adminResponsePdfName || `مراسلة_رسمية_${selectedComplaint.id}.pdf`}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          وثيقة رسمية صادرة من المكتب البرلماني
                        </p>
                      </div>
                    </div>
                    <a
                      href={selectedComplaint.adminResponsePdf}
                      download={selectedComplaint.adminResponsePdfName || `Reponse-${selectedComplaint.id}.pdf`}
                      target={selectedComplaint.adminResponsePdf?.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>تحميل الرد الرسمي (PDF)</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Official Letter Excerpt if available */}
            {selectedComplaint.officialLetterText && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/60 dark:bg-blue-950/20">
                <div className="flex items-center justify-between mb-2 text-blue-700 dark:text-blue-400">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm font-bold">
                      المراسلة البرلمانية الرسمية الموجهة للجهة المعنية:
                    </span>
                  </div>
                  {selectedComplaint.targetMinistry && (
                    <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                      {selectedComplaint.targetMinistry}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {selectedComplaint.officialLetterText}
                </p>
              </div>
            )}

            {/* Complaint details & citizen attachment */}
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <div>
                <h5 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  موضوع المطلب المسجل:
                </h5>
                <p className="rounded-xl bg-zinc-50 p-3.5 text-sm text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200 leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Audio Note Player if present */}
              {selectedComplaint.audioBase64 && (
                <div className="rounded-2xl border-2 border-red-200 p-4 dark:border-red-900/40 bg-red-50/30 dark:bg-zinc-800/40">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    <Volume2 className="h-4 w-4 text-red-600" />
                    <span>الشكوى الصوتية المسجلة من المواطن:</span>
                  </div>
                  <audio controls src={selectedComplaint.audioBase64} className="w-full h-10" />
                </div>
              )}

              {/* Image / Document if present */}
              {selectedComplaint.imageBase64 && (
                <div>
                  <h5 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                    الوثيقة أو الصورة المرفقة:
                  </h5>
                  <div className="relative max-w-sm rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedComplaint.imageBase64}
                      alt="مرفق المطلب"
                      className="w-full max-h-56 object-cover"
                    />
                  </div>
                </div>
              )}

              {/* GPS Coordinates if present */}
              {selectedComplaint.gpsLocation && (
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100/60 dark:bg-zinc-800/40 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span>
                      الموقع الجغرافي المثبت: {selectedComplaint.gpsLocation.latitude},{" "}
                      {selectedComplaint.gpsLocation.longitude} ({selectedComplaint.zone})
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${selectedComplaint.gpsLocation.latitude},${selectedComplaint.gpsLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-red-600 hover:underline font-bold"
                  >
                    <span>فتح في الخريطة</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
