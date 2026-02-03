"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function TopAlert() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-[var(--gray-700)] text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2 text-center relative">
        <p className="text-sm font-medium">
          ❗️Время прибытия необходимо согласовать заранее❗️
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-0 p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
