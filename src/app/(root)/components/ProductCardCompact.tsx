import Image from "next/image";
import Link from "next/link";
import { Package, Sparkles, Recycle } from "lucide-react";
import type { ProductWithPrice } from "@/app/actions";

interface ProductCardCompactProps {
  product: ProductWithPrice;
  categorySlug: string;
}

// Форматирование цены
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProductCardCompact({ product, categorySlug }: ProductCardCompactProps) {
  const hasNewPrice = product.priceNew !== null;
  const hasUsedPrice = product.priceUsed !== null;

  const productUrl = `/catalog/${categorySlug}/${product.slug}`;

  return (
    <Link 
      href={productUrl}
      className="group block bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[var(--gray-100)] overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-16 h-16 text-[var(--gray-300)]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-[var(--gray-800)] group-hover:text-[var(--primary-600)] transition-colors line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Prices */}
        <div className="space-y-1">
          {/* Цена за Новый */}
          {hasNewPrice && (
            <div className="flex items-center justify-between bg-green-50 px-2 py-1.5 rounded-md">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-700">Новый</span>
              </div>
              <span className="font-bold text-green-700">
                {formatPrice(product.priceNew!)}
              </span>
            </div>
          )}
          
          {/* Цена за Б/У */}
          {hasUsedPrice && (
            <div className="flex items-center justify-between bg-amber-50 px-2 py-1.5 rounded-md">
              <div className="flex items-center gap-1">
                <Recycle className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Б/У</span>
              </div>
              <span className="font-bold text-amber-700">
                {formatPrice(product.priceUsed!)}
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
    </Link>
  );
}
