"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Radio, 
  ExternalLink, 
  Pin, 
  Clock, 
  Building2, 
  Share2, 
  Check 
} from "lucide-react";
import { NewsItem } from "@/lib/types";

export default function AlertTicker() {
  const [alerts, setAlerts] = useState<NewsItem[]>([
    {
      id: "init-1",
      title: "تنبيه SONEDE منوبة: صيانة طارئة بالقناة الرئيسية بسيدي عمر وإعادة الضخ تدريجياً ابتداء من 18:00.",
      source: "إقليم SONEDE منوبة",
      pubDate: "اليوم",
      isUrgent: true,
      category: "مياه",
    },
    {
      id: "init-2",
      title: "جلسة برلمانية: النائب أسماء درويش توجه سؤالاً لوزيرة التجهيز حول تسريع حماية الدندان وقصر السعيد من الفيضانات.",
      source: "مجلس نواب الشعب",
      pubDate: "أمس",
      isUrgent: false,
      category: "برلمان",
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [scrollDiff, setScrollDiff] = useState(0);
  const [scrollDuration, setScrollDuration] = useState(7);
  const [selectedAlertModal, setSelectedAlertModal] = useState<NewsItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync news from API
  useEffect(() => {
    const fetchNews = () => {
      fetch(`/api/news?t=${Date.now()}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (data.news && data.news.length > 0) {
            setAlerts(data.news);
            setIsLive(true);
          }
        })
        .catch((err) => console.warn("Live ticker fetch fallback:", err));
    };

    fetchNews();
    const interval = setInterval(fetchNews, 15000);

    const handleSync = () => fetchNews();
    window.addEventListener("storage", (e) => {
      if (e.key === "mp_last_update") fetchNews();
    });
    window.addEventListener("mp_data_updated", handleSync);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("mp_data_sync");
        bc.onmessage = () => fetchNews();
      }
    } catch {}

    return () => {
      clearInterval(interval);
      window.removeEventListener("mp_data_updated", handleSync);
      bc?.close();
    };
  }, []);

  // Measure text overflow to calculate smooth glide distance and duration
  useEffect(() => {
    const measureOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const contentWidth = contentRef.current.scrollWidth;
        const diff = contentWidth - containerWidth;

        if (diff > 4) {
          const paddedDiff = diff + 28;
          const calculatedDuration = Math.max(6, Math.min(14, paddedDiff / 25));
          setScrollDiff(paddedDiff);
          setScrollDuration(calculatedDuration);
        } else {
          setScrollDiff(0);
          setScrollDuration(6);
        }
      }
    };

    measureOverflow();
    const timer = setTimeout(measureOverflow, 120);
    window.addEventListener("resize", measureOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureOverflow);
    };
  }, [currentIndex, alerts]);

  // Auto-transition to next alert with dynamic duration based on text length
  useEffect(() => {
    if (isPaused || alerts.length <= 1) return;

    // Give enough time to finish glide plus rest pause
    const stayTimeMs = scrollDiff > 0 ? (scrollDuration * 1000) + 1200 : 5500;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, stayTimeMs);

    return () => clearInterval(interval);
  }, [isPaused, alerts.length, scrollDiff, scrollDuration, currentIndex]);

  if (!isVisible || alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex] || alerts[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % alerts.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + alerts.length) % alerts.length);
  };

  const handleCopyAlert = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <>
      <aside
        aria-label="شريط المستجدات والتنبيهات العاجلة"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="border-b border-red-100 bg-gradient-to-r from-red-50/90 via-white to-red-50/60 py-2 sm:py-2.5 px-2.5 sm:px-6 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors text-xs select-none"
      >
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-3">
          {/* Left Pill: Live Urgent Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>

            <span className="inline-flex items-center gap-1 font-black text-red-700 dark:text-red-400 text-[11px] sm:text-xs">
              <Bell className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="hidden sm:inline">مستجدات وتنبيهات الدائرة:</span>
              <span className="sm:hidden font-bold">تنبيه:</span>
            </span>

            {isLive && (
              <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                <Radio className="h-2.5 w-2.5 animate-pulse text-red-600" />
                مباشر
              </span>
            )}
          </div>

          {/* Center: Auto-scrolling / Sliding Announcement Rail */}
          <div 
            ref={containerRef}
            onClick={() => setSelectedAlertModal(currentAlert)}
            className="flex-1 min-w-0 overflow-hidden cursor-pointer"
            title="اضغط لقراءة التنبيه كاملاً"
          >
            <div
              key={currentAlert.id || currentIndex}
              ref={contentRef}
              className={`inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap animate-fadeIn ${
                scrollDiff > 0 ? "animate-ticker-rtl" : ""
              }`}
              style={{
                "--ticker-diff": `${scrollDiff}px`,
                "--ticker-duration": `${scrollDuration}s`,
                animationPlayState: isPaused ? "paused" : "running",
              } as React.CSSProperties}
            >
              {currentAlert.isPinned && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 text-white px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold shrink-0 shadow-xs">
                  <Pin className="h-2.5 w-2.5" />
                  <span className="hidden xs:inline">مثبت</span>
                </span>
              )}

              <span
                className={`rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold shrink-0 ${
                  currentAlert.isUrgent
                    ? "bg-red-600 text-white"
                    : currentAlert.isCustom
                    ? "bg-purple-600 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {currentAlert.category || currentAlert.source}
              </span>

              {/* Headline Text: Full text with zero clipping, glides smoothly */}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px] sm:text-xs hover:text-red-600 dark:hover:text-red-400 transition-colors">
                {currentAlert.title}
              </span>

              {currentAlert.link && (
                <ExternalLink className="h-3 w-3 text-red-500 shrink-0 inline" />
              )}

              <span className="hidden md:inline-block text-[10px] text-zinc-400 shrink-0">
                ({currentAlert.source} • {currentAlert.pubDate})
              </span>
            </div>
          </div>

          {/* Right Controls: Auto-counter, Chevrons, Close */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {alerts.length > 1 && (
              <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 px-1 hidden xs:inline">
                {currentIndex + 1}/{alerts.length}
              </span>
            )}

            <button
              type="button"
              onClick={handlePrev}
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 transition cursor-pointer"
              title="التالي"
              aria-label="التنبيه التالي"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 transition cursor-pointer"
              title="السابق"
              aria-label="التنبيه السابق"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="rounded-full p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400 transition ml-0.5 cursor-pointer"
              title="إخفاء التنبيهات"
              aria-label="إخفاء شريط التنبيهات"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Alert Full Details Modal (When tapped on mobile or clicked) */}
      {selectedAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${
                    selectedAlertModal.isUrgent
                      ? "bg-red-600"
                      : selectedAlertModal.isCustom
                      ? "bg-purple-600"
                      : "bg-blue-600"
                  }`}
                >
                  {selectedAlertModal.category || "مستجدات الدائرة"}
                </span>
                {selectedAlertModal.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-xs font-bold">
                    <Pin className="h-3 w-3" />
                    مثبت
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertModal(null)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 leading-relaxed">
                {selectedAlertModal.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                  <span>المصدر: {selectedAlertModal.source}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>التوقيت: {selectedAlertModal.pubDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleCopyAlert(selectedAlertModal.title)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>تم نسخ نص التنبيه!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>نسخ التنبيه</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                {selectedAlertModal.link && (
                  <a
                    href={selectedAlertModal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm transition"
                  >
                    <span>فتح الرابط الرسمي</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedAlertModal(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
