/**
 * Native In-App WebRTC & Live MediaStream Engine for MP Asma Derouiche Platform
 * 
 * Provides:
 * 1. Safe, robust camera & microphone acquisition with automatic fallbacks.
 * 2. Virtual Parliamentary Studio Canvas stream fallback (ensuring 0 black screens even without a physical webcam).
 * 3. In-App WebRTC Peer-to-Peer broadcasting across browser tabs & windows.
 * 4. Ultra-low-latency live frame snapshot sync (instant fallback rendering).
 */

export interface StreamAcquisitionResult {
  stream: MediaStream;
  isVirtual: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  error?: string;
}

/**
 * Creates an animated parliamentary studio MediaStream using HTML5 Canvas & Web Audio API.
 * Guarantees a fully valid, playable 1280x720 30fps MediaStream with both video and audio tracks,
 * ensuring no black screens or device errors occur if a physical camera is blocked or missing.
 */
export function createParliamentaryStudioStream(
  mpName: string = "النائب أسماء درويش",
  zoneTitle: string = "دائرة منوبة - الدندان"
): MediaStream {
  if (typeof window === "undefined") {
    throw new Error("createParliamentaryStudioStream must be called in browser environment.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");

  let animationFrameId: number;
  let tick = 0;

  const render = () => {
    if (!ctx) return;
    tick++;

    // 1. Studio Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
    bgGrad.addColorStop(0, "#09090b");
    bgGrad.addColorStop(0.5, "#18181b");
    bgGrad.addColorStop(1, "#09090b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Subtle red atmospheric glow in top right
    const glowGrad = ctx.createRadialGradient(1100, 100, 10, 1100, 100, 450);
    glowGrad.addColorStop(0, "rgba(220, 38, 38, 0.25)");
    glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // 2. Animated Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const offset = (tick * 0.5) % 40;
    for (let x = offset; x < 1280; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (let y = offset; y < 720; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // 3. Tunisian Emblem Header
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
    ctx.fillText("🇹🇳 مجلس نواب الشعب بالجمهورية التونسية", 640, 70);

    ctx.font = "16px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("البث المباشر الموحد | المنصة البرلمانية التفاعلية", 640, 105);

    // 4. Central MP Identity Card & Audio Visualizer
    const cardX = 340;
    const cardY = 160;
    const cardW = 600;
    const cardH = 360;

    // Card background
    ctx.fillStyle = "rgba(24, 24, 27, 0.85)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Central Avatar / Crest
    const avatarX = 640;
    const avatarY = 270;
    const pulse = Math.sin(tick * 0.08) * 6;

    // Glowing avatar ring
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 65 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 55, 0, Math.PI * 2);
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.fillText("أ د", avatarX, avatarY + 11);

    // MP Name & Title
    ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(mpName, 640, 380);

    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`نائبة الشعب عن ${zoneTitle}`, 640, 415);

    // Animated Soundwave Visualizer Bars
    const barCount = 28;
    const totalW = 340;
    const startX = 640 - totalW / 2;
    for (let i = 0; i < barCount; i++) {
      const barH = 10 + Math.abs(Math.sin(tick * 0.12 + i * 0.4)) * 36;
      const bx = startX + (i * (totalW / barCount));
      const by = 475 - barH / 2;
      
      const barGrad = ctx.createLinearGradient(0, by, 0, by + barH);
      barGrad.addColorStop(0, "#ef4444");
      barGrad.addColorStop(1, "#f97316");
      
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(bx, by, 7, barH, 3);
      ctx.fill();
    }

    // 5. Bottom Live Broadcast Information Banner
    ctx.fillStyle = "rgba(9, 9, 11, 0.95)";
    ctx.fillRect(0, 630, 1280, 90);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(0, 630);
    ctx.lineTo(1280, 630);
    ctx.stroke();

    // Red Live Pill
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(50, 655, 130, 40, 20);
    ctx.fill();

    // Ping dot
    const dotAlpha = 0.5 + Math.sin(tick * 0.15) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
    ctx.beginPath();
    ctx.arc(75, 675, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("مباشر (LIVE)", 165, 681);

    // Live Title Text
    ctx.textAlign = "right";
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("جلسة حوار مفتوح وبث مباشر: متابعة مشاغل أهالي منوبة والدندان", 1230, 670);

    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a1a1aa";
    const now = new Date();
    const timeStr = now.toLocaleTimeString("ar-TN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    ctx.fillText(`إشارة البث المباشر نشطة | توقيت تونس: ${timeStr} | تفاعل فوري مع المواطنين`, 1230, 700);

    animationFrameId = requestAnimationFrame(render);
  };

  render();

  // Capture canvas video stream at 30 fps
  const videoStream = canvas.captureStream(30);

  // Generate lightweight ambient audio track using Web Audio API
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const dest = audioCtx.createMediaStreamDestination();

      // Inaudible ambient sub-tone (15Hz at near 0 gain) so tracks are technically valid
      osc.frequency.setValueAtTime(15, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        videoStream.addTrack(audioTrack);
      }
    }
  } catch (err) {
    console.warn("Could not attach synthetic audio track to studio stream:", err);
  }

  // Hook cleanup when stream tracks stop
  const tracks = videoStream.getTracks();
  tracks.forEach((track) => {
    const originalStop = track.stop.bind(track);
    track.stop = () => {
      cancelAnimationFrame(animationFrameId);
      originalStop();
    };
  });

  return videoStream;
}

/**
 * Acquire real hardware camera & microphone with progressive fallbacks.
 * Uses clean, direct constraints: navigator.mediaDevices.getUserMedia({ video: true, audio: true })
 * directly capturing the PC webcam with video-only and virtual fallbacks.
 */
export async function acquireLiveMediaStream(
  mpName: string = "النائب أسماء درويش",
  zoneTitle: string = "دائرة منوبة - الدندان",
  videoDeviceId?: string
): Promise<StreamAcquisitionResult> {
  if (typeof window === "undefined" || !navigator.mediaDevices) {
    const virtual = createParliamentaryStudioStream(mpName, zoneTitle);
    return {
      stream: virtual,
      isVirtual: true,
      hasAudio: true,
      hasVideo: true,
      error: "تعذر الوصول إلى كاميرا الكمبيوتر، يرجى التحقق من الأذونات",
    };
  }

  // 1. If an explicit deviceId is chosen from dropdown:
  if (videoDeviceId && videoDeviceId.trim().length > 0) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { ideal: videoDeviceId } },
        audio: true,
      });

      return {
        stream,
        isVirtual: false,
        hasAudio: stream.getAudioTracks().length > 0,
        hasVideo: stream.getVideoTracks().length > 0,
      };
    } catch (err1) {
      console.warn("Explicit deviceId failed, falling back to clean direct constraints...", err1);
    }
  }

  // 2. Clean, direct constraints for PC Webcam: { video: true, audio: true }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    return {
      stream,
      isVirtual: false,
      hasAudio: stream.getAudioTracks().length > 0,
      hasVideo: stream.getVideoTracks().length > 0,
    };
  } catch (err2) {
    console.warn("Direct { video: true, audio: true } failed, trying video-only fallback...", err2);
  }

  // 3. Fallback: video-only { video: true, audio: false } (if mic is blocked or exclusively locked)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    return {
      stream,
      isVirtual: false,
      hasAudio: false,
      hasVideo: stream.getVideoTracks().length > 0,
    };
  } catch (err3) {
    console.warn("Direct video-only also failed:", err3);
  }

  // 4. Safe fallback - Virtual Parliamentary Studio
  const virtualStream = createParliamentaryStudioStream(mpName, zoneTitle);
  return {
    stream: virtualStream,
    isVirtual: true,
    hasAudio: true,
    hasVideo: true,
    error: "تعذر الوصول إلى كاميرا الكمبيوتر، يرجى التحقق من الأذونات",
  };
}

