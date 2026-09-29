"use client";

import { useState, useTransition } from "react";
import { updatePromoSettings } from "@/app/actions";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { BoldTextarea } from "../components/BoldTextarea";

type PromoSettingsFormProps = {
  initialEnabled: boolean;
  initialText: string;
  initialTerms: string;
};

export function PromoSettingsForm({
  initialEnabled,
  initialText,
  initialTerms,
}: PromoSettingsFormProps) {
  const [promoEnabled, setPromoEnabled] = useState(initialEnabled);
  const [promoText, setPromoText] = useState(initialText);
  const [promoTerms, setPromoTerms] = useState(initialTerms);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updatePromoSettings({
        promoEnabled,
        promoText,
        promoTerms,
      });

      if (result.success) {
        setPromoText(result.data.promoText);
        setPromoTerms(result.data.promoTerms);
        setPromoEnabled(result.data.promoEnabled);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <p className="text-sm text-slate-500">
        Надбавка +1% указана только в тексте объявления и не меняет калькулятор и цены.
      </p>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">Акция сохранена</span>
        </div>
      )}

      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={promoEnabled}
          onChange={(event) => setPromoEnabled(event.target.checked)}
          disabled={isPending}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Показывать акцию
      </label>

      <BoldTextarea
        id="promoText"
        label="Текст"
        value={promoText}
        onChange={setPromoText}
        rows={4}
      />

      <BoldTextarea
        id="promoTerms"
        label="Условия акции"
        value={promoTerms}
        onChange={setPromoTerms}
        rows={6}
      />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Сохранение...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Сохранить
          </>
        )}
      </button>
    </form>
  );
}
