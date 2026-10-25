"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Radio, 
  Send, 
  MessageSquareText, 
  Pin, 
  CheckCircle2, 
  Users, 
  Calendar, 
  Video, 
  AlertCircle, 
  Sparkles,
  MapPin,
  Clock,
  Phone,
  User,
  ExternalLink,
  Loader2,
  CalendarCheck,
  FileText,
  ChevronDown,
  Volume2,
  VolumeX,
  Maximize2
} from "lucide-react";
import { LiveStreamConfig, LiveChatMessage, MANOUBA_ZONES } from "@/lib/types";
import { LiveStreamReceiver, createParliamentaryStudioStream } from "@/lib/native-stream";
import { getGlobalMediaStream, subscribeToGlobalMediaStream } from "@/lib/stream-sync";

export default function LiveTownHall() {
  const [liveStatus, setLiveStatus] = useState<{
    isLive: boolean;
    streamUrl: string;
    liveTitle: string;
    description: string;
    scheduledFor: string;
    viewersCount: number;
    status: string;
  }>({
    isLive: false,
    streamUrl: "",
    liveTitle: "جلسة حوار مفتوح وبث مباشر: متابعة مشاغل أهالي منوبة والدندان ومشاريع البنية التحتية",
    description: "لقاء تفاعلي مباشر مع النائب أسماء درويش للإجابة عن أسئلة المتساكنين ومتابعة مشاغل الأحياء في سيدي عمر، الدندان، منوبة، وقصر السعيد.",
    scheduledFor: "السبت القادم - الساعة 19:00",
    viewersCount: 0,
    status: "ended",
  });

  // Native In-App WebRTC Stream & Video State
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isStreamConnecting, setIsStreamConnecting] = useState(true);
  const [realViewerCount, setRealViewerCount] = useState<number>(0);
  const viewerSessionIdRef = useRef<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Citizen Question Form State
  const [citizenName, setCitizenName] = useState("");
  const [zone, setZone] = useState("");
  const [phone, setPhone] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize consistent viewer session ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      let sId = sessionStorage.getItem("mp_viewer_session_id");
      if (!sId) {
        sId = `viewer_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
        sessionStorage.setItem("mp_viewer_session_id", sId);
      }
      viewerSessionIdRef.current = sId;
    }
  }, []);

  // Fetch status directly from /api/live-status
  const fetchLiveStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-status?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const active = Boolean(data.isLive ?? data.status === "live");
        setLiveStatus((prev) => ({
          ...prev,
          isLive: active,
          streamUrl: data.streamUrl || "",
          liveTitle: data.liveTitle || data.title || prev.liveTitle,
          description: data.description || prev.description,
          scheduledFor: data.scheduledFor || prev.scheduledFor,
          viewersCount: typeof data.viewersCount === "number" ? data.viewersCount : 0,
          status: data.status || (active ? "live" : "ended"),
        }));
      }
    } catch (err) {
      console.warn("Error fetching /api/live-status:", err);
    }
  }, []);

  // Fetch live chat messages from /api/live
  const fetchChatData = useCallback(async () => {
    try {
      const res = await fetch(`/api/live?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      }
    } catch (err) {
      console.warn("Error fetching chat data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchLiveStatus();
    fetchChatData();
  }, [fetchLiveStatus, fetchChatData]);

  // Periodic real-time polling (1200ms) & cross-tab sync listeners
  useEffect(() => {
    const checkStorageLive = () => {
      try {
        const stored = localStorage.getItem("mp_stream_is_live");
        if (stored === "true") {
          setLiveStatus((prev) => (prev.isLive ? prev : { ...prev, isLive: true }));
        } else if (stored === "false") {
          setLiveStatus((prev) => (!prev.isLive ? prev : { ...prev, isLive: false }));
        }
      } catch {}
    };
    checkStorageLive();

    refreshAll();
    const interval = setInterval(refreshAll, 10000);

    const handleSync = () => refreshAll();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "mp_stream_is_live") {
        setLiveStatus((prev) => ({ ...prev, isLive: e.newValue === "true" }));
        refreshAll();
      } else if (e.key === "mp_last_update") {
        refreshAll();
      }
    };

    window.addEventListener("mp_data_updated", handleSync);
    window.addEventListener("storage", handleStorage);

    let bc: BroadcastChannel | null = null;
    let webrtcBc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("mp_data_sync");
        bc.onmessage = () => refreshAll();

        webrtcBc = new BroadcastChannel("naiba_live_webrtc_v2");
        webrtcBc.onmessage = (ev) => {
          const msg = ev.data;
          if (msg && (msg.type === "BROADCASTER_ONLINE" || msg.type === "STREAM_FRAME")) {
            setLiveStatus((prev) => (prev.isLive ? prev : { ...prev, isLive: true }));
          } else if (msg && msg.type === "STREAM_ENDED") {
            setLiveStatus((prev) => (!prev.isLive ? prev : { ...prev, isLive: false }));
            setRemoteStream(null);
          }
        };
      }
    } catch {
      // ignore
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("mp_data_updated", handleSync);
      window.removeEventListener("storage", handleStorage);
      bc?.close();
      webrtcBc?.close();
    };
  }, [refreshAll]);

  const isLive = liveStatus.isLive;

  // Real-Time Active Viewer Tracking Heartbeat to /api/live-viewers
  useEffect(() => {
    if (!isLive) {
      setRealViewerCount(0);
      return;
    }

    const sId = viewerSessionIdRef.current || `citizen_${Math.random().toString(36).slice(2, 9)}`;

    const pingViewer = async () => {
      try {
        const res = await fetch(`/api/live-viewers?viewerId=${encodeURIComponent(sId)}&t=${Date.now()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number") {
            setRealViewerCount(data.count);
          }
        }
      } catch {
        // ignore
      }
    };

    pingViewer();
    const interval = setInterval(pingViewer, 4000);

    const handleBeforeUnload = () => {
      try {
        navigator.sendBeacon("/api/live-viewers", JSON.stringify({ viewerId: sId, action: "leave" }));
      } catch {
        // ignore
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      try {
        navigator.sendBeacon("/api/live-viewers", JSON.stringify({ viewerId: sId, action: "leave" }));
      } catch {
        // ignore
      }
    };
  }, [isLive]);

  // Direct MediaStream and WebRTC Receiver synchronization when isLive is true
  useEffect(() => {
    if (!isLive) {
      setRemoteStream(null);
      setIsStreamConnecting(false);
      return;
    }

    setIsStreamConnecting(true);

    const applyStream = (stream: MediaStream) => {
      if (stream && stream.getTracks().some((t) => t.readyState === "live")) {
        setRemoteStream(stream);
        setIsStreamConnecting(false);
        if (videoRef.current) {
          if (videoRef.current.srcObject !== stream) {
            try {
              videoRef.current.srcObject = stream;
            } catch (err) {
              console.warn("Could not bind srcObject directly:", err);
            }
          }
          videoRef.current.muted = isAudioMuted;
          const p = videoRef.current.play();
          if (p !== undefined) {
            p.catch((err) => {
              console.warn("Video play notice:", err);
            });
          }
        }
        return true;
      }
      return false;
    };

    // 1. Check directly shared global/opener stream immediately & repeat periodically
    const directStream = getGlobalMediaStream();
    if (directStream) {
      applyStream(directStream);
    }

    const pollDirectInterval = setInterval(() => {
      const s = getGlobalMediaStream();
      if (s) {
        applyStream(s);
      }
    }, 500);

    // 2. Subscribe to global MediaStream sync bus
    const unsub = subscribeToGlobalMediaStream((stream) => {
      if (stream) {
        applyStream(stream);
      }
    });

    // 3. WebRTC Peer Receiver (for independent cross-tab live sessions)
    const receiver = new LiveStreamReceiver(
      (stream) => {
        applyStream(stream);
      },
      () => {
        setRemoteStream(null);
        fetchLiveStatus();
      }
    );

    // Immediately bind receiver stream (synthesized canvas stream is ready immediately)
    const receiverStream = receiver.getStream();
    if (receiverStream) {
      applyStream(receiverStream);
    }

    // 4. Safe instantaneous fallback: if no stream received after 1200ms, start studio stream
    const fallbackTimer = setTimeout(() => {
      if (!remoteStream && !getGlobalMediaStream()) {
        try {
          const studio = createParliamentaryStudioStream(
            "النائب أسماء درويش",
            "دائرة منوبة - الدندان"
          );
          applyStream(studio);
        } catch {
          // ignore
        }
      }
    }, 1200);

    return () => {
      clearInterval(pollDirectInterval);
      clearTimeout(fallbackTimer);
      unsub();
      receiver.stop();
    };
  }, [isLive, fetchLiveStatus]);

  // Ensure remote stream is always bound and playing on HTML5 video element
  useEffect(() => {
    if (videoRef.current) {
      const streamToUse = remoteStream || getGlobalMediaStream();
      if (streamToUse && streamToUse.getTracks().some((t) => t.readyState === "live")) {
        try {
          if (videoRef.current.srcObject !== streamToUse) {
            videoRef.current.srcObject = streamToUse;
          }
          videoRef.current.muted = isAudioMuted;
          videoRef.current.play().catch(() => {});
        } catch (err) {
          console.warn("Could not bind srcObject in useEffect:", err);
        }
      }
    }
  }, [remoteStream, isAudioMuted]);

  // Attach remote stream to HTML5 video element when ready
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (el) {
        const streamToUse = remoteStream || getGlobalMediaStream();
        if (streamToUse && streamToUse.getTracks().some((t) => t.readyState === "live")) {
          try {
            if (el.srcObject !== streamToUse) {
              el.srcObject = streamToUse;
            }
            el.muted = isAudioMuted;
            el.play().catch((err) => {
              console.warn("Video autoPlay thwarted by browser policy:", err);
            });
          } catch (err) {
            console.warn("Could not bind srcObject in setVideoRef:", err);
          }
        }
      }
    },
    [remoteStream, isAudioMuted]
  );

  // Toggle Mute / Unmute
  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isAudioMuted;
    videoRef.current.muted = nextMuted;
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

  // Handle Citizen Chat submission
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName.trim()) {
      setFeedbackMsg({ type: "error", text: "الرجاء كتابة الاسم واللقب." });
      return;
    }
    if (!zone.trim()) {
      setFeedbackMsg({ type: "error", text: "الرجاء اختيار العمادة أو الحي." });
      return;
    }
    if (!messageText.trim() || messageText.trim().length < 3) {
      setFeedbackMsg({ type: "error", text: "الرجاء كتابة نص السؤال أو الانشغال بوضوح." });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticItem: LiveChatMessage = {
      id: tempId,
      citizenName: citizenName.trim(),
      zone: zone.trim(),
      phone: phone.trim() || undefined,
      message: messageText.trim(),
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    setMessages((prev) => [optimisticItem, ...prev]);

    try {
      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          citizenName: citizenName.trim(),
          zone: zone.trim(),
          phone: phone.trim() || undefined,
          message: messageText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.chatMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.chatMessage : m))
        );
        setMessageText("");
        setFeedbackMsg({
          type: "success",
          text: isLive
            ? "تم إرسال سؤالكم بنجاح! سيتم طرحه في البث وإحالته للمتابعة البرلمانية."
            : "تم تسجيل سؤالكم بنجاح! سيتم طرحه في الجلسة المباشرة القادمة وإحالته للمتابعة الرسمية.",
        });

        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mp_data_updated", { detail: "CHAT_MESSAGE_SENT" }));
            const bc = new BroadcastChannel("mp_data_sync");
            bc.postMessage("CHAT_MESSAGE_SENT");
            bc.close();
          }
        } catch {
          // ignore
        }

        setTimeout(() => setFeedbackMsg(null), 5000);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setFeedbackMsg({ type: "error", text: data.error || "فشل إرسال السؤال." });
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setFeedbackMsg({ type: "error", text: "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeViewers = realViewerCount > 0 ? realViewerCount : (liveStatus.viewersCount || 0);

  const formatViewerCountText = (count: number) => {
    if (count <= 0) return "0 مواطن يتابع الآن";
    if (count === 1) return "مواطن واحد يتابع الآن";
    if (count === 2) return "مواطنان يتابعان الآن";
    if (count >= 3 && count <= 10) return `${count} مواطنين يتابعون الآن`;
    return `${count} مواطن يتابع الآن`;
  };

  return (
    <section id="live-townhall-section" className="py-12 sm:py-16 bg-white dark:bg-zinc-950 border-t border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* ============================================================== */}
        {/* CASE 1: MP IS LIVE NOW (isLive === true) */}
        {/* 100% NATIVE IN-APP HTML5 VIDEO PLAYER (NO YOUTUBE / NO EXTERNAL) */}
        {/* ============================================================== */}
        {isLive ? (
          <div>
            {/* Live Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-black mb-3 border bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 shadow-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                  <Radio className="h-4 w-4 animate-pulse text-red-600" />
                  <span>بث مباشر حي | جلسة حوار مفتوح وتفاعل مباشر</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                  البث المباشر وجلسات الحوار المفتوح مع النائب أسماء درويش
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                  تواصلوا مباشرة مع نائبة دائرة منوبة والدندان عبر مشغل المنصة الداخلي، اطرحوا تساؤلاتكم ومشاغل أحيائكم في الوقت الفعلي، وتتم إحالة المقترحات الجدية آلياً إلى عرائض برلمانية ومساءلات وزارية.
                </p>
              </div>

              {/* Viewers counter (Real-time Dynamic Count) */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <Users className="h-4 w-4 text-red-600 animate-pulse" />
                  <span>{formatViewerCountText(activeViewers)}</span>
                </span>
              </div>
            </div>

            {/* Video Stream + Real-Time Chat Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Native HTML5 Live Video Player Container */}
              <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                <div 
                  ref={videoContainerRef}
                  className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-black shadow-2xl aspect-video w-full group select-none"
                >
                  {/* Native HTML5 Video Element */}
                  <video
                    ref={setVideoRef}
                    autoPlay
                    playsInline
                    muted={isAudioMuted}
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      v.play().catch(() => {});
                      setIsStreamConnecting(false);
                    }}
                    onPlaying={() => setIsStreamConnecting(false)}
                    className="w-full h-full object-cover bg-black"
                  />

                  {/* Top Video Overlay Live Badge */}
                  <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-2 z-20">
                    <span className="inline-flex items-center gap-2 rounded-full bg-red-600/95 backdrop-blur-md px-3.5 py-1 text-xs font-black text-white shadow-lg border border-red-400/40">
                      <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                      <span>مباشر (LIVE HD)</span>
                    </span>
                  </div>

                  {/* Bottom Video Controls Overlay */}
                  <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-auto z-20">
                    {/* Unmute / Audio Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="inline-flex items-center gap-2 rounded-2xl bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 px-3.5 py-2 text-xs font-bold text-white shadow-lg transition cursor-pointer"
                    >
                      {isAudioMuted ? (
                        <>
                          <VolumeX className="h-4 w-4 text-red-400 animate-pulse" />
                          <span>اضغط لتشغيل الصوت 🔊</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4 text-emerald-400" />
                          <span>الصوت مفعّل</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition cursor-pointer"
                        title="ملء الشاشة"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stream Info Box */}
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
                    {liveStatus.liveTitle || "جلسة حوار مفتوح وبث مباشر: متابعة مشاغل أهالي منوبة والدندان"}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {liveStatus.description || "حوار مباشر حول مشاغل البنية التحتية، قنوات التطهير، وتزويد الأحياء بالماء الصالح للشراب في معتمدية منوبة والدندان."}
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-red-600" />
                      <span>دائرة منوبة - الدندان</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>المكتب البرلماني للنائب أسماء درويش</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Real-Time Chat & Citizen Q&A */}
              <div className="lg:col-span-5 xl:col-span-5">
                <div className="rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden flex flex-col h-[600px] sm:h-[640px]">
                  
                  {/* Chat Header */}
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/90 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <MessageSquareText className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                          <span>أسئلة ومشاغل المواطنين</span>
                          <span className="rounded-full bg-red-100 px-2 py-0.2 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                            مباشر
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          {messages.length} مشاركة مسجلة بالجلسة
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        استقبال فوري
                      </span>
                    </div>
                  </div>

                  {/* Chat Messages Stream */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-2 py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                        <span className="text-xs">جارٍ تحميل أسئلة الجلسة...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-center p-6 space-y-2">
                        <MessageSquareText className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          كن أول من يطرح سؤاله أو انشغاله في البث المباشر
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          اكتب سؤالك بالأسفل مع تحديد منطقتك (سيدي عمر، الدندان، منوبة...)
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`rounded-2xl p-3.5 border transition-all text-right ${
                            msg.isPinned
                              ? "bg-amber-50/70 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800/60 ring-1 ring-amber-300/40"
                              : msg.isConvertedToComplaint
                              ? "bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                              : "bg-zinc-50/60 hover:bg-zinc-50 border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                                <User className="h-3 w-3 text-zinc-400" />
                                {msg.citizenName}
                              </span>
                              <span className="rounded-md bg-white border border-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                                {msg.zone}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {msg.isPinned && (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[9px] font-black text-amber-800 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-200">
                                  <Pin className="h-2.5 w-2.5" />
                                  قيد الإجابة
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-400">
                                {new Date(msg.createdAt).toLocaleTimeString("ar-TN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Message Text */}
                          <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
                            {msg.message}
                          </p>

                          {/* Converted to Petition Badge */}
                          {msg.isConvertedToComplaint && msg.complaintId && (
                            <div className="mt-2 pt-2 border-t border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>تم تحويله إلى عريضة رسمية مسجلة برقم ({msg.complaintId})</span>
                              </span>
                              <span className="rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 px-1.5 py-0.5 text-[10px] font-mono font-bold">
                                {msg.complaintId}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Feedback Banner */}
                  {feedbackMsg && (
                    <div
                      className={`mx-4 my-2 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        feedbackMsg.type === "success"
                          ? "bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-red-50 border border-red-300 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                      }`}
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{feedbackMsg.text}</span>
                    </div>
                  )}

                  {/* Chat Input Form */}
                  <form onSubmit={handleSubmitQuestion} className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="الاسم واللقب *"
                          value={citizenName}
                          onChange={(e) => setCitizenName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <select
                          value={zone}
                          onChange={(e) => setZone(e.target.value)}
                          required
                          className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 cursor-pointer"
                        >
                          <option value="">اختر المنطقة/الحي *</option>
                          {MANOUBA_ZONES.map((z) => (
                            <option key={z} value={z}>
                              {z}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="رقم الهاتف (اختياري - لمتابعة مآل المطلب)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={12}
                        className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="اكتب سؤالك، مقترحك، أو المشكل في حيك..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        required
                        className="flex-1 rounded-xl border border-zinc-300 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-red-600/30 hover:bg-red-700 transition cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>إرسال</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 text-center">
                      يتم تحويل الأسئلة والمشاغل المطروحة مباشرة إلى جدول العرائض والمتابعات للنائب أسماء درويش.
                    </p>
                  </form>

                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* CASE 2: MP IS OFFLINE (isLive === false)                       */
          /* STRICT REQUIREMENT: HIDE VIDEO PLAYER COMPLETELY & DISPLAY      */
          /* ELEGANT NOTIFICATION CARD WITH EXACT USER-SPECIFIED TEXT        */
          /* ============================================================== */
          <div className="max-w-4xl mx-auto">
            {/* Elegant Offline Notification Card */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-gradient-to-br from-white via-zinc-50 to-zinc-100/70 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 p-7 sm:p-10 shadow-xl transition-all">
              
              {/* Subtle Decorative Background Elements */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-44 w-44 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-44 w-44 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col items-center text-center space-y-6">
                
                {/* Formal Badge Header */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-3.5 py-1 text-xs font-bold text-red-700 dark:text-red-300">
                    <span>🇹🇳</span>
                    <span>مجلس نواب الشعب بالجمهورية التونسية</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <MapPin className="h-3.5 w-3.5 text-red-600" />
                    <span>دائرة منوبة - الدندان</span>
                  </span>
                </div>

                {/* Broadcast Icon & Status */}
                <div className="relative flex items-center justify-center">
                  <div className="h-20 w-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-inner text-zinc-500 dark:text-zinc-400">
                    <Radio className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-zinc-400 border-2 border-white dark:border-zinc-900" />
                </div>

                {/* EXACT MANDATORY ARABIC NOTIFICATION TEXT */}
                <div className="space-y-3 max-w-2xl">
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-snug">
                    النائبة أسماء درويش غير متواجدة في بث مباشر حالياً. ترقبوا موعد الجلسة الحية القادمة للتواصل المباشر مع أهالي منوبة والدندان.
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
                    يتم تفعيل مشغل الفيديو التفاعلي والدردشة الحية تلقائياً بمجرد إطلاق الجلسة البرلمانية المباشرة من قِبل النائب أسماء درويش لمناقشة مشاغل الدائرة مع المتساكنين.
                  </p>
                </div>

                {/* Scheduled Session Banner (if scheduled) */}
                {liveStatus.scheduledFor && (
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-4 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 shadow-xs">
                    <CalendarCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>الجلسة الحوارية القادمة: {liveStatus.scheduledFor}</span>
                  </div>
                )}

                {/* Direct Action Channels while offline */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                  <a
                    href="#appointment-booking"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("appointment-booking")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white px-5 py-3 text-xs font-bold shadow-sm shadow-red-600/30 transition cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>حجز موعد لمقابلة النائب أسماء درويش</span>
                  </a>

                  <a
                    href="#complaint-form"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-800 dark:text-zinc-200 px-5 py-3 text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-zinc-500" />
                    <span>تقديم عريضة أو مطلب كتابي فوري</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowAdvanceForm(!showAdvanceForm)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-5 py-3 text-xs font-bold transition cursor-pointer"
                  >
                    <MessageSquareText className="h-4 w-4 text-red-600" />
                    <span>تسجيل سؤال مسبق للبث القادم</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanceForm ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {/* Advance Question Submission Drawer (Feeds to MP Admin Live QA) */}
                {showAdvanceForm && (
                  <div className="w-full max-w-xl text-right mt-4 pt-6 border-t border-zinc-200 dark:border-zinc-800 animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <MessageSquareText className="h-4 w-4 text-red-600" />
                        <span>إيداع سؤال مسبق لطرحه في جلسة الحوار القادمة</span>
                      </h4>
                      <span className="text-[10px] text-zinc-400">يُحال للمكتب البرلماني مباشرة</span>
                    </div>

                    <form onSubmit={handleSubmitQuestion} className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="الاسم واللقب *"
                          value={citizenName}
                          onChange={(e) => setCitizenName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        <select
                          value={zone}
                          onChange={(e) => setZone(e.target.value)}
                          required
                          className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 cursor-pointer"
                        >
                          <option value="">اختر المنطقة/الحي *</option>
                          {MANOUBA_ZONES.map((z) => (
                            <option key={z} value={z}>
                              {z}
                            </option>
                          ))}
                        </select>
                      </div>

                      <input
                        type="tel"
                        placeholder="رقم الهاتف (اختياري - لمتابعة مآل الإجابة)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={12}
                        className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />

                      <textarea
                        rows={3}
                        placeholder="اكتب استفسارك أو مشكل منطقتك بالتفصيل..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        required
                        className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />

                      {feedbackMsg && (
                        <div
                          className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                            feedbackMsg.type === "success"
                              ? "bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-red-50 border border-red-300 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                        >
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{feedbackMsg.text}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-zinc-400">
                          سيتم إدراج سؤالك في جدول متابعات النائب أسماء درويش.
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          <span>إرسال السؤال</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
