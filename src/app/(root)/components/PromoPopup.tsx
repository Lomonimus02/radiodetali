"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { ExternalLink, X } from "lucide-react";
import { BoldText } from "./BoldText";

const DEFAULT_VK_HREF = "https://vk.com/dragsoyuz";

const STORAGE_KEY = "dragsoyuz-promo-dismissed";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitDismissChange() {
  listeners.forEach((listener) => listener());
}

function getServerSnapshot() {
  return true;
}

function isDismissed(updatedAt: string): boolean {
  if (!updatedAt) return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === updatedAt;
  } catch {
    return false;
  }
}

function vkCommunityHref(raw: string): string {
  const value = raw.trim();
  if (!value) return DEFAULT_VK_HREF;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    // оставляем ссылку сообщества по умолчанию
  }
  return DEFAULT_VK_HREF;
}

type PromoPopupProps = {
  enabled: boolean;
  text: string;
  terms: string;
  updatedAt: string;
  vkHref: string;
};

export function PromoPopup({ enabled, text, terms, updatedAt, vkHref }: PromoPopupProps) {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => isDismissed(updatedAt),
    getServerSnapshot,
  );

  const close = useCallback(() => {
    try {
      if (updatedAt) {
        localStorage.setItem(STORAGE_KEY, updatedAt);
      }
    } catch {
      // localStorage может быть недоступен
    }
    emitDismissChange();
  }, [updatedAt]);

  const visible = enabled && text.trim().length > 0 && !dismissed;

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [visible, close]);

  if (!visible) return null;

  const termsText = terms.trim();
  const communityHref = vkCommunityHref(vkHref);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-title"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--gray-200)] bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть"
          className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto p-6 pt-14">
          <h2 id="promo-popup-title" className="text-xl font-bold text-[var(--gray-900)]">
            Акция
          </h2>

          <BoldText
            text={text}
            className="mt-4 whitespace-pre-wrap leading-relaxed text-[var(--gray-700)]"
          />

          {termsText ? (
            <div className="mt-5 border-t border-[var(--gray-200)] pt-5">
              <h3 className="text-base font-semibold text-[var(--gray-900)]">Условия</h3>
              <BoldText
                text={termsText}
                className="mt-2 whitespace-pre-wrap leading-relaxed text-[var(--gray-700)]"
              />
            </div>
          ) : null}

          <a
            href={communityHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-800)]"
          >
            Условия акции во ВКонтакте
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <p className="mt-2 text-xs text-[var(--gray-500)]">
            Откроется страница сообщества в новой вкладке
          </p>
        </div>
      </div>
    </div>
  );
}
