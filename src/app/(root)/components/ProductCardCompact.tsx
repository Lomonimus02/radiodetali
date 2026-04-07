"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, ZoomIn } from "lucide-react";
import type { ProductWithPrice, ModificationWithPrice, UnitType } from "@/app/actions";
import { ImageModal } from "./ImageModal";
import { SellModal } from "./SellModal";
import type { SellModalContactInfo } from "./SellModal";

interface ProductCardCompactProps {
  product: ProductWithPrice;
  categorySlug: string;
  contactInfo?: SellModalContactInfo;
}

// Получить суффикс единицы измерения для цены
function getPriceUnitSuffix(unitType: UnitType): string {
  switch (unitType) {
    case "GRAM": return "/г.";
    case "KG": return "/кг.";
    default: return "/шт.";
  }
}

// Форматирование цены
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Компактная таблица модификаций для карточки в каталоге
function ModificationsTableCompact({
  modifications,
  isSingleType,
  isNewAvailable,
  isUsedAvailable,
  unitType,
}: {
  modifications: ModificationWithPrice[];
  isSingleType: boolean;
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  unitType: UnitType;
}) {
  const suffix = getPriceUnitSuffix(unitType);
  const showUsedColumn = !isSingleType && isNewAvailable && isUsedAvailable;

  return (
    <div className="overflow-hidden">
      {/* Заголовок */}
      <div className="flex items-baseline text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-400)] border-b border-[var(--gray-200)] pb-0.5 mb-0.5">
        <span className="flex-1 min-w-0"></span>
        <span className="shrink-0 text-right w-16">{showUsedColumn ? 'Нов.' : 'Цена'}</span>
        {showUsedColumn && <span className="shrink-0 text-right w-16">Б/У</span>}
      </div>
      {/* Строки */}
      {modifications.map((mod, idx) => {
        const singlePrice = isSingleType || isNewAvailable ? mod.priceNew : mod.priceUsed;
        const isLast = idx === modifications.length - 1;
        return (
          <div
            key={mod.id}
            className={`flex items-baseline py-1 text-xs ${!isLast ? 'border-b border-[var(--gray-200)]' : ''}`}
          >
            <span className="flex-1 min-w-0 text-[var(--gray-700)] truncate pr-1">
              {mod.name}
            </span>
            {showUsedColumn ? (
              <>
                <span className="shrink-0 w-16 text-right font-semibold text-[var(--gray-900)] whitespace-nowrap">
                  {formatPrice(mod.priceNew)}{suffix}
                </span>
                <span className="shrink-0 w-16 text-right font-semibold text-[var(--gray-900)] whitespace-nowrap">
                  {formatPrice(mod.priceUsed)}{suffix}
                </span>
              </>
            ) : (
              <span className="shrink-0 w-16 text-right font-semibold text-[var(--gray-900)] whitespace-nowrap">
                {formatPrice(singlePrice)}{suffix}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ProductCardCompact({ product, categorySlug, contactInfo }: ProductCardCompactProps) {
  const hasNewPrice = product.priceNew !== null;
  const hasUsedPrice = product.priceUsed !== null;
  
  // Стейт для модального окна с изображением
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const productUrl = `/catalog/${categorySlug}/${product.slug}`;

  return (
    <>
      {/* Модальное окно для просмотра изображения */}
      {product.image && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={product.image}
          alt={product.name}
        />
      )}
      
      <div className="group bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Image - клик открывает модалку */}
        <button
          type="button"
          onClick={() => product.image && setIsImageModalOpen(true)}
          className="relative w-full aspect-[3/2] md:aspect-square bg-[var(--gray-100)] overflow-hidden cursor-zoom-in"
          aria-label={`Увеличить изображение ${product.name}`}
        >
          {product.image ? (
            <>
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
              />
              {/* Иконка зума */}
              <div className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4 text-white" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-16 h-16 text-[var(--gray-300)]" />
            </div>
          )}
        </button>

        {/* Content */}
        <div className="p-2 md:p-4">
          {/* Name - клик ведет на страницу товара */}
          <Link href={productUrl}>
            <h3 className="text-sm font-medium text-[var(--gray-900)] hover:text-[var(--primary-600)] transition-colors line-clamp-2 min-h-[2.5rem] cursor-pointer">
              {product.name}
            </h3>
          </Link>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-[var(--gray-500)] mb-5 line-clamp-2">
              {product.description}
            </p>
          )}

        {/* Prices */}
        <div>
          {/* Цена по запросу */}
          {product.isPriceOnRequest ? (
            <div className="flex items-center justify-center px-2 py-2.5 rounded-md bg-slate-100">
              <span className="text-sm font-medium text-slate-500 italic">
                Цена по запросу
              </span>
            </div>
          ) : product.hasModifications && product.modifications.length > 0 ? (
            /* Товар с модификациями — компактная таблица */
            <ModificationsTableCompact
              modifications={product.modifications}
              isSingleType={product.isSingleType}
              isNewAvailable={product.isNewAvailable}
              isUsedAvailable={product.isUsedAvailable}
              unitType={product.unitType}
            />
          ) : (
            /* Обычный товар */
            <div className="space-y-1">
              {hasNewPrice && (
                <div className="flex items-center justify-between px-2 py-1 bg-[var(--gray-100)] border border-[var(--gray-900)] rounded-md">
                  <span className="text-sm font-medium text-[var(--gray-900)]">
                    {product.isSingleType ? 'Цена' : 'Новые'}
                  </span>
                  <span className="text-sm font-bold text-[var(--gray-900)]">
                    {formatPrice(product.priceNew!)}{getPriceUnitSuffix(product.unitType)}
                  </span>
                </div>
              )}
              {hasUsedPrice && !product.isSingleType && (
                <div className="flex items-center justify-between px-2 py-1 bg-[var(--gray-100)] border border-[var(--gray-900)] rounded-md">
                  <span className="text-sm font-medium text-[var(--gray-900)]">Б/У</span>
                  <span className="text-sm font-bold text-[var(--gray-900)]">
                    {formatPrice(product.priceUsed!)}{getPriceUnitSuffix(product.unitType)}
                  </span>
                </div>
              )}
              {!hasNewPrice && !hasUsedPrice && (
                <p className="text-xs text-[var(--gray-400)] italic">
                  Не принимается
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-3">
          <SellModal contactInfo={contactInfo} />
        </div>
      </div>
    </div>
    </>
  );
}
