"use client";

import { useRef } from "react";

type BoldTextareaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
};

export function BoldTextarea({
  id,
  label,
  value,
  onChange,
  rows = 5,
  hint = "Выделите фрагмент и нажмите «Жирный» — в тексте появится **жирный**.",
}: BoldTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyBold = () => {
    const el = textareaRef.current;
    if (!el) {
      onChange(`**${value}**`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + "**" + selected + "**" + value.slice(end);
    onChange(next);
    const nextStart = start + 2;
    const nextEnd = end + 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextStart, nextEnd);
    });
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={applyBold}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Жирный
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
      />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
