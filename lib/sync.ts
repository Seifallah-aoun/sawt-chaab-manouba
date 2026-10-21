/**
 * Cross-tab real-time synchronization helper for Antigravity MP Hub
 * Broadcasts events across browser tabs/windows with zero-latency.
 */
export function notifyDataChanged(action: string = "REQUESTS_UPDATED") {
  if (typeof window === "undefined") return;

  try {
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("mp_data_sync");
      bc.postMessage({ type: action, timestamp: Date.now() });
      bc.close();
    }
  } catch (err) {
    console.warn("BroadcastChannel dispatch warning:", err);
  }

  try {
    localStorage.setItem("mp_last_update", `${action}_${Date.now()}`);
  } catch (err) {
    console.warn("localStorage dispatch warning:", err);
  }

  try {
    window.dispatchEvent(new CustomEvent("mp_data_updated", { detail: { action, timestamp: Date.now() } }));
  } catch {
    // ignore
  }
}
