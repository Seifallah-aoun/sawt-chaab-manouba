"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw, Trash2, Volume2, AlertCircle, Radio } from "lucide-react";

interface VoiceRecorderProps {
  onAudioRecorded: (base64Audio: string | null) => void;
}

export default function VoiceRecorder({ onAudioRecorded }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError("المتصفح لا يدعم تسجيل الصوت المباشر.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onAudioRecorded(base64data);
        };

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error("Mic access error:", err);
      setPermissionError("تعذر الوصول إلى الميكروفون. الرجاء السماح بالوصول في إعدادات المتصفح.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingDuration(0);
    setAudioDuration(0);
    setAudioCurrentTime(0);
    onAudioRecorded(null);
  };

  return (
    <div className="rounded-3xl border-2 border-red-500/70 bg-gradient-to-b from-red-50/60 to-white p-6 shadow-sm dark:from-red-950/20 dark:to-zinc-900 dark:border-red-600/60">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-500/30">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>تسجيل الشكوى الصوتية المباشرة</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-900/60 dark:text-red-300">
                <Radio className="h-3 w-3 animate-pulse text-red-600" />
                مباشر
              </span>
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              تحدث بحرية وبلهجتك الطبيعية لشرح إشكالك لمكتب النائب أسماء درويش
            </p>
          </div>
        </div>
      </div>

      {permissionError && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* State 1: Ready to Record or Recording in progress */}
      {!audioUrl && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="relative">
            {isRecording && (
              <>
                <span className="absolute -inset-4 animate-ping rounded-full bg-red-400 opacity-40 dark:bg-red-500" />
                <span className="absolute -inset-8 animate-pulse rounded-full bg-red-200/50 opacity-60 dark:bg-red-900/30" />
              </>
            )}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition-all active:scale-90 ${
                isRecording
                  ? "bg-zinc-950 hover:bg-black ring-4 ring-red-500/40"
                  : "bg-red-600 hover:bg-red-700 shadow-red-600/40 hover:scale-105"
              }`}
              title={isRecording ? "إيقاف التسجيل" : "بدء التسجيل الصوتي"}
            >
              {isRecording ? (
                <Square className="h-8 w-8 fill-current" />
              ) : (
                <Mic className="h-9 w-9" />
              )}
            </button>
          </div>

          <div className="mt-5">
            {isRecording ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
                  <span className="font-mono text-xl font-black text-red-600 dark:text-red-400">
                    {formatTime(recordingDuration)}
                  </span>
                </div>

                {/* Animated Waveform Visualization */}
                <div className="flex items-center justify-center gap-1.5 h-8">
                  <span className="w-1.5 bg-red-500 rounded-full animate-[bounce_0.6s_infinite_100ms] h-4" />
                  <span className="w-1.5 bg-red-600 rounded-full animate-[bounce_0.6s_infinite_200ms] h-7" />
                  <span className="w-1.5 bg-red-500 rounded-full animate-[bounce_0.6s_infinite_300ms] h-5" />
                  <span className="w-1.5 bg-red-600 rounded-full animate-[bounce_0.6s_infinite_150ms] h-8" />
                  <span className="w-1.5 bg-red-500 rounded-full animate-[bounce_0.6s_infinite_250ms] h-6" />
                  <span className="w-1.5 bg-red-600 rounded-full animate-[bounce_0.6s_infinite_350ms] h-3" />
                  <span className="w-1.5 bg-red-500 rounded-full animate-[bounce_0.6s_infinite_180ms] h-7" />
                  <span className="w-1.5 bg-red-600 rounded-full animate-[bounce_0.6s_infinite_280ms] h-5" />
                </div>

                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  جارٍ الاستماع والتسجيل... اضغط على المربع الأسود عند الانتهاء
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  اضغط على الميكروفون لبدء التسجيل الصوتي
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  (لا حاجة لكتابة نص طويل، سيصل صوتك مباشرة للنائب أسماء درويش)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* State 2: Audio Recorded & Ready for Preview */}
      {audioUrl && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={togglePlayback}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition"
                title={isPlaying ? "إيقاف مؤقت" : "استماع للتسجيل"}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current translate-x-0.5" />
                )}
              </button>

              <div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  <Volume2 className="h-4 w-4 text-emerald-600" />
                  <span>تم التقاط التسجيل بنجاح (جاهز للإرسال)</span>
                </div>
                <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {formatTime(audioCurrentTime)} / {formatTime(audioDuration || recordingDuration)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={resetRecording}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>إعادة التسجيل</span>
              </button>

              <button
                type="button"
                onClick={resetRecording}
                className="rounded-xl p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition"
                title="حذف الصوت"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <audio
            ref={audioElementRef}
            src={audioUrl}
            onTimeUpdate={() => {
              if (audioElementRef.current) {
                setAudioCurrentTime(audioElementRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (audioElementRef.current) {
                setAudioDuration(audioElementRef.current.duration);
              }
            }}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
