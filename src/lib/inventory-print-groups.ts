export const PRINT_GROUP_IDS = ["km", "silver", "gold", "other"] as const;

export type PrintGroupId = (typeof PRINT_GROUP_IDS)[number];

export const PRINT_GROUP_LABELS: Record<PrintGroupId, string> = {
  km: "КМ-конденсаторы",
  silver: "Техническое серебро",
  gold: "Золотосодержащие детали",
  other: "Прочее",
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/ё/g, "е");
}

function slugEqualsOrPrefixed(slug: string, prefix: string): boolean {
  return slug === prefix || slug.startsWith(`${prefix}-`);
}

export function classifyPrintGroup(input: {
  categorySlug?: string | null;
  categoryName?: string | null;
  productName?: string | null;
  productSlug?: string | null;
}): PrintGroupId {
  const categorySlug = (input.categorySlug ?? "").toLowerCase();
  const productSlug = (input.productSlug ?? "").toLowerCase();
  const categoryName = normalizeText(input.categoryName ?? "");
  const productName = normalizeText(input.productName ?? "");

  const slugOrCatHasKm =
    categorySlug.includes("km") ||
    categoryName.includes("km") ||
    categoryName.includes("км");
  const isCapacitorCategory =
    categorySlug.includes("kondensator") ||
    categoryName.includes("конденсатор");

  if (
    slugEqualsOrPrefixed(categorySlug, "kondensatory-km") ||
    productSlug === "km" ||
    productSlug.startsWith("km-") ||
    (slugOrCatHasKm && isCapacitorCategory) ||
    /км[\s\-]/.test(productName) ||
    (productName.includes("конденсатор") && productName.includes("км"))
  ) {
    return "km";
  }

  if (
    categorySlug.includes("serebro") ||
    productSlug.includes("serebro") ||
    categoryName.includes("серебр") ||
    productName.includes("серебр")
  ) {
    return "silver";
  }

  const goldSlugPrefixes = [
    "tranzistory",
    "mikroshemy",
    "razemy",
    "diody",
    "diod",
  ];
  const isGoldSlug = goldSlugPrefixes.some(
    (prefix) =>
      slugEqualsOrPrefixed(categorySlug, prefix) ||
      slugEqualsOrPrefixed(productSlug, prefix),
  );
  const isGoldName =
    /транзистор/.test(categoryName) ||
    /транзистор/.test(productName) ||
    /микросхем/.test(categoryName) ||
    /микросхем/.test(productName) ||
    /диод/.test(categoryName) ||
    /диод/.test(productName) ||
    /разъем/.test(categoryName) ||
    /разъем/.test(productName);

  if (isGoldSlug || isGoldName) {
    return "gold";
  }

  return "other";
}

export function groupRowsForPrint<T>(
  rows: T[],
  classify: (row: T) => PrintGroupId,
): { id: PrintGroupId; label: string; rows: T[] }[] {
  const buckets: Record<PrintGroupId, T[]> = {
    km: [],
    silver: [],
    gold: [],
    other: [],
  };

  for (const row of rows) {
    buckets[classify(row)].push(row);
  }

  return PRINT_GROUP_IDS.filter((id) => buckets[id].length > 0).map((id) => ({
    id,
    label: PRINT_GROUP_LABELS[id],
    rows: buckets[id],
  }));
}