/**
 * WebRTC Signaling Message Types
 */
export type SignalingMessage =
  | { type: "VIEWER_JOIN"; viewerId: string }
  | { type: "BROADCASTER_ONLINE" }
  | { type: "STREAM_UPDATED" }
  | { type: "OFFER"; viewerId: string; sdp: RTCSessionDescriptionInit }
  | { type: "ANSWER"; viewerId: string; sdp: RTCSessionDescriptionInit }
  | { type: "ICE_CANDIDATE"; viewerId: string; candidate: RTCIceCandidateInit }
  | { type: "STREAM_FRAME"; frame: string; timestamp: number }
  | { type: "STREAM_ENDED" };

const WEBRTC_CHANNEL_NAME = "naiba_live_webrtc_v2";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
  bundlePolicy: "max-bundle",
  iceCandidatePoolSize: 2,
};

/**
 * MP Broadcaster Manager:
 * Handles incoming viewer connections and distributes the local MediaStream.
 */
export class LiveStreamBroadcaster {
  private localStream: MediaStream;
  private channel: BroadcastChannel | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private onlineAnnounceInterval: ReturnType<typeof setInterval> | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenVideo: HTMLVideoElement | null = null;
  private isDestroyed = false;

  constructor(stream: MediaStream) {
    this.localStream = stream;
    this.initChannel();
    this.initFrameBroadcasting();
  }

