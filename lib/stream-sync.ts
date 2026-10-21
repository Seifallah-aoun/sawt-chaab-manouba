/**
 * Global Live MediaStream Synchronizer
 * 
 * Ensures the MP's active camera MediaStream is shared globally and seamlessly
 * across all components (Admin Preview & Citizen Homepage) and tabs/windows.
 */

const STREAM_SYNC_CHANNEL = "naiba_live_stream_sync_bus";
const CUSTOM_EVENT_NAME = "mp_media_stream_sync_event";

// In-memory module singleton
let activeGlobalStream: MediaStream | null = null;

// Track if stream is currently live
let isLiveBroadcastActive = false;

declare global {
  interface Window {
    __MP_ACTIVE_MEDIA_STREAM__?: MediaStream | null;
  }
}

/**
 * Register the active live MediaStream globally.
 */
export function setGlobalMediaStream(stream: MediaStream | null) {
  activeGlobalStream = stream;
  isLiveBroadcastActive = Boolean(stream && stream.getTracks().some((t) => t.readyState === "live"));

  if (typeof window !== "undefined") {
    // 1. Store on window
    window.__MP_ACTIVE_MEDIA_STREAM__ = stream;

    // 2. Store on top/opener if available
    try {
      if (window.opener && typeof window.opener === "object") {
        window.opener.__MP_ACTIVE_MEDIA_STREAM__ = stream;
      }
    } catch {
      // ignore cross-origin security
    }

    try {
      if (window.top && window.top !== window) {
        window.top.__MP_ACTIVE_MEDIA_STREAM__ = stream;
      }
    } catch {
      // ignore
    }

    // 3. Dispatch local window custom event
    try {
      const event = new CustomEvent(CUSTOM_EVENT_NAME, {
        detail: { stream, isLive: isLiveBroadcastActive },
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.warn("Could not dispatch stream event:", err);
    }

    // 4. Notify other tabs via BroadcastChannel & LocalStorage
    try {
      localStorage.setItem("mp_stream_active_ping", Date.now().toString());
    } catch {
      // ignore
    }

    try {
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel(STREAM_SYNC_CHANNEL);
        bc.postMessage({
          type: "STREAM_AVAILABILITY_CHANGED",
          isLive: isLiveBroadcastActive,
          timestamp: Date.now(),
        });
        bc.close();
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Retrieve the active live MediaStream from any accessible scope.
 */
export function getGlobalMediaStream(): MediaStream | null {
  // 1. Check in-memory module singleton
  if (activeGlobalStream && activeGlobalStream.getTracks().some((t) => t.readyState === "live")) {
    return activeGlobalStream;
  }

  if (typeof window === "undefined") return null;

  // 2. Check window.__MP_ACTIVE_MEDIA_STREAM__
  if (window.__MP_ACTIVE_MEDIA_STREAM__ && window.__MP_ACTIVE_MEDIA_STREAM__.getTracks().some((t) => t.readyState === "live")) {
    activeGlobalStream = window.__MP_ACTIVE_MEDIA_STREAM__;
    return activeGlobalStream;
  }

  // 3. Check window.opener
  try {
    if (window.opener && window.opener.__MP_ACTIVE_MEDIA_STREAM__) {
      const openerStream = window.opener.__MP_ACTIVE_MEDIA_STREAM__;
      if (openerStream && openerStream.getTracks().some((t: MediaStreamTrack) => t.readyState === "live")) {
        activeGlobalStream = openerStream;
        window.__MP_ACTIVE_MEDIA_STREAM__ = openerStream;
        return activeGlobalStream;
      }
    }
  } catch {
    // ignore cross-origin error
  }

  // 4. Check window.top / parent
  try {
    if (window.top && window.top !== window && window.top.__MP_ACTIVE_MEDIA_STREAM__) {
      const topStream = window.top.__MP_ACTIVE_MEDIA_STREAM__;
      if (topStream && topStream.getTracks().some((t: MediaStreamTrack) => t.readyState === "live")) {
        activeGlobalStream = topStream;
        return activeGlobalStream;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Subscribe to global stream updates.
 */
export function subscribeToGlobalMediaStream(callback: (stream: MediaStream | null) => void): () => void {
  if (typeof window === "undefined") return () => {};

  // Fire with current value immediately
  const initial = getGlobalMediaStream();
  if (initial) {
    callback(initial);
  }

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<{ stream: MediaStream | null }>;
    const stream = customEvent.detail?.stream || getGlobalMediaStream();
    callback(stream);
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === "mp_stream_active_ping") {
      const stream = getGlobalMediaStream();
      callback(stream);
    }
  };

  window.addEventListener(CUSTOM_EVENT_NAME, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  let bc: BroadcastChannel | null = null;
  try {
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel(STREAM_SYNC_CHANNEL);
      bc.onmessage = () => {
        const stream = getGlobalMediaStream();
        callback(stream);
      };
    }
  } catch {
    // ignore
  }

  return () => {
    window.removeEventListener(CUSTOM_EVENT_NAME, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
    if (bc) {
      bc.close();
    }
  };
}
