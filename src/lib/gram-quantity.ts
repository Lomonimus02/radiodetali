export type GramUnitType = "PIECE" | "GRAM" | "KG";

export type GramQuantityProduct = {
  unitType?: GramUnitType | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  slug?: string | null;
  name?: string | null;
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/ё/g, "е");
}

function slugHaystack(product: GramQuantityProduct): string {
  return `${product.categorySlug ?? ""} ${product.slug ?? ""}`.toLowerCase();
}

function nameHaystack(product: GramQuantityProduct): string {
  return normalizeText(
    `${product.categoryName ?? ""} ${product.name ?? ""}`,
  );
}

function isCapacitorSection(product: GramQuantityProduct): boolean {
  return (
    slugHaystack(product).includes("kondensator") ||
    nameHaystack(product).includes("конденсатор")
  );
}

function isTechSilverSection(product: GramQuantityProduct): boolean {
  if (slugHaystack(product).includes("serebro")) return true;
  return nameHaystack(product).includes("серебр");
}

const PGM_SLUG_RE = /palladi|paladi|platin|iridi|rodii|osmi|ruthen|mpg/;
const PGM_NAME_RE = /паллади|платин|ириди|родий|осми|рутен|платинов/;

function isPgmSection(product: GramQuantityProduct): boolean {
  return (
    PGM_SLUG_RE.test(slugHaystack(product)) ||
    PGM_NAME_RE.test(nameHaystack(product))
  );
}

export function usesGramQuantity(product: GramQuantityProduct): boolean {
  if (product.unitType === "KG" || product.unitType === "GRAM") return true;
  return (
    isCapacitorSection(product) ||
    isTechSilverSection(product) ||
    isPgmSection(product)
  );
}

export function quantityToPriceMultiplier(
  quantity: number,
  unitType: GramUnitType | null | undefined,
  gramMode: boolean,
): number {
  const qty = Number.isFinite(quantity) ? quantity : 0;
  if (!gramMode) return qty;
  if (unitType === "GRAM") return qty;
  return qty / 1000;
}

export function lineTotalFromGrams(
  unitPrice: number,
  grams: number,
  unitType?: GramUnitType | null,
): number {
  const price = Number.isFinite(unitPrice) ? unitPrice : 0;
  const multiplier = quantityToPriceMultiplier(grams, unitType, true);
  return Math.round(price * multiplier);
}

export function computeLineTotal(
  unitPrice: number,
  quantity: number,
  product: GramQuantityProduct | null | undefined,
): number {
  if (!product || !usesGramQuantity(product)) {
    return unitPrice * quantity;
  }
  return lineTotalFromGrams(unitPrice, quantity, product.unitType);
}

export function formatInventoryQuantity(
  quantity: number,
  gramMode: boolean,
): string {
  return gramMode ? `${quantity} г.` : String(quantity);
}

export function getInventoryPriceUnitSuffix(
  unitType: GramUnitType | null | undefined,
  gramMode: boolean,
): string {
  if (unitType === "GRAM") return "/г.";
  if (unitType === "KG" || gramMode) return "/кг.";
  return "/шт.";
}