  private initChannel() {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    this.channel = new BroadcastChannel(WEBRTC_CHANNEL_NAME);
    this.channel.onmessage = async (event: MessageEvent<SignalingMessage>) => {
      if (this.isDestroyed) return;
      const msg = event.data;

      if (msg.type === "VIEWER_JOIN") {
        await this.handleViewerJoin(msg.viewerId);
      } else if (msg.type === "ANSWER") {
        await this.handleViewerAnswer(msg.viewerId, msg.sdp);
      } else if (msg.type === "ICE_CANDIDATE") {
        await this.handleIceCandidate(msg.viewerId, msg.candidate);
      }
    };

    // Announce broadcaster is active immediately and periodically
    this.channel.postMessage({ type: "BROADCASTER_ONLINE" });
    this.onlineAnnounceInterval = setInterval(() => {
      if (this.isDestroyed) return;
      if (this.channel) {
        this.channel.postMessage({ type: "BROADCASTER_ONLINE" });
      }
    }, 2500);
  }

  private async handleViewerJoin(viewerId: string) {
    try {
      // If we already have an active connected or connecting peer connection for this viewer, do not interrupt it
      const existing = this.peerConnections.get(viewerId);
      if (existing && (existing.connectionState === "connected" || existing.connectionState === "connecting")) {
        return;
      }
      if (existing) {
        existing.close();
        this.peerConnections.delete(viewerId);
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      this.peerConnections.set(viewerId, pc);

      // Add all live tracks from local stream
      const liveTracks = this.localStream.getTracks().filter((t) => t.readyState === "live");
      if (liveTracks.length === 0) {
        console.warn("Broadcaster has no active tracks to send viewer:", viewerId);
        return;
      }
      liveTracks.forEach((track) => {
        pc.addTrack(track, this.localStream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && this.channel) {
          this.channel.postMessage({
            type: "ICE_CANDIDATE",
            viewerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
          this.peerConnections.delete(viewerId);
        }
      };

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (this.channel) {
        this.channel.postMessage({
          type: "OFFER",
          viewerId,
          sdp: offer,
        });
      }
    } catch (err) {
      console.warn("Broadcaster failed to handle viewer join:", err);
    }
  }

  private async handleViewerAnswer(viewerId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(viewerId);
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const pending = this.pendingCandidates.get(viewerId);
      if (pending && pending.length > 0) {
        for (const cand of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch {}
        }
        this.pendingCandidates.delete(viewerId);
      }
    } catch (err) {
      console.warn("Broadcaster failed to set remote answer:", err);
    }
  }

  private async handleIceCandidate(viewerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(viewerId);
    if (!pc || !pc.remoteDescription) {
      if (!this.pendingCandidates.has(viewerId)) {
        this.pendingCandidates.set(viewerId, []);
      }
      this.pendingCandidates.get(viewerId)!.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Broadcaster failed to add ICE candidate:", err);
    }
  }

  /**
   * High-speed frame broadcaster:
   * Captures camera frames every 40-50ms (~20-25fps) and broadcasts directly across tabs.
   * Guarantees 0ms delay video display without waiting for STUN/mDNS/network negotiation.
   */
  private initFrameBroadcasting() {
    if (typeof window === "undefined") return;

    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = 640;
    this.offscreenCanvas.height = 360;
    const ctx = this.offscreenCanvas.getContext("2d", { alpha: false });

    this.offscreenVideo = document.createElement("video");
    this.offscreenVideo.muted = true;
    this.offscreenVideo.playsInline = true;
    this.offscreenVideo.autoplay = true;
    // Set a real dimension so Chromium doesn't suspend video decoding
    this.offscreenVideo.style.cssText =
      "position:fixed;width:160px;height:90px;opacity:0.01;pointer-events:none;bottom:0;left:0;z-index:-9999;";
    try {
      document.body.appendChild(this.offscreenVideo);
    } catch {
      // ignore
    }
    this.offscreenVideo.srcObject = this.localStream;
    this.offscreenVideo.play().catch(() => {});

    const canvas = this.offscreenCanvas;

    this.frameInterval = setInterval(() => {
      if (this.isDestroyed || !ctx || !this.channel || !canvas) return;

      const video = this.offscreenVideo;
      if (!video) return;

      if (video.videoWidth > 0 && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, 640, 360);
        try {
          const frame = canvas.toDataURL("image/jpeg", 0.65);
          this.channel.postMessage({
            type: "STREAM_FRAME",
            frame,
            timestamp: Date.now(),
          });
          try {
            localStorage.setItem("naiba_live_frame_ping", Date.now().toString());
          } catch {}
        } catch {
          // ignore
        }
      } else if (video.paused) {
        video.play().catch(() => {});
      }
    }, 50);
  }

  /**
   * Seamlessly update stream in-flight (e.g. when MP switches cameras from selector dropdown)
   */
  public updateStream(newStream: MediaStream) {
    this.localStream = newStream;
    if (this.offscreenVideo) {
      this.offscreenVideo.srcObject = newStream;
      this.offscreenVideo.play().catch(() => {});
    }

    const newVideoTrack = newStream.getVideoTracks()[0];
    const newAudioTrack = newStream.getAudioTracks()[0];

    for (const [, pc] of this.peerConnections.entries()) {
      try {
        const senders = pc.getSenders();
        if (newVideoTrack) {
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack).catch(() => {});
          } else {
            pc.addTrack(newVideoTrack, newStream);
          }
        }
        if (newAudioTrack) {
          const audioSender = senders.find((s) => s.track?.kind === "audio");
          if (audioSender) {
            audioSender.replaceTrack(newAudioTrack).catch(() => {});
          } else {
            pc.addTrack(newAudioTrack, newStream);
          }
        }
      } catch (err) {
        console.warn("Broadcaster track replacement notice:", err);
      }
    }
    // Notify viewers that stream has been updated
    if (this.channel) {
      this.channel.postMessage({ type: "STREAM_UPDATED" });
    }
  }

