"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Package,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  Send,
  AlertCircle,
  Printer,
  Calculator,
} from "lucide-react";
import { useCartStore, type InventoryLine, type ItemCondition } from "@/store";
import { useSiteContacts } from "../components/SiteContactsProvider";
import { useYearPeriodDiscounts } from "../components/YearDiscountsProvider";
import {
  getDiscountPercent,
  getYearPeriodLabel,
  resolveLineUnitPrice,
} from "@/lib/year-discount";
import type { ProductWithPrice, ProductsResult, UnitType } from "@/app/actions";
import { AdminMetalReport } from "./AdminMetalReport";

const DEFAULT_VK_URL = "https://vk.com/dragsoyuz";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getConditionLabel(condition: ItemCondition, isSingleType: boolean): string {
  if (isSingleType) return "—";
  return condition === "new" ? "Новые" : "Б/У";
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

interface InventoryRow {
  line: InventoryLine;
  product: ProductWithPrice | null;
  unitPrice: number;
  lineTotal: number;
  displayName: string;
}

export function CartPageClient({ isAdmin }: { isAdmin: boolean }) {
  const items = useCartStore((state) => state.items);
  const updateLineQuantity = useCartStore((state) => state.updateLineQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const clearCart = useCartStore((state) => state.clearCart);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const discounts = useYearPeriodDiscounts();
  const siteContacts = useSiteContacts();
  const vkUrl = siteContacts?.vkHref || DEFAULT_VK_URL;

  const [productsById, setProductsById] = useState<
    Record<string, ProductWithPrice>
  >({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productsByIdRef = useRef(productsById);

  useEffect(() => {
    productsByIdRef.current = productsById;
  }, [productsById]);

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    async function syncCatalog() {
      if (items.length === 0) {
        setInitialLoading(false);
        return;
      }

      const uniqueIds = [...new Set(items.map((item) => item.productId))];
      const missingIds = uniqueIds.filter((id) => !productsByIdRef.current[id]);

      if (missingIds.length === 0) {
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/products-by-ids?ids=${encodeURIComponent(missingIds.join(","))}`,
        );
        const result = (await response.json()) as ProductsResult;
        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          setInitialLoading(false);
          return;
        }

        setProductsById((prev) => {
          const next = { ...prev };
          for (const product of result.data) {
            next[product.id] = product;
          }
          return next;
        });
        setError(null);
        setInitialLoading(false);
      } catch {
        if (cancelled) return;
        setError("Не удалось загрузить товары описи");
        setInitialLoading(false);
      }
    }

    void syncCatalog();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, items]);

  const rows: InventoryRow[] = useMemo(
    () =>
      items.map((line) => {
        const product = productsById[line.productId] ?? null;
        const unitPrice = product
          ? resolveLineUnitPrice(
              product,
              line.modificationId,
              line.condition,
              getDiscountPercent(discounts, line.yearPeriodId),
            )
          : 0;
        const modName = product?.modifications.find(
          (mod) => mod.id === line.modificationId,
        )?.name;
        const displayName = product
          ? modName
            ? `${product.name} (${modName})`
            : product.name
          : "Товар больше не в каталоге";

        return {
          line,
          product,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
          displayName,
        };
      }),
    [items, productsById, discounts],
  );

  const totalSum = rows.reduce((sum, row) => sum + row.lineTotal, 0);
  const totalPieces = rows.reduce((sum, row) => sum + row.line.quantity, 0);

  const handlePrint = () => {
    document.documentElement.classList.remove("print-internal-report");
    window.print();
  };

  const handleSendToVK = () => {
    if (rows.length === 0) return;
    window.open(vkUrl, "_blank");
  };

  if (!hasHydrated || initialLoading) {
    return (
      <div className="min-h-screen bg-[var(--gray-50)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary-500)] border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gray-50)] print:bg-white print:min-h-0">
      <div className="container mx-auto px-4 py-8 print:px-0 print:py-0 print:max-w-none">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-[var(--gray-600)] hover:text-[var(--gray-900)] mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад в каталог
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
              Опись
            </h1>
            <p className="text-[var(--gray-600)] mt-1">
              Позиции для оценки на приёмке
            </p>
          </div>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="flex items-center gap-2 px-4 py-2 text-[var(--gray-600)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Очистить</span>
            </button>
          )}
        </div>

        <div className="hidden print:block mb-4">
          {isAdmin ? (
            <p className="internal-report-title text-sm font-semibold text-gray-500 mb-1">
              Внутренний отчёт
            </p>
          ) : null}
          <h1 className="text-xl font-bold">Опись — ДРАГСОЮЗ</h1>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleString("ru-RU")}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 print:hidden">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-12 text-center print:hidden">
            <Calculator className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-2">
              Опись пуста
            </h2>
            <p className="text-[var(--gray-600)] mb-6">
              Добавьте детали из каталога кнопкой «Добавить в опись»
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-semibold rounded-lg transition-colors"
            >
              <Package className="w-5 h-5" />
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:gap-0">
            <div className="lg:col-span-2 print:w-full">
              <div className="bg-white rounded-xl border border-[var(--gray-200)] overflow-x-auto print:border-0 print:rounded-none">
                <table className="w-full min-w-[640px] text-sm print:min-w-0">
                  <thead>
                    <tr className="bg-[var(--gray-100)] text-left text-[var(--gray-700)] print:bg-transparent">
                      <th className="px-3 py-3 font-semibold w-10">#</th>
                      <th className="px-3 py-3 font-semibold">Название</th>
                      <th className="px-3 py-3 font-semibold">Период</th>
                      <th className="px-3 py-3 font-semibold">Состояние</th>
                      <th className="px-3 py-3 font-semibold text-right">Кол-во</th>
                      <th className="px-3 py-3 font-semibold text-right">Цена/ед.</th>
                      <th className="px-3 py-3 font-semibold text-right">Сумма</th>
                      <th className="px-2 py-3 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={row.line.lineId}
                        className="border-t border-[var(--gray-200)]"
                      >
                        <td className="px-3 py-3 tabular-nums text-[var(--gray-500)]">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 font-medium text-[var(--gray-900)]">
                          {row.product ? (
                            <Link
                              href={`/catalog/${row.product.categorySlug}/${row.product.slug}`}
                              className="hover:text-[var(--primary-600)] print:text-black print:no-underline"
                            >
                              {row.displayName}
                            </Link>
                          ) : (
                            <span className="text-[var(--gray-500)] italic">
                              {row.displayName}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {getYearPeriodLabel(row.line.yearPeriodId)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {getConditionLabel(
                            row.line.condition,
                            row.product?.isSingleType ?? false,
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="inline-flex items-center gap-1 print:hidden">
                            <button
                              type="button"
                              onClick={() =>
                                updateLineQuantity(
                                  row.line.lineId,
                                  row.line.quantity - 1,
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center rounded border border-[var(--gray-200)] hover:bg-[var(--gray-50)]"
                              aria-label="Уменьшить"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={row.line.quantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                updateLineQuantity(
                                  row.line.lineId,
                                  Number.isFinite(value) ? value : 1,
                                );
                              }}
                              className="w-12 h-7 text-center font-semibold bg-transparent border-none outline-none tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateLineQuantity(
                                  row.line.lineId,
                                  row.line.quantity + 1,
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center rounded border border-[var(--gray-200)] hover:bg-[var(--gray-50)]"
                              aria-label="Увеличить"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="hidden print:inline tabular-nums">
                            {row.line.quantity}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                          {formatPrice(row.unitPrice)}
                          {row.product
                            ? getPriceUnitSuffix(row.product.unitType)
                            : ""}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                          {formatPrice(row.lineTotal)}
                        </td>
                        <td className="px-2 py-3 print:hidden">
                          <button
                            type="button"
                            onClick={() => removeLine(row.line.lineId)}
                            className="w-8 h-8 flex items-center justify-center text-[var(--gray-400)] hover:text-red-500 hover:bg-red-50 rounded"
                            title="Удалить строку"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[var(--gray-900)]">
                      <td
                        colSpan={6}
                        className="px-3 py-3 text-right font-medium"
                      >
                        Итого
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-lg tabular-nums">
                        {formatPrice(totalSum)}
                      </td>
                      <td className="print:hidden" />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {isAdmin ? (
                <AdminMetalReport lines={items} productsById={productsById} />
              ) : null}
            </div>

            <div className="lg:col-span-1 print:hidden">
              <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6 sticky top-24">
                <h2 className="text-lg font-bold text-[var(--gray-900)] mb-4">
                  Итого
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[var(--gray-600)]">
                    <span>Строк:</span>
                    <span>{rows.length}</span>
                  </div>
                  <div className="flex justify-between text-[var(--gray-600)]">
                    <span>Всего единиц:</span>
                    <span>{totalPieces}</span>
                  </div>
                  <div className="pt-3 border-t border-[var(--gray-200)]">
                    <div className="flex justify-between items-end">
                      <span className="text-[var(--gray-900)] font-medium">
                        Сумма описи:
                      </span>
                      <span className="text-2xl font-bold text-[var(--accent-600)] tabular-nums">
                        {formatPrice(totalSum)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold rounded-lg transition-colors"
                  >
                    <Printer className="w-5 h-5" />
                    Печать / сохранить
                  </button>

                  <button
                    type="button"
                    onClick={handleSendToVK}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    Написать в VK
                  </button>

                  <Link
                    href="/contacts"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[var(--gray-300)] hover:bg-[var(--gray-50)] text-[var(--gray-700)] font-medium rounded-lg transition-colors"
                  >
                    Связаться по телефону
                  </Link>
                </div>

                <p className="text-xs text-[var(--gray-500)] mt-4 text-center">
                  Цены с учётом года выпуска актуальны на момент просмотра.
                  Окончательная сумма определяется при оценке.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
