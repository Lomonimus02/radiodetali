"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Calculator, Minus, Plus, X } from "lucide-react";
import type { ProductWithPrice, UnitType } from "@/app/actions";
import { useCartStore, type ItemCondition } from "@/store";
import { useYearPeriodDiscounts } from "./YearDiscountsProvider";
import {
  YEAR_PERIODS,
  getDiscountPercent,
  resolveLineUnitPrice,
  shouldShowCalculator,
  type YearPeriodId,
} from "@/lib/year-discount";

interface CalculatorModalProps {
  product: ProductWithPrice;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getPriceUnitSuffix(unitType: UnitType): string {
  switch (unitType) {
    case "GRAM":
      return "/г.";
    case "KG":
      return "/кг.";
    default:
      return "/шт.";
  }
}

function defaultCondition(product: ProductWithPrice): ItemCondition {
  if (product.isSingleType) return "new";
  if (product.isNewAvailable) return "new";
  return "used";
}

function defaultModificationId(product: ProductWithPrice): string | null {
  if (product.hasModifications && product.modifications.length === 1) {
    return product.modifications[0].id;
  }
  return null;
}

export function CalculatorModal({ product }: CalculatorModalProps) {
  const addLine = useCartStore((state) => state.addLine);
  const [isOpen, setIsOpen] = useState(false);
  const [condition, setCondition] = useState<ItemCondition>(() =>
    defaultCondition(product),
  );
  const [yearPeriodId, setYearPeriodId] = useState<YearPeriodId>("from1990");
  const [quantity, setQuantity] = useState(1);
  const [modificationId, setModificationId] = useState<string | null>(() =>
    defaultModificationId(product),
  );
  const discounts = useYearPeriodDiscounts();
  const [addedNotice, setAddedNotice] = useState(false);
  const pushedRef = useRef(false);
  const closingFromPopRef = useRef(false);
  const noticeTimerRef = useRef<number | null>(null);

  const needsMod =
    product.hasModifications && product.modifications.length > 0;
  const showConditionPicker =
    !product.isSingleType && product.isNewAvailable && product.isUsedAvailable;
  const suffix = getPriceUnitSuffix(product.unitType);
  const discountPercent = getDiscountPercent(discounts, yearPeriodId);
  const canSubmit = !needsMod || Boolean(modificationId);
  const unitPrice = canSubmit
    ? resolveLineUnitPrice(product, modificationId, condition, discountPercent)
    : 0;
  const lineTotal = unitPrice * quantity;

  const close = useCallback((fromPopState = false) => {
    setIsOpen(false);
    setAddedNotice(false);
    if (fromPopState) {
      pushedRef.current = false;
      closingFromPopRef.current = false;
      return;
    }
    if (pushedRef.current && !closingFromPopRef.current) {
      pushedRef.current = false;
      window.history.back();
      return;
    }
    pushedRef.current = false;
  }, []);

  const open = () => {
    setCondition(defaultCondition(product));
    setYearPeriodId("from1990");
    setQuantity(1);
    setModificationId(defaultModificationId(product));
    setAddedNotice(false);
    setIsOpen(true);
    window.history.pushState({ calcModal: true }, "");
    pushedRef.current = true;
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const handlePopState = () => {
      closingFromPopRef.current = true;
      close(true);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, close]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  if (!shouldShowCalculator(product)) {
    return null;
  }

  const handleAdd = () => {
    if (!canSubmit) return;

    addLine({
      productId: product.id,
      modificationId,
      condition,
      yearPeriodId,
      quantity,
    });

    setQuantity(1);
    setAddedNotice(true);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setAddedNotice(false);
    }, 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          open();
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[var(--accent-500)] text-[var(--accent-700)] bg-white hover:bg-[var(--accent-50)] rounded-lg font-semibold transition-colors cursor-pointer"
      >
        <Calculator className="w-4 h-4" />
        Добавить в калькулятор
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => close()}
          />

          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <button
              type="button"
              onClick={() => close()}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-[var(--gray-500)]" />
            </button>

            <div className="p-6">
              <h2 className="text-xl font-bold text-[var(--gray-900)] mb-1 pr-8">
                Калькулятор
              </h2>
              <p className="text-sm text-[var(--gray-500)] mb-5">
                {product.name}
              </p>

              {needsMod && (
                <fieldset className="mb-4">
                  <legend className="text-sm font-medium text-[var(--gray-700)] mb-2">
                    {product.modLabel || "Модификация"}
                  </legend>
                  <select
                    value={modificationId ?? ""}
                    onChange={(e) =>
                      setModificationId(e.target.value || null)
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--gray-300)] bg-white text-[var(--gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                  >
                    <option value="">Выберите {product.modLabel.toLowerCase()}</option>
                    {product.modifications.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.name}
                      </option>
                    ))}
                  </select>
                </fieldset>
              )}

              {showConditionPicker && (
                <fieldset className="mb-4">
                  <legend className="text-sm font-medium text-[var(--gray-700)] mb-2">
                    Состояние
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCondition("new")}
                      className={`px-3 py-2.5 rounded-lg font-semibold border transition-colors ${
                        condition === "new"
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                      }`}
                    >
                      Новые
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition("used")}
                      className={`px-3 py-2.5 rounded-lg font-semibold border transition-colors ${
                        condition === "used"
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                      }`}
                    >
                      Б/У
                    </button>
                  </div>
                </fieldset>
              )}

              <fieldset className="mb-4">
                <legend className="text-sm font-medium text-[var(--gray-700)] mb-2">
                  Год выпуска
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {YEAR_PERIODS.map((period) => {
                    const percent = getDiscountPercent(discounts, period.id);
                    const selected = yearPeriodId === period.id;
                    return (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => setYearPeriodId(period.id)}
                        className={`px-3 py-2.5 rounded-lg font-semibold border text-sm transition-colors ${
                          selected
                            ? "bg-[var(--primary-600)] border-[var(--primary-600)] text-white"
                            : "bg-white border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                        }`}
                      >
                        <span className="block">{period.label}</span>
                        <span
                          className={`block text-xs font-medium mt-0.5 ${
                            selected ? "text-white/80" : "text-[var(--gray-500)]"
                          }`}
                        >
                          {percent > 0 ? `−${percent}%` : "без скидки"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mb-5">
                <legend className="text-sm font-medium text-[var(--gray-700)] mb-2">
                  Количество
                </legend>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--gray-300)] hover:bg-[var(--gray-50)]"
                    aria-label="Уменьшить"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setQuantity(Number.isFinite(value) && value > 0 ? value : 1);
                    }}
                    className="flex-1 h-10 text-center font-semibold rounded-lg border border-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => value + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--gray-300)] hover:bg-[var(--gray-50)]"
                    aria-label="Увеличить"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </fieldset>

              <div className="mb-5 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-200)] px-4 py-3">
                {canSubmit ? (
                  <>
                    <div className="flex justify-between text-sm text-[var(--gray-600)]">
                      <span>Цена за ед.</span>
                      <span className="font-semibold text-[var(--gray-900)] tabular-nums">
                        {formatPrice(unitPrice)}
                        {suffix}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm font-medium text-[var(--gray-700)]">
                        Сумма позиции
                      </span>
                      <span className="text-lg font-bold text-[var(--accent-600)] tabular-nums">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--gray-500)]">
                    Выберите {product.modLabel.toLowerCase()}, чтобы увидеть цену
                  </p>
                )}
              </div>

              {addedNotice && (
                <p className="mb-3 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  Позиция добавлена в опись
                </p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] disabled:bg-[var(--gray-300)] disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  Добавить позицию
                </button>
                <button
                  type="button"
                  onClick={() => close()}
                  className="w-full px-4 py-2.5 border border-[var(--gray-300)] hover:bg-[var(--gray-50)] text-[var(--gray-700)] rounded-lg font-medium transition-colors"
                >
                  Назад
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
