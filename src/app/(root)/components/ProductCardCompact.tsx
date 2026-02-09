"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Sparkles, Recycle, Tag, ZoomIn } from "lucide-react";
import type { ProductWithPrice, UnitType } from "@/app/actions";
import { ImageModal } from "./ImageModal";

interface ProductCardCompactProps {
  product: ProductWithPrice;
  categorySlug: string;
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

export function ProductCardCompact({ product, categorySlug }: ProductCardCompactProps) {
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
          className="relative w-full aspect-square bg-[var(--gray-100)] overflow-hidden cursor-zoom-in"
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
        <div className="p-4">
          {/* Name - клик ведет на страницу товара */}
          <Link href={productUrl}>
            <h3 className="font-semibold text-[var(--gray-800)] hover:text-[var(--primary-600)] transition-colors line-clamp-2 min-h-[2.5rem] cursor-pointer">
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
        <div className="space-y-1">
          {/* Цена за Новый / Единая цена */}
          {hasNewPrice && (
            <div className={`flex items-center justify-between px-2 py-1.5 rounded-md ${product.isSingleType ? 'bg-blue-50' : 'bg-green-50'}`}>
              <div className="flex items-center gap-1">
                {product.isSingleType ? (
                  <Tag className="w-3 h-3 text-blue-600" />
                ) : (
                  <Sparkles className="w-3 h-3 text-green-600" />
                )}
                <span className={`text-xs font-medium ${product.isSingleType ? 'text-blue-700' : 'text-green-700'}`}>
                  {product.isSingleType ? 'Цена' : 'Новый'}
                </span>
              </div>
              <span className={`font-bold ${product.isSingleType ? 'text-blue-700' : 'text-green-700'}`}>
                {formatPrice(product.priceNew!)}{getPriceUnitSuffix(product.unitType)}
              </span>
            </div>
          )}
          
          {/* Цена за Б/У (скрываем для единой цены) */}
          {hasUsedPrice && !product.isSingleType && (
            <div className="flex items-center justify-between bg-amber-50 px-2 py-1.5 rounded-md">
              <div className="flex items-center gap-1">
                <Recycle className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Б/У</span>
              </div>
              <span className="font-bold text-amber-700">
                {formatPrice(product.priceUsed!)}{getPriceUnitSuffix(product.unitType)}
              </span>
            </div>
          )}

          {/* Если ничего не принимается */}
          {!hasNewPrice && !hasUsedPrice && (
            <p className="text-xs text-[var(--gray-400)] italic">
              Не принимается
            </p>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
