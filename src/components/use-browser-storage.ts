"use client";

import { useCallback, useSyncExternalStore } from "react";

const event = "vectra-storage";
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(event, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(event, notify);
  };
}
export function readBrowserStorage(key: string) {
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}
export function writeBrowserStorage(key: string, value: string) {
  try {
    if (readBrowserStorage(key) === value) return;
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(event));
  } catch {
    /* Browser storage is optional; server attempts remain authoritative. */
  }
}
export function useBrowserStorage(key: string) {
  const snapshot = useCallback(() => readBrowserStorage(key), [key]);
  return useSyncExternalStore(subscribe, snapshot, () => "");
}
