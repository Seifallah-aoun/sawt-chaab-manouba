"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Send, 
  Mic, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck 
} from "lucide-react";
import ComplaintModal, { ModalMode } from "@/components/ComplaintModal";
import ComplaintTracker from "@/components/ComplaintTracker";
import AlertTicker from "@/components/AlertTicker";
import CivicModules from "@/components/CivicModules";
import LiveTownHall from "@/components/LiveTownHall";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("petition");
  const [trackedId, setTrackedId] = useState<string>("");

  const openPetitionModal = () => {
    setModalMode("petition");
    setModalOpen(true);
  };

  const openVoiceModal = () => {
    setModalMode("voice");
    setModalOpen(true);
  };

  const scrollToTracking = () => {
    const trackingSection = document.getElementById("tracking-section");
    if (trackingSection) {
      trackingSection.scrollIntoView({ behavior: "smooth" });
    }
    const input = document.getElementById("tracking-search-input") as HTMLInputElement | null;
    if (input) {
      setTimeout(() => input.focus(), 400);
    }
  };

  const handleTrackNewComplaint = (id: string) => {
    setTrackedId(id);
    const trackingSection = document.getElementById("tracking-section");
    if (trackingSection) {
      trackingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-500/30">
              <Building2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm sm:text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
                النائب أسماء درويش
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                مجلس نواب الشعب | منوبة - الدندان
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={scrollToTracking}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40 transition cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-red-500" />
              <span>تتبع مطلب</span>
            </button>

            <button
              type="button"
              onClick={openVoiceModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-red-300 bg-red-50/60 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300 transition cursor-pointer"
            >
              <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 shrink-0" />
              <span className="whitespace-nowrap">شكوى صوتية</span>
            </button>

            <button
              type="button"
              onClick={openPetitionModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-red-300 bg-white px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40 transition cursor-pointer"
            >
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 shrink-0" />
              <span className="whitespace-nowrap">تقديم عريضة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Live Urgent News & Constituency Alert Ticker */}
      <AlertTicker />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-10 sm:py-20 bg-gradient-to-b from-white via-zinc-50 to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/80 px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 mb-5 sm:mb-6">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>المكتب البرلماني للنائب أسماء درويش | منوبة والدندان</span>
            </div>

            <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              صوت أهالي منوبة والدندان، رقابة شفافة وعمل برلماني متواصل
            </h1>
            <p className="mx-auto mt-3.5 sm:mt-4 max-w-2xl text-sm sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
              منصة تفاعلية مخصصة لمتساكني معتمدية منوبة - الدندان للتواصل المباشر مع النائب أسماء درويش، تقديم العرائض، تسجيل الشكاوى الصوتية، ومتابعة المراسلات الوزارية والمساءلة.
            </p>

            {/* The 3 Main Interactive Hero Buttons: Full-width stacked on mobile for comfortable thumb tapping */}
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-3.5 max-w-md sm:max-w-none mx-auto w-full">
              {/* Button 1: Written Petition */}
              <button
                type="button"
                onClick={openPetitionModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border border-red-300 bg-white px-6 py-3.5 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50 hover:border-red-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 dark:border-red-600/70 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/30 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>تقديم مطلب أو عريضة</span>
              </button>

              {/* Button 2: Voice Complaint */}
              <button
                type="button"
                onClick={openVoiceModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border border-red-300 bg-white px-6 py-3.5 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50 hover:border-red-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 dark:border-red-600/70 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/30 transition-all cursor-pointer"
              >
                <Mic className="h-4 w-4 animate-pulse text-red-600 dark:text-red-400 shrink-0" />
                <span>تسجيل شكوى صوتية</span>
              </button>

              {/* Button 3: Live Tracking */}
              <button
                type="button"
                onClick={scrollToTracking}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border border-red-300 bg-white px-6 py-3.5 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50 hover:border-red-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 dark:border-red-600/70 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/30 transition-all cursor-pointer"
              >
                <Search className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>تتبع مآل مطلبك</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4 Interactive Civic Modules (Analytics, Projects, Appointments/Guide, Polls) */}
        <CivicModules />

        {/* Live Video Town Hall & Interactive Citizen Q&A */}
        <LiveTownHall />

        {/* Live Tracking Section */}
        <ComplaintTracker initialSearchQuery={trackedId} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-right">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-bold text-xs">
              🇹🇳
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              جميع الحقوق محفوظة © 2026 - المكتب البرلماني للنائب أسماء درويش، دائرة معتمدية منوبة - الدندان | مجلس نواب الشعب بالجمهورية التونسية
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              جاهز للعمل كـ PWA
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              حماية المعطيات الشخصية
            </span>
          </div>
        </div>
      </footer>

      {/* Complaint Submission Modal (Petition or Voice) */}
      <ComplaintModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        onTrackComplaint={handleTrackNewComplaint}
      />
    </div>
  );
}
