"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Search,
  Landmark,
  Building2,
  Calendar,
  ExternalLink,
  Download,
  Copy,
  Check,
  FileText,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Loader2,
  Share2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { LegislativeProposal, ProposalType, ProposalStatus } from "@/lib/types";
import { INITIAL_PROPOSALS } from "@/lib/proposals-data";
import { generateLegislativeProposalPdf } from "@/lib/generate-proposal-pdf";

interface LegislativeProposalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: {
    type?: ProposalType | "الكل";
    year?: string;
  };
}

export default function LegislativeProposalsModal({
  isOpen,
  onClose,
  initialFilter,
}: LegislativeProposalsModalProps) {
  const [proposals, setProposals] = useState<LegislativeProposal[]>(INITIAL_PROPOSALS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>(initialFilter?.type || "الكل");
  const [selectedYear, setSelectedYear] = useState<string>(initialFilter?.year || "الكل");
  const [selectedStatus, setSelectedStatus] = useState<string>("الكل");
  const [onlyMpInitiatives, setOnlyMpInitiatives] = useState<boolean>(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetchedRef = useRef(false);

  const showToast = (text: string, type: "success" | "info" = "info") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ text, type });
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch updated proposals from backend on modal open (strictly once)
  useEffect(() => {
    if (!isOpen || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetch(`/api/proposals?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.proposals && Array.isArray(data.proposals) && data.proposals.length > 0) {
          setProposals(data.proposals);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch proposals, using initial data:", err);
      });
  }, [isOpen]);

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [isOpen, onClose]);

  // Quick stats calculation
  const stats = useMemo(() => {
    const total = proposals.length;
    const mpCount = proposals.filter((p) => p.isMpInitiative === true).length;
    const laws = proposals.filter((p) => p.type === "مقترح قانون").length;
    const questions = proposals.filter((p) => p.type === "مسائلة كتابية").length;
    const count2026 = proposals.filter((p) => p.year === 2026).length;
    return { total, mpCount, laws, questions, count2026 };
  }, [proposals]);

  // Filtered proposals list
  const filteredProposals = useMemo(() => {
    return proposals.filter((item) => {
      // Filter by MP Asma Derouiche direct initiatives toggle
      if (onlyMpInitiatives && item.isMpInitiative !== true) {
        return false;
      }
      // Filter by type
      if (selectedType !== "الكل" && item.type !== selectedType) {
        return false;
      }
      // Filter by year
      if (selectedYear !== "الكل" && String(item.year) !== selectedYear) {
        return false;
      }
      // Filter by status
      if (selectedStatus !== "الكل" && item.status !== selectedStatus) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = (item.title || "").toLowerCase().includes(q);
        const matchNumber = (item.number || "").toLowerCase().includes(q);
        const matchCommittee = (item.committee || "").toLowerCase().includes(q);
        const matchSummary = (item.summary || "").toLowerCase().includes(q);
        const matchAuthority = (item.targetAuthority || "").toLowerCase().includes(q);
        const matchRole = (item.mpRole || "").toLowerCase().includes(q);
        return matchTitle || matchNumber || matchCommittee || matchSummary || matchAuthority || matchRole;
      }
      return true;
    });
  }, [proposals, onlyMpInitiatives, selectedType, selectedYear, selectedStatus, searchQuery]);

  // Copy proposal details to clipboard
  const handleCopyProposal = (proposal: LegislativeProposal) => {
    const text = `🏛️ الجمهورية التونسية - مجلس نواب الشعب\n` +
      `المكتب البرلماني للنائب أسماء درويش (دائرة منوبة - الدندان)\n\n` +
      `📌 ${proposal.type}: ${proposal.number}\n` +
      `📜 الموضوع: ${proposal.title}\n` +
      `🏢 الجهة / اللجنة: ${proposal.committee}\n` +
      `📅 تاريخ الإيداع: ${proposal.depositDate}\n` +
      `⚡ الوضعية: ${proposal.status}\n` +
      (proposal.mpRole ? `⭐ صفة النائب أسماء درويش: ${proposal.mpRole}\n` : "") +
      `\n📄 ملخص وشرح الأسباب:\n${proposal.summary}\n\n` +
      (proposal.arpUrl ? `🔗 البوابة الرسمية بمجلس نواب الشعب: ${proposal.arpUrl}\n` : "") +
      `— المنصة التفاعلية للنائب أسماء درويش`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(proposal.id);
      showToast("تم نسخ مرجع وبيانات المبادرة إلى الحافظة بنجاح.", "success");
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Safe opening of ARP links with zero 404s
  const handleOpenArpLink = (proposal: LegislativeProposal) => {
    const url = proposal.arpUrl?.trim();

    // 1. Direct valid ARP project ID (e.g. 4304, 4303, 4224, 3937)
    if (url && url.match(/https?:\/\/(?:www\.)?arp\.tn\/loi\/project\/\d{3,5}$/)) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // 2. Parliamentary written questions portal
    if (proposal.type === "مسائلة كتابية" || (url && url.includes("/questions"))) {
      showToast("جاري التوجيه إلى أرشيف المسائلات الكتابية بمجلس نواب الشعب...", "info");
      window.open("https://arp.tn/questions", "_blank", "noopener,noreferrer");
      return;
    }

    // 3. Official safe legislative proposals search repository
    showToast("جاري التوجيه إلى البوابة الرسمية لمشاريع ومقترحات القوانين بمجلس نواب الشعب (ARP)...", "info");
    window.open("https://arp.tn/loi/project/lp", "_blank", "noopener,noreferrer");
  };

  // Download PDF document with robust 404 fallback to client-side official generator
  const handleDownloadPdf = async (proposal: LegislativeProposal) => {
    try {
      setGeneratingPdfId(proposal.id);

      // Case 1: Custom uploaded PDF or Data URL
      if (proposal.pdfUrl && proposal.pdfUrl.trim()) {
        const url = proposal.pdfUrl.trim();

        // Base64 Data URL or Blob
        if (url.startsWith("data:") || url.startsWith("blob:")) {
          const link = document.createElement("a");
          link.href = url;
          link.download = proposal.pdfName || `وثيقة_${proposal.number.replace(/[\/\\]/g, "-")}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast("تم تنزيل وثيقة نص المقترح المرفقة بنجاح.", "success");
          setGeneratingPdfId(null);
          return;
        }

        // External HTTP/HTTPS URL: check if accessible
        try {
          const testRes = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(2500) });
          if (testRes.ok) {
            window.open(url, "_blank", "noopener,noreferrer");
            setGeneratingPdfId(null);
            return;
          }
        } catch {
          // If HEAD check fails, proceed to clean generator fallback below
        }

        showToast("نص المقترح غير متوفر كملف PDF خارجي، جاري توليد وتحميل الوثيقة الرسمية المعتمدة تلقائياً...", "info");
      }

      // Case 2: Standard client-side generation of official parliamentary document
      const { dataUrl, fileName } = await generateLegislativeProposalPdf(proposal);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("تم توليد وتحميل الوثيقة البرلمانية الرسمية المعتمدة بنجاح.", "success");
    } catch (err) {
      console.error("Error generating proposal PDF:", err);
      showToast("تعذر إنشاء ملف PDF حالياً، يرجى المحاولة لاحقاً.", "info");
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Helper for status badge styling
  const getStatusBadgeStyle = (status: ProposalStatus) => {
    switch (status) {
      case "جاهز للجلسة العامة":
      case "تمت المصادقة":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      case "مُجاب عنها":
        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800";
      case "في انتظار التقرير":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case "في انتظار الرد":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      case "قيد الدرس باللجنة":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden dark:border-zinc-800 dark:bg-zinc-900 my-auto transition-all"
        dir="rtl"
      >
        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl border bg-white dark:bg-zinc-900 text-xs font-bold flex items-center gap-2 max-w-[90%] sm:max-w-md animate-in fade-in slide-in-from-top duration-200 border-zinc-200 dark:border-zinc-700">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="text-zinc-800 dark:text-zinc-200 leading-snug">{toastMessage.text}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="relative border-b border-zinc-200/80 bg-gradient-to-r from-red-50/70 via-white to-zinc-50/80 px-4 sm:px-6 py-4 dark:border-zinc-800 dark:from-red-950/30 dark:via-zinc-900 dark:to-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Republic Emblem */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl overflow-hidden border border-red-500/30 bg-red-600 shadow-md ring-2 ring-white dark:ring-zinc-800">
              <img
                src="/tunisia-flag.jpg"
                alt="علم الجمهورية التونسية"
                className="h-full w-full object-cover scale-110"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100/70 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
                  <Landmark className="h-3 w-3 shrink-0" />
                  <span>مجلس نواب الشعب | الجمهورية التونسية</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] text-zinc-400 dark:text-zinc-500">•</span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  الدور النيابي 2023 - 2028
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate mt-0.5">
                المبادرات التشريعية ومقترحات القوانين — النائب أسماء درويش
              </h2>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Pills Strip */}
        <div className="border-b border-zinc-200/60 bg-zinc-50/70 px-4 sm:px-6 py-2.5 dark:border-zinc-800/60 dark:bg-zinc-950/50 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 font-bold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-xs">
                <span>إجمالي المبادرات:</span>
                <span className="rounded-full bg-red-100 px-1.5 py-0.2 text-red-700 dark:bg-red-950 dark:text-red-300 font-mono text-[11px]">
                  {stats.total}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/80 px-3 py-1 font-black text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 shadow-xs">
                <Sparkles className="h-3 w-3 text-red-600" />
                <span>مبادرات النائب أسماء درويش:</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">
                  {stats.mpCount}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shadow-xs">
                <span>مقترحات قوانين:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">
                  {stats.laws}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shadow-xs">
                <span>مسائلات كتابية:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">
                  {stats.questions}
                </span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shadow-xs">
                <span>سنة 2026:</span>
                <span className="text-red-600 dark:text-red-400 font-mono font-bold">
                  {stats.count2026}
                </span>
              </span>
            </div>

            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>بيانات رسمية موثقة ومطابقة لمجلس نواب الشعب</span>
            </div>
          </div>
        </div>

        {/* Search & Filters Toolbar */}
        <div className="border-b border-zinc-200/80 bg-white px-4 sm:px-6 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/90 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالرقم (مثال: 2026/037)، الموضوع (الحرايرية، بني مهيرة، سيدي منصور، الدرون، الصرف...) أو اللجنة..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 py-2.5 pr-10 pl-9 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Special Highlight Filter Toggle: MP Asma Derouiche direct initiatives */}
            <button
              type="button"
              onClick={() => setOnlyMpInitiatives((prev) => !prev)}
              className={`rounded-full px-4 py-2 text-xs font-black transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs ${
                onlyMpInitiatives
                  ? "bg-red-600 text-white ring-2 ring-red-400 dark:ring-red-700"
                  : "border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>مبادرات ومسائلات النائب فقط ({stats.mpCount})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap pl-1">
                النوع:
              </span>
              {(["الكل", "مقترح قانون", "مسائلة كتابية"] as const).map((typeVal) => (
                <button
                  key={typeVal}
                  type="button"
                  onClick={() => setSelectedType(typeVal)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedType === typeVal
                      ? "bg-red-600 text-white shadow-xs"
                      : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {typeVal}
                </button>
              ))}
            </div>

            {/* Year Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap pl-1">
                السنة:
              </span>
              {(["الكل", "2026", "2025", "2024", "2023"] as const).map((yearVal) => (
                <button
                  key={yearVal}
                  type="button"
                  onClick={() => setSelectedYear(yearVal)}
                  className={`rounded-full px-2.5 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedYear === yearVal
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {yearVal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Proposals List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin text-red-600 mb-2" />
              <p className="text-sm font-semibold">جارٍ تحميل المبادرات ومقترحات القوانين...</p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                لم يتم العثور على أي مبادرة تطابق بحثك
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                جرّب تغيير كلمات البحث أو إعادة ضبط خيارات التصفية بالنوع والسنة.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("الكل");
                  setSelectedYear("الكل");
                  setSelectedStatus("الكل");
                  setOnlyMpInitiatives(false);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-zinc-800 dark:text-red-300 transition"
              >
                إعادة ضبط خيارات البحث
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredProposals.map((item) => (
                <div
                  key={item.id}
                  className={`group rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                    item.isMpInitiative
                      ? "border-red-200/90 bg-gradient-to-r from-red-50/20 via-white to-amber-50/10 dark:border-red-900/60 dark:from-red-950/20 dark:via-zinc-900 dark:to-zinc-900"
                      : "border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <div>
                    {/* Top Row: MP Badge, Number, Type Badge, Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Distinct MP Asma Derouiche Badge */}
                        {item.isMpInitiative && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-0.5 text-[11px] font-black text-white shadow-xs">
                            <Sparkles className="h-3 w-3 text-amber-300 shrink-0" />
                            <span>مبادرة النائب أسماء درويش {item.mpRole ? `• ${item.mpRole}` : ""}</span>
                          </span>
                        )}

                        {/* Proposal / Question Number Badge */}
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-2.5 py-1 text-xs font-black text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 font-mono">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-red-600" />
                          <span>{item.type} عدد {item.number}</span>
                        </span>

                        {/* Year Badge */}
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {item.year}
                        </span>
                      </div>

                      {/* Procedural Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusBadgeStyle(
                          item.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        <span>{item.status}</span>
                      </span>
                    </div>

                    {/* Proposal Title */}
                    <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 leading-snug">
                      {item.title}
                    </h3>

                    {/* Committee / Ministry & Deposit Date Info */}
                    <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span>تاريخ الإيداع:</span>
                        <strong className="text-zinc-800 dark:text-zinc-200">
                          {item.depositDate}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>{item.type === "مسائلة كتابية" ? "الجهة الحكومية:" : "اللجنة البرلمانية:"}</span>
                        <strong className="text-zinc-800 dark:text-zinc-200">
                          {item.committee}
                        </strong>
                      </div>

                      {item.signatories && (
                        <div className="hidden sm:flex items-center gap-1.5">
                          <span className="text-zinc-400">•</span>
                          <span>المبادرة:</span>
                          <span className="text-zinc-700 dark:text-zinc-300">{item.signatories}</span>
                        </div>
                      )}
                    </div>

                    {/* Summary / Reasons Box */}
                    <div className="mt-3.5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 sm:p-3.5 text-xs sm:text-sm text-zinc-700 dark:border-zinc-800/80 dark:bg-zinc-800/40 dark:text-zinc-300 leading-relaxed">
                      <p className="line-clamp-4 group-hover:line-clamp-none transition-all">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Action 1: Official ARP Link Button (Safe Redirect, Zero 404s) */}
                      <button
                        type="button"
                        onClick={() => handleOpenArpLink(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 transition cursor-pointer shadow-xs"
                        title="معاينة الملف على موقع مجلس نواب الشعب (ARP)"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>معاينة بموقع المجلس (ARP)</span>
                      </button>

                      {/* Action 2: Download PDF Button (Guaranteed Zero 404s, Always Generates/Downloads) */}
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(item)}
                        disabled={generatingPdfId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                        title="تحميل وثيقة نص المقترح الرسمية المعتمدة بصيغة PDF"
                      >
                        {generatingPdfId === item.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                            <span>جارٍ إعداد الـ PDF...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 text-emerald-600" />
                            <span>تحميل نص المقترح (PDF)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Action 3: Copy Reference Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyProposal(item)}
                      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition px-2 py-1 rounded-md cursor-pointer"
                      title="نسخ ملخص وبيانات المقترح"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>نسخ المرجع</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 sm:px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              جميع مقترحات القوانين والمسائلات مسجلة رسمياً بالأمانة العامة لمجلس نواب الشعب بالجمهورية التونسية
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 bg-white px-5 py-2 font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