  public stop(stopHardwareTracks = false) {
    this.isDestroyed = true;

    if (this.onlineAnnounceInterval) {
      clearInterval(this.onlineAnnounceInterval);
      this.onlineAnnounceInterval = null;
    }

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (this.channel) {
      this.channel.postMessage({ type: "STREAM_ENDED" });
      this.channel.close();
      this.channel = null;
    }

    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    if (stopHardwareTracks && this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    if (this.offscreenVideo) {
      if (this.offscreenVideo.parentNode) {
        this.offscreenVideo.parentNode.removeChild(this.offscreenVideo);
      }
      this.offscreenVideo.srcObject = null;
      this.offscreenVideo = null;
    }
  }
}

/**
 * Citizen Viewer Receiver Manager:
 * Connects to the broadcaster over WebRTC and receives the live MediaStream.
 */
export class LiveStreamReceiver {
  private viewerId: string;
  private channel: BroadcastChannel | null = null;
  private pc: RTCPeerConnection | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private onStreamCallback: (stream: MediaStream) => void;
  private onEndedCallback?: () => void;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;
  private remoteWebRTCStream: MediaStream | null = null;

  // Real-time canvas stream synthesizer (guarantees instant zero-delay video display)
  private frameCanvas: HTMLCanvasElement | null = null;
  private frameCanvasCtx: CanvasRenderingContext2D | null = null;
  private isDecodingFrame = false;
  private canvasStream: MediaStream | null = null;
  private hasEmittedStream = false;

