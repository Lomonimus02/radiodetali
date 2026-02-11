"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import type { ProductWithPrice, UnitType } from "@/app/actions";
import { ImageModal } from "./ImageModal";

type ProductCardVariant = "default" | "showcase";

interface ProductCardProps {
  product: ProductWithPrice;
  categorySlug?: string; // Optional: if provided, use category-based URL
  categoryName?: string; // For showcase variant: category name to display
  variant?: ProductCardVariant; // default - with buttons; showcase - navigation tile for home page
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

export function ProductCard({ product, categorySlug, categoryName, variant = "default" }: ProductCardProps) {
  const hasNewPrice = product.priceNew !== null;
  const hasUsedPrice = product.priceUsed !== null;
  
  // Стейт для модального окна с изображением (должен быть ДО любых условных return)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // For showcase variant - link to category; for default - link to product
  const cardUrl = variant === "showcase" && categorySlug
    ? `/catalog/${categorySlug}`
    : categorySlug 
      ? `/catalog/${categorySlug}/${product.slug}`
      : `/catalog/${product.slug}`;

  // Showcase variant - simplified navigation tile for home page
  if (variant === "showcase") {
    return (
      <Link 
        href={cardUrl}
        className="group block bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
        {/* Image - larger aspect ratio for showcase */}
        <div className="relative aspect-[4/3] bg-[var(--gray-100)] overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={categoryName || product.categoryName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 16vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-16 h-16 text-[var(--gray-300)]" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Category name on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-bold text-white drop-shadow-lg">
              {categoryName || product.categoryName}
            </h3>
          </div>
          
          {/* Arrow indicator */}
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <ArrowRight className="w-4 h-4 text-[var(--primary-600)]" />
          </div>
        </div>
      </Link>
    );
  }

  // Default variant - full product card with buttons
  const productUrl = cardUrl;

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
      
      <div className="group block bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Image - клик открывает модалку */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (product.image) setIsImageModalOpen(true);
          }}
          className="w-full cursor-zoom-in"
          aria-label={`Увеличить изображение ${product.name}`}
        >
          <div className="relative aspect-square bg-[var(--gray-100)] overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-16 h-16 text-[var(--gray-300)]" />
              </div>
            )}
            {/* Category badge */}
            <span className="absolute top-2 left-2 px-2 py-1 bg-[var(--primary-900)]/80 text-white text-xs rounded-md backdrop-blur-sm">
              {product.categoryName}
            </span>
          </div>
        </button>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <Link href={productUrl}>
          <h3 className="font-semibold text-[var(--gray-800)] group-hover:text-[var(--primary-600)] transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-[var(--gray-500)] mb-5 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Prices - показываем обе цены */}
        <div className="mb-3 space-y-1">
          {/* Цена по запросу */}
          {product.isPriceOnRequest ? (
            <div className="flex items-center justify-center px-2 py-2.5 rounded-md bg-slate-100">
              <span className="text-sm font-medium text-slate-500 italic">
                Цена по запросу
              </span>
            </div>
          ) : (
            <>
              {/* Цена за Новый / Единая цена */}
              {hasNewPrice && (
                <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-green-50">
                  <span className="text-xs font-medium text-green-700">
                    {product.isSingleType ? 'Цена' : 'Новый'}
                  </span>
                  <span className="font-bold text-green-700">
                    {formatPrice(product.priceNew!)}{getPriceUnitSuffix(product.unitType)}
                  </span>
                </div>
              )}
              
              {/* Цена за Б/У (скрываем для единой цены) */}
              {hasUsedPrice && !product.isSingleType && (
                <div className="flex items-center justify-between bg-amber-50 px-2 py-1.5 rounded-md">
                  <span className="text-xs font-medium text-amber-700">Б/У</span>
                  <span className="font-bold text-amber-700">
                    {formatPrice(product.priceUsed!)}{getPriceUnitSuffix(product.unitType)}
                  </span>
                </div>
              )}

              {/* Если ничего не принимается */}
              {!hasNewPrice && !hasUsedPrice && (
                <p className="text-sm text-[var(--gray-400)] italic">
                  Не принимается
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
