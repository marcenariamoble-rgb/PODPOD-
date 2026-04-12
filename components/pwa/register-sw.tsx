"use client";

import { useEffect } from "react";

/**
 * Registra o Service Worker em produção (ou quando NEXT_PUBLIC_PWA=1).
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const enable =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_PWA === "1";
    if (!enable) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[service-worker]", err);
      }
    });
  }, []);
  return null;
}
