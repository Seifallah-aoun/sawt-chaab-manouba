"use client";

import React, { useState, useEffect } from "react";
import { Bell, ChevronLeft, ChevronRight, X, Radio, ExternalLink, Pin } from "lucide-react";
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

  useEffect(() => {
    // Fetch live news from our API with periodic and event-driven sync
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
    } catch {
      // ignore
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("mp_data_updated", handleSync);
      bc?.close();
    };
  }, []);

  useEffect(() => {
    if (isPaused || alerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, alerts.length]);

  if (!isVisible || alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex] || alerts[0];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="border-b border-red-100 bg-gradient-to-r from-red-50 via-white to-red-50/50 py-2.5 px-3 sm:px-6 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-all text-xs"
    >
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-3">
        {/* Left Badge: Alert Title with live indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
          <span className="inline-flex items-center gap-1 font-black text-red-700 dark:text-red-400 text-[11px] sm:text-xs">
            <Bell className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">مستجدات وتنبيهات الدائرة:</span>
            <span className="sm:hidden font-bold">تنبيه:</span>
          </span>
          {isLive && (
            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
              <Radio className="h-2.5 w-2.5 animate-pulse text-red-600" />
              تحديث تلقائي
            </span>
          )}
        </div>

        {/* Center: Dynamic News Message */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 animate-fadeIn transition-opacity">
            {currentAlert.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 text-white px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold shrink-0 shadow-xs">
                <Pin className="h-2.5 w-2.5" />
                <span className="hidden xs:inline">مثبت</span>
              </span>
            )}

            <span
              className={`rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold shrink-0 max-w-[85px] sm:max-w-none truncate ${
                currentAlert.isUrgent
                  ? "bg-red-600 text-white"
                  : currentAlert.isCustom
                  ? "bg-purple-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {currentAlert.category || currentAlert.source}
            </span>

            {currentAlert.link ? (
              <a
                href={currentAlert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 truncate text-[11px] sm:text-xs inline-flex items-center gap-1 transition"
              >
                <span className="truncate">{currentAlert.title}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0 text-zinc-400" />
              </a>
            ) : (
              <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate text-[11px] sm:text-xs">
                {currentAlert.title}
              </p>
            )}

            <span className="hidden md:inline-block text-[10px] text-zinc-400 shrink-0">
              ({currentAlert.source} • {currentAlert.pubDate})
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((prev) => (prev - 1 + alerts.length) % alerts.length)
            }
            className="rounded p-1 text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="التالي"
          >
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % alerts.length)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="السابق"
          >
            <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-red-600 dark:hover:bg-zinc-800 transition ml-0.5 sm:ml-1 cursor-pointer"
            title="إخفاء التنبيهات"
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
