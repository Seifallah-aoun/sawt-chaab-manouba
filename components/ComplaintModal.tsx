"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Send, 
  MapPin, 
  Upload, 
  Check, 
  Copy, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  FileText,
  Mic,
  Trash2,
  ShieldCheck,
  Compass
} from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import { ComplaintCategory, ComplaintPriority, GPSLocation, Complaint } from "@/lib/types";
import { notifyDataChanged } from "@/lib/sync";

export type ModalMode = "petition" | "voice";

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  onTrackComplaint?: (id: string) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  "الماء والتطهير",
  "الإنارة والطرقات",
  "الصحة",
  "النقل",
  "الشؤون الاجتماعية",
  "التشغيل",
  "إشكال إداري",
  "أخرى",
];

// Exact zones for the electoral district of Manouba & Den Den
export const MANOUBA_DEN_DEN_ZONES = [
  "منوبة المدينة",
  "منوبة الوسطى",
  "سيدي عمر",
  "الدندان الشمالي",
  "الدندان الجنوبي",
  "قصر السعيد",
] as const;

export default function ComplaintModal({
  isOpen,
  onClose,
  mode,
  onTrackComplaint,
}: ComplaintModalProps) {
  const [currentMode, setCurrentMode] = useState<ModalMode>(mode);
  const [citizenName, setCitizenName] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState<string>(MANOUBA_DEN_DEN_ZONES[0]);
  const [category, setCategory] = useState<ComplaintCategory>("الماء والتطهير");
  const [priority, setPriority] = useState<ComplaintPriority>("عادي");
  
  // Written mode vs Voice mode states
  const [description, setDescription] = useState("");
  const [voiceNoteOptional, setVoiceNoteOptional] = useState("");
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  
  // Attachments & GPS
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentMode(mode);
      setError(null);
      setCreatedComplaint(null);
      setCopied(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الملف يجب ألا يتجاوز 5 ميغابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGetGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsMessage("تم اعتماد اختيار المنطقة يدوياً من قائمة العمادات أدناه.");
      return;
    }

    setGpsLoading(true);
    setGpsMessage(null);

    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    const lowAccuracyOptions: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      setGpsLocation({
        latitude: Number(position.coords.latitude.toFixed(5)),
        longitude: Number(position.coords.longitude.toFixed(5)),
        accuracy: Math.round(position.coords.accuracy),
      });
      setGpsLoading(false);
      setGpsMessage("تم التقاط الإحداثيات بنجاح بنظام GPS");
    };

    const handleFallbackError = (err: GeolocationPositionError) => {
      console.warn("Mobile geolocation fallback error:", err.message);
      setGpsLoading(false);
      // Smooth and silent fallback to manual zone dropdown without harsh error messages
      setGpsMessage("تم اعتماد اختيار المنطقة يدوياً من قائمة العمادات أدناه.");
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        console.warn("GPS high accuracy timed out or failed, attempting standard accuracy fallback:", err.message);
        // Seamless fallback to standard accuracy
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          handleFallbackError,
          lowAccuracyOptions
        );
      },
      highAccuracyOptions
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations: Full Name
    if (!citizenName.trim() || citizenName.trim().length < 3) {
      setError("الرجاء إدخال الاسم واللقب بشكل كامل (3 أحرف على الأقل).");
      return;
    }

    // Validations: Phone (8 digits)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 8) {
      setError("الرجاء إدخال رقم هاتف تونسي صالح متكون من 8 أرقام.");
      return;
    }

    // Mode-specific validation
    if (currentMode === "voice") {
      if (!audioBase64) {
        setError("الرجاء تسجيل الرسالة أو الشكوى الصوتية عبر الميكروفون أولاً قبل الإرسال، أو التبديل لخيار المطلب الكتابي.");
        return;
      }
    } else {
      if (!description.trim() || description.trim().length < 5) {
        setError("الرجاء كتابة نص المطلب أو العريضة بالتفصيل (5 أحرف على الأقل).");
        return;
      }
    }

    setIsLoading(true);

    try {
      const finalDescription = currentMode === "voice" 
        ? (voiceNoteOptional.trim() || "شكوى صوتية مسجلة من مواطن بدائرة منوبة - الدندان") 
        : description.trim();

      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          citizenName: citizenName.trim(),
          phone: cleanPhone,
          zone,
          category,
          priority,
          type: currentMode,
          description: finalDescription,
          audioBase64: currentMode === "voice" ? audioBase64 : undefined,
          imageBase64: imageBase64 || undefined,
          gpsLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر إرسال المطلب، يرجى المحاولة لاحقاً.");
      }

      setCreatedComplaint(data.complaint);
      notifyDataChanged("COMPLAINT_CREATED");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء الإرسال.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyTrackingCode = () => {
    if (createdComplaint?.id) {
      navigator.clipboard.writeText(createdComplaint.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleTrackNow = () => {
    if (createdComplaint?.id && onTrackComplaint) {
      onTrackComplaint(createdComplaint.id);
    }
    onClose();
  };

  const isVoiceMode = currentMode === "voice";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl transition-all dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 my-8 overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 sm:px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
              isVoiceMode ? "bg-red-600 shadow-red-500/30" : "bg-blue-600 shadow-blue-500/30"
            }`}>
              {isVoiceMode ? <Mic className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {isVoiceMode ? "تسجيل شكوى صوتية مباشرة" : "تقديم مطلب أو عريضة كتابية"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                دائرة منوبة - الدندان | مجلس نواب الشعب 🇹🇳
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick Mode Switch Button */}
            <button
              type="button"
              onClick={() => setCurrentMode(isVoiceMode ? "petition" : "voice")}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              {isVoiceMode ? (
                <>
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <span className="hidden sm:inline">التحويل لكتابة مطلب</span>
                  <span className="sm:hidden">كتابة مطلب</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5 text-red-600" />
                  <span className="hidden sm:inline">التحويل لتسجيل صوتي</span>
                  <span className="sm:hidden">تسجيل صوتي</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[82vh] overflow-y-auto p-6">
          {createdComplaint ? (
            /* Success Screen */
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Check className="h-10 w-10 stroke-[2.5]" />
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                تم التوثيق والإيداع بنجاح
              </span>

              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                شكراً لك، تم استلام {isVoiceMode ? "شكواك الصوتية" : "مطلبك"} بنجاح!
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                سيتولى الفريق البرلماني للنائب أسماء درويش لدائرة منوبة - الدندان مراجعة الملف ومتابعته مع المصالح الإدارية والبلدية المختصة.
              </p>

              {/* Unique Tracking Code Box */}
              <div className="mx-auto my-6 max-w-md rounded-2xl border-2 border-dashed border-red-300 bg-red-50/60 p-5 dark:border-red-900/60 dark:bg-red-950/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                  رمز تتبع المطلب الخاص بك (Tracking Code)
                </p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-extrabold tracking-widest text-zinc-950 dark:text-zinc-50">
                    {createdComplaint.id}
                  </span>
                  <button
                    type="button"
                    onClick={copyTrackingCode}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 shadow-sm border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-zinc-500" />
                        <span>نسخ الرمز</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  احتفظ بهذا الرمز لمتابعة تقدم طلبك مباشرة في قسم &quot;تتبع مآل مطلبك&quot;
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleTrackNow}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 transition cursor-pointer"
                >
                  <Compass className="h-4 w-4" />
                  متابعة المطلب الآن في المنصة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedComplaint(null);
                    setCitizenName("");
                    setPhone("");
                    setDescription("");
                    setVoiceNoteOptional("");
                    setAudioBase64(null);
                    setImageBase64(null);
                    setGpsLocation(null);
                  }}
                  className="w-full sm:w-auto rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                >
                  إيداع طلب آخر
                </button>
              </div>
            </div>
          ) : (
            /* Form Screen */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* VOICE COMPLAINT MODE: Microphone & Waveform Centerpiece */}
              {isVoiceMode && (
                <div className="space-y-4">
                  <VoiceRecorder
                    onAudioRecorded={(audio) => setAudioBase64(audio)}
                    onFallbackToWritten={() => setCurrentMode("petition")}
                  />
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      ملاحظة كتابية مختصرة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={voiceNoteOptional}
                      onChange={(e) => setVoiceNoteOptional(e.target.value)}
                      placeholder="عنوان مختصر أو ملخص بالكلمات (مثال: عطب محول كهربائي بقصر السعيد)..."
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {/* CITIZEN INFORMATION: Full Name & Tunisian Phone (NO CIN) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    الاسم واللقب <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="مثال: منية الطالبي"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="مثال: 98123456"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-left dir-ltr"
                  />
                </div>
              </div>

              {/* Exact Manouba - Den Den Zones Dropdown */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    العمادة / المنطقة (دائرة منوبة - الدندان) <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {MANOUBA_DEN_DEN_ZONES.map((z) => (
                      <option key={z} value={z}>
                        📍 {z}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    مخصص حصرياً للمتساكنين بدائرة معتمدية منوبة والدندان
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    القطاع المعني <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  درجة الاستعجال
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["عادي", "متوسط", "عاجل جداً"] as ComplaintPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`rounded-xl py-2 px-3 text-xs font-bold transition border cursor-pointer ${
                        priority === p
                          ? p === "عاجل جداً"
                            ? "bg-red-600 text-white border-red-600 shadow-sm"
                            : p === "متوسط"
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* WRITTEN PETITION MODE: Large comfortable Textarea (rows={6}) */}
              {!isVoiceMode && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    نص المطلب أو العريضة بالتفصيل <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب هنا تفاصيل مطلبك أو العريضة بدقة: ما هو الإشكال، موقعه بمنوبة أو الدندان، الإدارة أو البلدية المعنية، والمقترح أو الإجراء المطلوب من النائب أسماء درويش..."
                    className="w-full rounded-2xl border border-zinc-300 bg-white p-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 leading-relaxed"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    يمكنك إرفاق وثائق، عرائض ممضاة، أو صور توضيحية في القسم أدناه.
                  </p>
                </div>
              )}

              {/* Attachments & GPS Section */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                {/* Photo / Document Upload */}
                <div className="rounded-2xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                    إرفاق صورة أو وثيقة داعمة
                  </span>

                  {imageBase64 ? (
                    <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageBase64}
                        alt="المرفق"
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImageBase64(null)}
                        className="absolute top-2 left-2 rounded-lg bg-red-600 p-1.5 text-white hover:bg-red-700 shadow cursor-pointer"
                        title="حذف الصورة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-28 cursor-pointer rounded-xl border-2 border-dashed border-zinc-300 hover:border-red-400 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-800/80 transition">
                      <Upload className="h-6 w-6 text-zinc-400" />
                      <span className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        اختر وثيقة أو صورة
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        (JPG, PNG بحد أقصى 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* GPS Location Button */}
                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                      تحديد الموقع الجغرافي (GPS)
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      لتحديد موقع الإشكال أو التدخل الميداني بمنوبة والدندان بدقة
                    </p>
                  </div>

                  <div className="mt-3">
                    {gpsLocation ? (
                      <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>
                            تم التحديد ({gpsLocation.latitude}, {gpsLocation.longitude})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGpsLocation(null)}
                          className="text-xs font-semibold text-zinc-500 hover:text-red-600 cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGetGps}
                        disabled={gpsLoading}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                      >
                        {gpsLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                            <span>جارٍ تحديد الموقع...</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 text-red-600" />
                            <span>التقاط موقعي الحالي عبر GPS</span>
                          </>
                        )}
                      </button>
                    )}
                    {gpsMessage && !gpsLocation && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 px-2.5 py-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span>{gpsMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/50 p-3 rounded-xl">
                <ShieldCheck className="h-4 w-4 text-zinc-500 shrink-0" />
                <span>
                  بياناتك محمية بموجب السرية البرلمانية وقانون حماية المعطيات الشخصية في الجمهورية التونسية.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer ${
                    isVoiceMode
                      ? "bg-red-600 shadow-red-600/20 hover:bg-red-700"
                      : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جارٍ الإرسال والتسجيل...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{isVoiceMode ? "إرسال الشكوى الصوتية" : "إرسال العريضة والمطلب"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
