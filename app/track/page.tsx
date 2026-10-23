"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Search, ShieldCheck, CheckCircle2, Loader2, Home as HomeIcon } from "lucide-react";
import ComplaintTracker from "@/components/ComplaintTracker";
import ThemeToggle from "@/components/ThemeToggle";

function TrackContent() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id") || searchParams.get("ticket") || searchParams.get("phone") || "";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
          {/* Top Header Branding Container: Fully Rounded (Pill-shaped) with Clean Border */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 py-1 px-1.5 sm:px-3 rounded-full border border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs min-w-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            {/* Official Tunisian Flag Circular Emblem */}
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-sm shadow-red-500/20 border border-red-500/30 dark:border-red-500/50 bg-red-600 ring-2 ring-white dark:ring-zinc-900">
              <img
                src="/tunisia-flag.jpg"
                alt="علم الجمهورية التونسية"
                className="h-full w-full object-cover scale-110"
              />
            </div>
            <div className="flex flex-col leading-tight min-w-0 pr-0.5 pl-1.5 sm:pl-3">
              <span className="text-xs sm:text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight whitespace-nowrap">
                النائب أسماء درويش
              </span>
              <span className="text-[9px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                مجلس نواب الشعب | منوبة - الدندان
              </span>
            </div>
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition shadow-xs"
            >
              <HomeIcon className="h-3.5 w-3.5" />
              <span>الرئيسية</span>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Tracker Container */}
      <main className="flex-1 py-8 sm:py-12">
        <ComplaintTracker initialSearchQuery={idFromUrl} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-right">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden border border-red-500/30 dark:border-red-500/40 shadow-xs bg-red-600 ring-2 ring-white dark:ring-zinc-900">
              <img
                src="/tunisia-flag.jpg"
                alt="الجمهورية التونسية"
                className="h-full w-full object-cover scale-110"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              جميع الحقوق محفوظة © 2026 - المكتب البرلماني للنائب أسماء درويش، دائرة معتمدية منوبة - الدندان | مجلس نواب الشعب بالجمهورية التونسية
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              منظومة المتابعة الحية
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              حماية المعطيات الشخصية
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-500">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            <span>جارٍ تحميل منظومة التتبع...</span>
          </div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
