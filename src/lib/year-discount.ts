type LineCondition = "new" | "used";

interface PricedModification {
  id: string;
  priceNew: number;
  priceUsed: number;
}

interface PricedProduct {
  isPriceOnRequest: boolean;
  hasModifications: boolean;
  modifications: PricedModification[];
  priceNew: number | null;
  priceUsed: number | null;
  isSingleType: boolean;
}

export const YEAR_PERIOD_IDS = [
  "until1990",
  "from1990",
  "from2000",
  "from2010",
] as const;

export type YearPeriodId = (typeof YEAR_PERIOD_IDS)[number];

export type YearPeriodDiscounts = Record<YearPeriodId, number>;

export const YEAR_PERIODS: { id: YearPeriodId; label: string }[] = [
  { id: "until1990", label: "до 1990" },
  { id: "from1990", label: "с 1990" },
  { id: "from2000", label: "с 2000" },
  { id: "from2010", label: "с 2010" },
];

export const DEFAULT_YEAR_PERIOD_DISCOUNTS: YearPeriodDiscounts = {
  until1990: 0,
  from1990: 10,
  from2000: 10,
  from2010: 10,
};

export function getYearPeriodLabel(id: YearPeriodId): string {
  return YEAR_PERIODS.find((period) => period.id === id)?.label ?? id;
}

export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function parseYearPeriodDiscounts(raw: unknown): YearPeriodDiscounts {
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const result = { ...DEFAULT_YEAR_PERIOD_DISCOUNTS };

  for (const id of YEAR_PERIOD_IDS) {
    const value = source[id];
    if (typeof value === "number" && Number.isFinite(value)) {
      result[id] = clampDiscountPercent(value);
    } else if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        result[id] = clampDiscountPercent(parsed);
      }
    }
  }

  return result;
}

/**
 * Overlay годовой скидки поверх уже посчитанной витринной цены.
 * Не использует формулы из price-calculator.ts.
 */
export function applyYearDiscount(
  basePrice: number,
  discountPercent: number,
): number {
  const base = Number.isFinite(basePrice) ? basePrice : 0;
  return Math.round(base * (1 - clampDiscountPercent(discountPercent) / 100));
}

export function getDiscountPercent(
  discounts: YearPeriodDiscounts,
  yearPeriodId: YearPeriodId,
): number {
  return clampDiscountPercent(
    discounts[yearPeriodId] ?? DEFAULT_YEAR_PERIOD_DISCOUNTS[yearPeriodId],
  );
}

export function resolveLineDiscountPercent(
  line: {
    yearPeriodId: YearPeriodId;
    customDiscountPercent?: number | null;
  },
  discounts: YearPeriodDiscounts,
): number {
  if (
    typeof line.customDiscountPercent === "number" &&
    Number.isFinite(line.customDiscountPercent)
  ) {
    return clampDiscountPercent(line.customDiscountPercent);
  }

  return getDiscountPercent(discounts, line.yearPeriodId);
}

export function resolveLineBasePrice(
  product: PricedProduct,
  modificationId: string | null,
  condition: LineCondition,
): number {
  const mod = modificationId
    ? product.modifications.find((item) => item.id === modificationId)
    : undefined;

  if (mod) {
    if (product.isSingleType || condition === "new") {
      return mod.priceNew;
    }
    return mod.priceUsed;
  }

  if (product.isSingleType || condition === "new") {
    return product.priceNew ?? 0;
  }

  return product.priceUsed ?? 0;
}

export function resolveLineUnitPrice(
  product: PricedProduct,
  modificationId: string | null,
  condition: LineCondition,
  discountPercent: number,
): number {
  return applyYearDiscount(
    resolveLineBasePrice(product, modificationId, condition),
    discountPercent,
  );
}

export function shouldShowCalculator(product: PricedProduct): boolean {
  if (product.isPriceOnRequest) return false;

  if (product.hasModifications && product.modifications.length > 0) {
    return true;
  }

  return product.priceNew !== null || product.priceUsed !== null;
}