  constructor(
    onStream: (stream: MediaStream) => void,
    onEnded?: () => void
  ) {
    this.viewerId = `viewer-${Math.random().toString(36).slice(2, 9)}`;
    this.onStreamCallback = onStream;
    this.onEndedCallback = onEnded;

    this.initCanvasStream();
    this.init();
  }

  private initCanvasStream() {
    if (typeof window === "undefined") return;

    this.frameCanvas = document.createElement("canvas");
    this.frameCanvas.width = 640;
    this.frameCanvas.height = 360;
    this.frameCanvasCtx = this.frameCanvas.getContext("2d", { alpha: false });

    if (this.frameCanvasCtx) {
      this.frameCanvasCtx.fillStyle = "#000000";
      this.frameCanvasCtx.fillRect(0, 0, 640, 360);
    }

    try {
      const canvas = this.frameCanvas as any;
      if (typeof canvas.captureStream === "function") {
        this.canvasStream = canvas.captureStream(30);

        // Attach lightweight Web Audio track for complete media compliance
        try {
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) {
            const audioCtx = new AudioCtxClass();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const dest = audioCtx.createMediaStreamDestination();
            gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(dest);
            osc.start();
            const aTrack = dest.stream.getAudioTracks()[0];
            if (aTrack && this.canvasStream) {
              this.canvasStream.addTrack(aTrack);
            }
          }
        } catch {
          // ignore
        }

        // Deliver synthesized canvas stream immediately so the receiver video element is bound right away
        if (this.canvasStream) {
          this.onStreamCallback(this.canvasStream);
        }
      }
    } catch (err) {
      console.warn("Could not create canvas capture stream:", err);
    }
  }

  public getStream(): MediaStream | null {
    if (this.remoteWebRTCStream && this.remoteWebRTCStream.getTracks().some((t) => t.readyState === "live")) {
      return this.remoteWebRTCStream;
    }
    return this.canvasStream;
  }

  private handleStreamFrame(frameDataUrl: string) {
    if (!this.frameCanvas || !this.frameCanvasCtx || this.isDestroyed || this.isDecodingFrame) return;

    this.isDecodingFrame = true;
    const img = new Image();
    img.onload = () => {
      this.isDecodingFrame = false;
      if (this.frameCanvasCtx && this.frameCanvas && !this.isDestroyed) {
        this.frameCanvasCtx.drawImage(img, 0, 0, 640, 360);

        // Instantly deliver the live stream to the citizen video player on first received frame
        if (!this.hasEmittedStream && this.canvasStream) {
          this.hasEmittedStream = true;
          this.onStreamCallback(this.canvasStream);
        }
      }
    };
    img.onerror = () => {
      this.isDecodingFrame = false;
    };
    img.src = frameDataUrl;
  }

