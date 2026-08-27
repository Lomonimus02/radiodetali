export const PRINT_GROUP_IDS = [
  "km",
  "silver",
  "chips",
  "connectors",
  "other",
] as const;

export type PrintGroupId = (typeof PRINT_GROUP_IDS)[number];

export const GOLD_BEARING_GROUP_IDS = ["chips", "connectors"] as const;

export type GoldBearingGroupId = (typeof GOLD_BEARING_GROUP_IDS)[number];

export const PRINT_GROUP_LABELS: Record<PrintGroupId, string> = {
  km: "КМ-конденсаторы",
  silver: "Техническое серебро",
  chips: "Транзисторы, микросхемы и диоды",
  connectors: "Разъёмы",
  other: "Прочее",
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/ё/g, "е");
}

function slugEqualsOrPrefixed(slug: string, prefix: string): boolean {
  return slug === prefix || slug.startsWith(`${prefix}-`);
}

export function isGoldBearingGroup(id: PrintGroupId): id is GoldBearingGroupId {
  return id === "chips" || id === "connectors";
}

export function isGoldBearing(input: {
  categorySlug?: string | null;
  categoryName?: string | null;
  productName?: string | null;
  productSlug?: string | null;
}): boolean {
  return isGoldBearingGroup(classifyPrintGroup(input));
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

  const isConnectorSlug =
    slugEqualsOrPrefixed(categorySlug, "razemy") ||
    slugEqualsOrPrefixed(productSlug, "razemy");
  const isConnectorName =
    /разъем/.test(categoryName) || /разъем/.test(productName);

  if (isConnectorSlug || isConnectorName) {
    return "connectors";
  }

  const chipSlugPrefixes = ["tranzistory", "mikroshemy", "diody", "diod"];
  const isChipSlug = chipSlugPrefixes.some(
    (prefix) =>
      slugEqualsOrPrefixed(categorySlug, prefix) ||
      slugEqualsOrPrefixed(productSlug, prefix),
  );
  const isChipName =
    /транзистор/.test(categoryName) ||
    /транзистор/.test(productName) ||
    /микросхем/.test(categoryName) ||
    /микросхем/.test(productName) ||
    /диод/.test(categoryName) ||
    /диод/.test(productName);

  if (isChipSlug || isChipName) {
    return "chips";
  }

  return "other";
}

export function sortNewThenUsed<T>(
  rows: T[],
  getMeta: (row: T) => { isSingleType: boolean; condition: "new" | "used" },
): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const metaA = getMeta(a.row);
      const metaB = getMeta(b.row);
      const keyA = metaA.isSingleType || metaA.condition === "new" ? 0 : 1;
      const keyB = metaB.isSingleType || metaB.condition === "new" ? 0 : 1;
      if (keyA !== keyB) return keyA - keyB;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

export function groupRowsForPrint<T>(
  rows: T[],
  classify: (row: T) => PrintGroupId,
  getMeta?: (row: T) => { isSingleType: boolean; condition: "new" | "used" },
): { id: PrintGroupId; label: string; rows: T[] }[] {
  const buckets: Record<PrintGroupId, T[]> = {
    km: [],
    silver: [],
    chips: [],
    connectors: [],
    other: [],
  };

  for (const row of rows) {
    buckets[classify(row)].push(row);
  }

  return PRINT_GROUP_IDS.filter((id) => buckets[id].length > 0).map((id) => ({
    id,
    label: PRINT_GROUP_LABELS[id],
    rows:
      getMeta && id === "chips"
        ? sortNewThenUsed(buckets[id], getMeta)
        : buckets[id],
  }));
}
