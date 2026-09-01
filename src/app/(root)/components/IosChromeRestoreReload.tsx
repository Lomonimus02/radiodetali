"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "ios-chrome-just-reloaded";
const PRINT_INTERNAL_CLASS = "print-internal-report";

function isIosChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /CriOS/.test(ua) && /iPhone|iPad|iPod/.test(ua);
}

function clearStaleUi(): void {
  document.body.style.overflow = "";
  document.documentElement.classList.remove(PRINT_INTERNAL_CLASS);
}

function consumeReloadGuard(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function IosChromeRestoreReload() {
  useEffect(() => {
    const skipReload = consumeReloadGuard();
    const crios = isIosChrome();
    let frozen = false;
    let reloading = false;

    const requestReload = () => {
      if (skipReload || !crios || reloading) return;
      reloading = true;
      try {
        sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
      } catch {
        /* ignore */
      }
      window.location.reload();
    };

    const discarded = Boolean(
      (document as Document & { wasDiscarded?: boolean }).wasDiscarded,
    );
    if (discarded) {
      requestReload();
    }

    const onPageShow = (event: Event) => {
      clearStaleUi();
      const persisted =
        "persisted" in event &&
        Boolean((event as PageTransitionEvent).persisted);
      if (persisted || frozen) {
        frozen = false;
        requestReload();
      }
    };

    const onFreeze = () => {
      frozen = true;
    };

    const onResume = () => {
      if (!frozen) return;
      frozen = false;
      requestReload();
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!frozen) return;
      frozen = false;
      requestReload();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("freeze", onFreeze);
    document.addEventListener("resume", onResume);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("freeze", onFreeze);
      document.removeEventListener("resume", onResume);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