  private init() {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    this.channel = new BroadcastChannel(WEBRTC_CHANNEL_NAME);
    this.channel.onmessage = async (event: MessageEvent<SignalingMessage>) => {
      if (this.isDestroyed) return;
      const msg = event.data;

      if (msg.type === "BROADCASTER_ONLINE" || msg.type === "STREAM_UPDATED") {
        this.sendJoin();
      } else if (msg.type === "STREAM_FRAME") {
        this.handleStreamFrame(msg.frame);
      } else if (msg.type === "OFFER" && msg.viewerId === this.viewerId) {
        await this.handleOffer(msg.sdp);
      } else if (msg.type === "ICE_CANDIDATE" && msg.viewerId === this.viewerId) {
        await this.handleCandidate(msg.candidate);
      } else if (msg.type === "STREAM_ENDED" && this.onEndedCallback) {
        this.onEndedCallback();
      }
    };

    // Broadcast JOIN immediately to request the active stream
    this.sendJoin();

    // Re-check periodically ONLY if stream is not yet established
    this.pingInterval = setInterval(() => {
      if (this.isDestroyed) return;
      if (
        this.pc &&
        (this.pc.connectionState === "connected" ||
          (this.remoteWebRTCStream &&
            this.remoteWebRTCStream.getTracks().some((t) => t.readyState === "live")))
      ) {
        return;
      }
      this.sendJoin();
    }, 2000);
  }

  private sendJoin() {
    if (this.channel && !this.isDestroyed) {
      this.channel.postMessage({
        type: "VIEWER_JOIN",
        viewerId: this.viewerId,
      });
    }
  }

  private async handleOffer(sdp: RTCSessionDescriptionInit) {
    try {
      if (this.pc) {
        this.pc.close();
      }

      this.pc = new RTCPeerConnection(ICE_SERVERS);

      this.pc.ontrack = (event) => {
        let stream = event.streams && event.streams[0] ? event.streams[0] : null;
        if (!stream) {
          if (!this.remoteWebRTCStream) {
            this.remoteWebRTCStream = new MediaStream();
          }
          if (!this.remoteWebRTCStream.getTracks().some((t) => t.id === event.track.id)) {
            this.remoteWebRTCStream.addTrack(event.track);
          }
          stream = this.remoteWebRTCStream;
        } else {
          this.remoteWebRTCStream = stream;
        }

        if (stream && stream.getTracks().some((t) => t.readyState === "live")) {
          this.onStreamCallback(stream);
        }

        event.track.onunmute = () => {
          if (stream && stream.getTracks().some((t) => t.readyState === "live")) {
            this.onStreamCallback(stream);
          }
        };
      };

      this.pc.onicecandidate = (event) => {
        if (event.candidate && this.channel) {
          this.channel.postMessage({
            type: "ICE_CANDIDATE",
            viewerId: this.viewerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      this.pc.onconnectionstatechange = () => {
        if (this.pc?.connectionState === "disconnected" || this.pc?.connectionState === "failed") {
          this.sendJoin();
        }
      };

      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // Flush buffered candidates
      if (this.pendingCandidates.length > 0) {
        for (const cand of this.pendingCandidates) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch {}
        }
        this.pendingCandidates = [];
      }

      if (this.channel) {
        this.channel.postMessage({
          type: "ANSWER",
          viewerId: this.viewerId,
          sdp: answer,
        });
      }
    } catch (err) {
      console.warn("Receiver failed to handle offer:", err);
    }
  }

  private async handleCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc || !this.pc.remoteDescription) {
      this.pendingCandidates.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Receiver failed to add candidate:", err);
    }
  }

  public stop() {
    this.isDestroyed = true;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach((t) => t.stop());
      this.canvasStream = null;
    }
    this.frameCanvas = null;
    this.frameCanvasCtx = null;
    this.remoteWebRTCStream = null;
  }
}
