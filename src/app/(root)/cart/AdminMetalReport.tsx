"use client";

import { useEffect, useMemo } from "react";
import { Printer } from "lucide-react";
import type { InventoryLine } from "@/store";
import {
  accumulateInventoryMetals,
  type InventoryMetalProduct,
  type MetalTotals,
} from "@/lib/inventory-metals";
import {
  formatPreciousMetalContent,
  type MetalSymbol,
} from "@/lib/price-calculator";
import { PRECIOUS_METAL_LIST } from "@/lib/precious-metals";

const PRINT_INTERNAL_CLASS = "print-internal-report";
const PRINT_CLEANUP_FALLBACK_MS = 2_000;

const TOTAL_KEYS: Record<MetalSymbol, keyof MetalTotals> = {
  Au: "au",
  Ag: "ag",
  Pt: "pt",
  Pd: "pd",
};

interface AdminMetalReportProps {
  lines: InventoryLine[];
  productsById: Record<string, InventoryMetalProduct | undefined>;
}

function MetalValues({ totals }: { totals: MetalTotals }) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {PRECIOUS_METAL_LIST.map((metal) => (
        <li key={metal.id} className="min-w-0">
          <span className="block text-xs text-[var(--gray-600)]">
            {metal.displaySymbol} ({metal.name})
          </span>
          <span className="block text-sm font-semibold tabular-nums text-[var(--gray-900)]">
            {formatPreciousMetalContent(metal.id, totals[TOTAL_KEYS[metal.id]])}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AdminMetalReport({
  lines,
  productsById,
}: AdminMetalReportProps) {
  const totals = useMemo(
    () => accumulateInventoryMetals(lines, productsById),
    [lines, productsById],
  );

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(PRINT_INTERNAL_CLASS);
    };
  }, []);

  if (lines.length === 0) return null;

  const handleInternalPrint = () => {
    const html = document.documentElement;
    html.classList.add(PRINT_INTERNAL_CLASS);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      html.classList.remove(PRINT_INTERNAL_CLASS);
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, PRINT_CLEANUP_FALLBACK_MS);
  };

  return (
    <section className="admin-metal-report mt-6 rounded-xl border border-[var(--gray-200)] bg-white p-5 print:hidden print:mt-8 print:rounded-none print:border print:border-gray-300 print:p-0 print:bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 print:mb-3">
        <h2 className="text-lg font-bold text-[var(--gray-900)]">
          Содержание металлов
        </h2>
        <button
          type="button"
          onClick={handleInternalPrint}
          className="print:hidden inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--gray-800)] hover:bg-[var(--gray-900)] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Печать внутреннего отчёта
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-3">
            Новые / единый тип
          </h3>
          <MetalValues totals={totals.new} />
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="text-sm font-semibold text-amber-800 mb-3">Б/У</h3>
          <MetalValues totals={totals.used} />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--gray-200)]">
        <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">
          Всего
        </h3>
        <MetalValues totals={totals.all} />
      </div>
    </section>
  );
}
